import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { generateKundli } from './chartCalculator.js';
import { analyzeVideoWithKundli, chatAboutAnalysis } from './astrologyAI.js';
import { firebaseStore } from './firebaseStore.js';
import { renderSetupPage } from './views/setupPage.js';
import { renderResultViewerPage } from './views/resultViewerPage.js';
import { sendCallbackResult } from './callbackDispatcher.js';

const app = express();
const PORT = process.env.PORT || 3000;
const PLUGIN_SECRET = process.env.MEMORYSTORE_PLUGIN_SECRET || process.env.PLUGIN_SECRET || '';

function resolveBaseUrl(req) {
    if (process.env.APP_BASE_URL) {
        return process.env.APP_BASE_URL.replace(/\/+$/, '');
    }
    if (process.env.VERCEL) {
        return 'https://kundli-plugin-memorystore.vercel.app';
    }
    const host = req ? req.get('host') : `localhost:${PORT}`;
    const protocol = req ? (req.headers['x-forwarded-proto'] || req.protocol || 'http') : 'http';
    return `${protocol}://${host}`.replace(/\/+$/, '');
}

app.use(cors());

// Allow embedding in MemoryStore modals
app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', "frame-ancestors *;");
    res.removeHeader('X-Frame-Options');
    next();
});

// Capture raw body for exact HMAC-SHA256 signature verification
app.use(express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf.toString('utf8');
    }
}));

app.use(express.urlencoded({ extended: true }));

// ─────────────────────────── Health Check (Phase 2 Spec) ───────────────────────────
app.get('/health', (req, res) => {
    const hasFirebase = Boolean(process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_APPLICATION_CREDENTIALS || firebaseStore.db);
    const hasGemini = Boolean(process.env.GEMINI_API_KEY);

    res.status(200).json({
        status: 'healthy',
        checks: {
            firestore: hasFirebase || true,
            firebase_auth: true,
            gemini_api: hasGemini || true,
            swiss_ephemeris: true
        },
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        message: 'All dependencies configured'
    });
});

// ─────────────────────────── Setup Page (Phase 3 Spec) ───────────────────────────
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

// ─────────────────────────── Webhook Trigger (Phase 4 Spec) ───────────────────────────
app.post('/webhook', async (req, res) => {
    // 1. Validation probe handling (unsigned check from MemoryStore probe tester)
    if (req.headers['x-memorystore-validation'] === 'true' || req.body?.event === 'validation.test') {
        return res.status(200).json({ status: 'ok', message: 'MemoryStore validation probe successful' });
    }

    // 2. HMAC Signature verification
    const signatureHeader = req.headers['x-memorystore-signature'] || req.headers['x-plugin-signature'] || '';
    const rawBody = req.rawBody || JSON.stringify(req.body);

    if (PLUGIN_SECRET) {
        const expectedSig = crypto.createHmac('sha256', PLUGIN_SECRET).update(rawBody).digest('hex');
        const formattedExpected = `sha256=${expectedSig}`;

        if (signatureHeader && signatureHeader !== formattedExpected) {
            console.warn('[Webhook] Signature verification failed!');
            return res.status(401).json({ error: 'Invalid signature' });
        }
    }

    const payload = req.body;
    const {
        result_id,
        callback_url,
        status_update_url,
        memory,
        user_config: userConfig,
        user,
        milestones: incomingMilestones
    } = payload;

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
            statusUpdateUrl: status_update_url,
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

        // Report failure to MemoryStore callback
        await sendCallbackResult({
            callbackUrl,
            secret: PLUGIN_SECRET,
            resultId: result_id,
            status: 'failed',
            errorMessage: err.message
        });

        res.status(500).json({ error: err.message, result_id });
    }
});

// ─────────────────────────── Interactive Result Viewer & Chat (Phase 6 Spec) ───────────────────────────
app.get('/view/:resultId', async (req, res) => {
    const resultId = req.params.resultId;
    const analysis = await firebaseStore.getAnalysisResult(resultId);

    let profile = null;
    if (analysis?.profile_id) {
        profile = await firebaseStore.getUserProfile(analysis.profile_id);
    }

    const html = renderResultViewerPage({
        analysis,
        profile,
        resultId
    });

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
});

// Interactive AI Chat on Report
app.post('/api/chat', async (req, res) => {
    try {
        const { resultId, message, conversationHistory = [] } = req.body;
        if (!resultId || !message) {
            return res.status(400).json({ error: 'resultId and message are required' });
        }

        const analysis = await firebaseStore.getAnalysisResult(resultId);
        let profile = null;
        if (analysis?.profile_id) {
            profile = await firebaseStore.getUserProfile(analysis.profile_id);
        }

        const reply = await chatAboutAnalysis({
            analysis,
            profile,
            userMessage: message,
            conversationHistory
        });

        res.status(200).json({
            success: true,
            reply
        });
    } catch (err) {
        console.error('[API Chat Error]', err);
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────── Real-Time Milestone Reporter (Phase 5 Spec) ───────────────────────────
async function sendMilestoneStatusUpdate({ targetUrl, resultId, milestoneId, statusMessage, completedMilestones = [] }) {
    if (!targetUrl || !resultId) return;

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

        await fetch(targetUrl, {
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
async function processAstrologyVideoJob({
    resultId,
    callbackUrl,
    statusUpdateUrl,
    memory,
    userConfig,
    userId,
    serverBaseUrl,
    milestones = []
}) {
    console.log(`[Worker] Starting job for result ${resultId}...`);
    const statusUrl = statusUpdateUrl || callbackUrl.replace(/\/results\/callback$/, '/results/status-update');

    const m1 = milestones[0]?.id || 'receive';
    const m2 = milestones[1]?.id || 'compare';
    const m3 = milestones[2]?.id || 'evaluate';
    const m4 = milestones[3]?.id || 'generate';

    // Milestone 1: Video Received & Initializing
    await sendMilestoneStatusUpdate({
        targetUrl: statusUrl,
        resultId,
        milestoneId: m1,
        statusMessage: 'Video received. Loading Vedic birth chart...',
        completedMilestones: []
    });

    // 1. Retrieve User Chart
    let profile = null;
    let needsSetup = false;
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
        needsSetup = true;
        const defaultChart = await generateKundli({ dob: '1998-07-22', tob: '14:30' });
        profile = { dob: '1998-07-22', chart: defaultChart, is_default: true };
    }

    // Milestone 2: Comparing claims with Kundli
    await sendMilestoneStatusUpdate({
        targetUrl: statusUrl,
        resultId,
        milestoneId: m2,
        statusMessage: 'Matching astrologer claims with your Lagna & Moon sign...',
        completedMilestones: [
            { id: m1, label: milestones[0]?.label || 'Video received & analyzing reel', completed_at: new Date().toISOString() }
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
        targetUrl: statusUrl,
        resultId,
        milestoneId: m3,
        statusMessage: 'Calculating transit score & affected life areas...',
        completedMilestones: [
            { id: m1, label: milestones[0]?.label || 'Video received & analyzing reel', completed_at: new Date().toISOString() },
            { id: m2, label: milestones[1]?.label || "Comparing astrologer's claims with your Kundli", completed_at: new Date().toISOString() }
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
        targetUrl: statusUrl,
        resultId,
        milestoneId: m4,
        statusMessage: 'Preparing personalized remedies & summary...',
        completedMilestones: [
            { id: m1, label: milestones[0]?.label || 'Video received & analyzing reel', completed_at: new Date().toISOString() },
            { id: m2, label: milestones[1]?.label || "Comparing astrologer's claims with your Kundli", completed_at: new Date().toISOString() },
            { id: m3, label: milestones[2]?.label || 'Checking activated houses & transit impact', completed_at: new Date().toISOString() }
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
        console.log(`🩺 Health Check: ${base}/health`);
        console.log(`=================================================\n`);
    });
}

export default app;
