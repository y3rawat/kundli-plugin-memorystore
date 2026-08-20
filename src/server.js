import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { generateKundli } from './chartCalculator.js';
import { analyzeVideoWithKundli } from './aiSynthesizer.js';
import { firebaseStore } from './firebaseStore.js';
import { renderSetupPage } from './views/setupPage.js';
import { renderResultViewerPage } from './views/resultViewerPage.js';
import { sendCallbackResult } from './callbackSender.js';

const app = express();
const PORT = process.env.PORT || 3000;
const PLUGIN_SECRET = process.env.PLUGIN_SECRET || '';

function resolveBaseUrl(req) {
    if (process.env.APP_BASE_URL) {
        return process.env.APP_BASE_URL.replace(/\/+$/, '');
    }
    if (process.env.VERCEL_URL) {
        const raw = process.env.VERCEL_URL.trim();
        return raw.startsWith('http') ? raw.replace(/\/+$/, '') : `https://${raw.replace(/\/+$/, '')}`;
    }
    const host = req ? req.get('host') : `localhost:${PORT}`;
    const protocol = req ? (req.headers['x-forwarded-proto'] || req.protocol || 'http') : 'http';
    return `${protocol}://${host}`.replace(/\/+$/, '');
}

app.use(cors());

// Capture raw body for HMAC signature verification
app.use(express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf.toString('utf8');
    }
}));

app.use(express.urlencoded({ extended: true }));

// ─────────────────────────── Health Check ───────────────────────────
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        plugin: 'memorystore-astrology-plugin',
        features: ['swiss_ephemeris_jpl_de441', 'fastapi_external_support', 'milestone_reporting', 'time_independent_chandra_kundali']
    });
});

// ─────────────────────────── Setup Page (Iframe Modal) ───────────────────────────
app.get('/setup', async (req, res) => {
    const userId = req.query.user_id || 'usr_direct';
    const installationId = req.query.installation_id || '';
    const queryGeminiKey = req.query.gemini_api_key || req.query.ai_key || '';
    const hasAiKey = req.query.has_ai_key === 'true' || Boolean(queryGeminiKey);

    let existingConfig = {};
    try {
        const profile = await firebaseStore.getUserProfile(`profile_${userId}`);
        if (profile) {
            existingConfig = {
                dob: profile.dob,
                tob: profile.tob,
                has_exact_time: profile.has_exact_time,
                place_name: profile.place_name,
                latitude: profile.latitude,
                longitude: profile.longitude,
                timezoneOffset: profile.timezone_offset,
                moon_sign: profile.moon_sign?.sign || profile.moon_sign?.signName,
                gemini_api_key: profile.gemini_api_key
            };
        }
    } catch (err) {
        console.warn('[SetupPage] Could not load existing profile:', err.message);
    }

    const html = renderSetupPage({
        userId,
        installationId,
        existingConfig,
        queryGeminiKey,
        hasAiKey
    });

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
});

// ─────────────────────────── Save Setup Chart API ───────────────────────────
app.post('/api/setup-chart', async (req, res) => {
    try {
        const {
            userId = 'usr_direct',
            dob,
            tob = '12:00',
            hasExactTime = true,
            placeName = 'New Delhi, India',
            latitude = 28.6139,
            longitude = 77.2090,
            timezoneOffsetHours = 5.5,
            knownMoonSign = null,
            knownSunSign = null,
            geminiApiKey = null
        } = req.body;

        if (!dob) {
            return res.status(400).json({ success: false, message: 'Date of birth is required' });
        }

        const chart = await generateKundli({
            dob,
            tob: hasExactTime ? tob : '12:00',
            hasExactTime: Boolean(hasExactTime),
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            timezoneOffsetHours: parseFloat(timezoneOffsetHours),
            placeName,
            knownMoonSign,
            knownSunSign
        });

        const profileId = `profile_${userId}`;
        const profileData = {
            user_id: userId,
            dob,
            tob: hasExactTime ? tob : 'Unknown',
            has_exact_time: Boolean(hasExactTime),
            place_name: placeName,
            latitude: chart.birthDetails.latitude,
            longitude: chart.birthDetails.longitude,
            timezone_offset: chart.birthDetails.timezoneOffsetHours,
            known_moon_sign: knownMoonSign,
            gemini_api_key: geminiApiKey,
            chartMode: chart.chartMode,
            lagna: chart.ascendant,
            moon_sign: chart.planetaryPositions.Moon,
            sun_sign: chart.planetaryPositions.Sun,
            chart
        };

        await firebaseStore.saveUserProfile(profileId, profileData);

        return res.json({
            success: true,
            profileId,
            dob,
            hasExactTime: Boolean(hasExactTime),
            lagna: hasExactTime ? (chart.ascendant?.signName || 'Unknown') : `Chandra Lagna (${chart.moonSign})`,
            moonSign: chart.moonSign,
            sunSign: chart.sunSign,
            placeName,
            verification: chart.verification,
            chartSummary: chart.formattedSummary
        });
    } catch (err) {
        console.error('[SetupAPI] Error generating chart:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

// ─────────────────────────── Webhook Trigger ───────────────────────────
app.post('/webhook', async (req, res) => {
    const signatureHeader = req.headers['x-plugin-signature'] || '';
    const rawBody = req.rawBody || JSON.stringify(req.body);

    if (PLUGIN_SECRET) {
        const expectedSig = crypto.createHmac('sha256', PLUGIN_SECRET).update(rawBody).digest('hex');
        const formattedExpected = `sha256=${expectedSig}`;

        if (signatureHeader && signatureHeader !== formattedExpected) {
            console.warn('[Webhook] Signature verification failed!');
            return res.status(401).json({ error: 'Invalid HMAC signature' });
        }
    }

    const payload = req.body;
    const { result_id, callback_url, memory, user_config: userConfig, user, milestones: incomingMilestones } = payload;

    if (!result_id || !callback_url) {
        return res.status(400).json({ error: 'result_id and callback_url are required' });
    }

    const serverBaseUrl = resolveBaseUrl(req);
    console.log(`[Webhook] Received trigger for result ${result_id} | Memory: "${memory?.title || memory?.url}"`);

    // Process job safely (awaited directly for serverless runtime reliability)
    try {
        const jobResult = await processAstrologyVideoJob({
            resultId: result_id,
            callbackUrl: callback_url,
            memory,
            userConfig,
            userId: user?.id,
            serverBaseUrl,
            milestones: incomingMilestones || payload.plugin?.milestones || []
        });

        res.status(200).json({
            status: 'completed',
            result_id,
            result_url: jobResult?.resultUrl,
            message: 'Astrology video analysis completed and dispatched'
        });
    } catch (err) {
        console.error(`[WebhookWorker] Failed processing result ${result_id}:`, err);
        res.status(500).json({ error: err.message, result_id });
    }
});

// ─────────────────────────── Interactive Result Viewer ───────────────────────────
app.get('/view/:resultId', async (req, res) => {
    const resultId = req.params.resultId;
    const analysis = await firebaseStore.getAnalysisResult(resultId);

    let profile = null;
    if (analysis?.profile_id) {
        profile = await firebaseStore.getUserProfile(analysis.profile_id);
    }

    const html = renderResultViewerPage({
        analysis,
        profile
    });

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
});

// ─────────────────────────── Real-Time Milestone Reporter ───────────────────────────
async function sendMilestoneStatusUpdate({ callbackUrl, resultId, milestoneId, statusMessage, completedMilestones = [] }) {
    if (!callbackUrl || !resultId) return;
    const statusUpdateUrl = callbackUrl.replace(/\/results\/callback$/, '/results/status-update');

    try {
        const bodyObj = {
            result_id: resultId,
            milestone_id: milestoneId,
            status_message: statusMessage,
            completed_milestones: completedMilestones
        };
        const bodyStr = JSON.stringify(bodyObj);

        const headers = { 'Content-Type': 'application/json' };
        if (PLUGIN_SECRET) {
            const sig = crypto.createHmac('sha256', PLUGIN_SECRET).update(bodyStr).digest('hex');
            headers['X-Plugin-Signature'] = `sha256=${sig}`;
        }

        await fetch(statusUpdateUrl, {
            method: 'POST',
            headers,
            body: bodyStr
        });
        console.log(`[MilestoneUpdate] Reported step "${milestoneId}" for result ${resultId}`);
    } catch (e) {
        console.warn(`[MilestoneUpdate] Non-blocking status report notice:`, e.message);
    }
}

// ─────────────────────────── Background Async Worker ───────────────────────────
async function processAstrologyVideoJob({ resultId, callbackUrl, memory, userConfig, userId, serverBaseUrl, milestones = [] }) {
    console.log(`[Worker] Starting job for result ${resultId}...`);

    const m1 = milestones[0]?.id || 'video_received_analyzing_reel';
    const m2 = milestones[1]?.id || 'comparing_astrologer_s_claims_with_your_kundli';
    const m3 = milestones[2]?.id || 'checking_activated_houses_transit_impact';
    const m4 = milestones[3]?.id || 'preparing_personalized_remedies_advice';

    // Milestone 1: Video Received & Initializing
    await sendMilestoneStatusUpdate({
        callbackUrl,
        resultId,
        milestoneId: m1,
        statusMessage: 'Video received. Loading Vedic birth chart...',
        completedMilestones: []
    });

    // 1. Retrieve User Chart
    let profile = null;
    if (userConfig?.profile_id) {
        profile = await firebaseStore.getUserProfile(userConfig.profile_id);
    }

    if (!profile && userId) {
        profile = await firebaseStore.getUserProfile(`profile_${userId}`);
    }

    if (!profile && userConfig?.dob) {
        const chart = await generateKundli({
            dob: userConfig.dob,
            tob: userConfig.tob || '12:00',
            hasExactTime: userConfig.has_exact_time !== false,
            knownMoonSign: userConfig.moon_sign
        });
        profile = {
            dob: userConfig.dob,
            has_exact_time: userConfig.has_exact_time !== false,
            chart
        };
    }

    if (!profile) {
        const defaultChart = await generateKundli({ dob: '1998-07-22', tob: '14:30' });
        profile = { dob: '1998-07-22', chart: defaultChart };
    }

    // Milestone 2: Comparing claims with Kundli
    await sendMilestoneStatusUpdate({
        callbackUrl,
        resultId,
        milestoneId: m2,
        statusMessage: 'Matching astrologer claims with your Lagna & Moon sign...',
        completedMilestones: [
            { id: m1, label: 'Video received & analyzing reel', completed_at: new Date().toISOString() }
        ]
    });

    // 2. Resolve User's Gemini AI Key
    const apiKey = userConfig?.gemini_api_key
        || userConfig?.ai_key
        || memory?.gemini_api_key
        || profile?.gemini_api_key
        || process.env.GEMINI_API_KEY
        || null;

    const analysisReport = await analyzeVideoWithKundli({
        videoData: memory || {},
        kundliData: profile.chart || {},
        apiKey
    });

    // Milestone 3: Checking Activated Houses & Transit Impact
    await sendMilestoneStatusUpdate({
        callbackUrl,
        resultId,
        milestoneId: m3,
        statusMessage: 'Calculating transit score & affected life areas...',
        completedMilestones: [
            { id: m1, label: 'Video received & analyzing reel', completed_at: new Date().toISOString() },
            { id: m2, label: "Comparing astrologer's claims with your Kundli", completed_at: new Date().toISOString() }
        ]
    });

    // 3. Save to Firebase
    const analysisRecord = {
        ...analysisReport,
        profile_id: userConfig?.profile_id || `profile_${userId}`,
        memory_id: memory?.id,
        memory_title: memory?.title,
        memory_url: memory?.url
    };
    await firebaseStore.saveAnalysisResult(resultId, analysisRecord);

    // Milestone 4: Preparing Remedies & Finalizing
    await sendMilestoneStatusUpdate({
        callbackUrl,
        resultId,
        milestoneId: m4,
        statusMessage: 'Preparing personalized remedies & summary...',
        completedMilestones: [
            { id: m1, label: 'Video received & analyzing reel', completed_at: new Date().toISOString() },
            { id: m2, label: "Comparing astrologer's claims with your Kundli", completed_at: new Date().toISOString() },
            { id: m3, label: 'Checking activated houses & transit impact', completed_at: new Date().toISOString() }
        ]
    });

    // 4. Dispatch Final Callback to MemoryStore
    const base = serverBaseUrl || resolveBaseUrl();
    const resultUrl = `${base}/view/${resultId}`;

    const callbackResponse = await sendCallbackResult({
        callbackUrl,
        secret: PLUGIN_SECRET,
        resultId,
        resultUrl,
        resultData: {
            topic: analysisReport.topic,
            matchScore: analysisReport.matchScore,
            verdict: analysisReport.verdict,
            takeaway: analysisReport.actionableTakeaway,
            affectedHousesCount: analysisReport.affectedHouses?.length || 0
        },
        status: 'completed'
    });

    console.log(`[Worker] Completed result ${resultId} | Callback status: ${callbackResponse.status} | URL: ${resultUrl}`);

    return {
        resultId,
        resultUrl,
        analysisReport,
        callbackStatus: callbackResponse.status
    };
}

// ─────────────────────────── Server Start ───────────────────────────
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        const base = resolveBaseUrl();
        console.log(`\n=================================================`);
        console.log(`🪐 MemoryStore Astrology Plugin Server Running!`);
        console.log(`🚀 Port: ${PORT}`);
        console.log(`🔗 Setup Page: ${base}/setup`);
        console.log(`📩 Webhook URL: ${base}/webhook`);
        console.log(`=================================================\n`);
    });
}

export default app;
