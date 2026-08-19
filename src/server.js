import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';

import { generateKundli } from './chartCalculator.js';
import { firebaseStore } from './firebaseStore.js';
import { analyzeVideoWithKundli } from './astrologyAI.js';
import { sendCallbackResult } from './callbackDispatcher.js';
import { renderSetupPage } from './views/setupPage.js';
import { renderResultViewerPage } from './views/resultViewerPage.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3456;
const PLUGIN_SECRET = process.env.MEMORYSTORE_PLUGIN_SECRET || 'mst_plugin_secret_astrology_123';
const SERVER_BASE_URL = process.env.SERVER_BASE_URL || `http://localhost:${PORT}`;

// Middleware to capture raw body for HMAC signature validation
app.use(express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf.toString('utf8');
    }
}));
app.use(cors());

// ─────────────────────────── Health Check ───────────────────────────
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'memorystore-astrology-plugin',
        timestamp: new Date().toISOString()
    });
});

// ─────────────────────────── Setup Interface (Iframe) ───────────────────────────
app.get('/setup', async (req, res) => {
    const userId = req.query.user_id || '';
    const installationId = req.query.installation_id || '';

    // Check if user already has an existing profile
    let existingConfig = {};
    if (userId) {
        const profile = await firebaseStore.getUserProfile(`profile_${userId}`);
        if (profile) existingConfig = profile;
    }

    const html = renderSetupPage({
        userId,
        installationId,
        existingConfig,
        queryGeminiKey: req.query.gemini_key || '',
        hasAiKey: req.query.has_ai_key === 'true' || Boolean(req.query.gemini_key)
    });

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
});

// ─────────────────────────── Setup Chart Generation API ───────────────────────────
app.post('/api/setup-chart', async (req, res) => {
    try {
        const {
            userId = 'usr_direct',
            dob,
            tob,
            hasExactTime = true,
            placeName = 'New Delhi, India',
            knownMoonSign = null,
            geminiApiKey = null
        } = req.body;

        if (!dob) {
            return res.status(400).json({ success: false, message: 'Date of birth is required' });
        }

        // Calculate Kundli
        const chart = generateKundli({
            dob,
            tob: hasExactTime ? tob : '12:00',
            hasExactTime: Boolean(hasExactTime),
            placeName,
            knownMoonSign
        });

        const profileId = `profile_${userId}_${dob.replace(/-/g, '')}`;

        // Save to Firebase
        const profileData = {
            user_id: userId,
            dob,
            tob: hasExactTime ? tob : null,
            has_exact_time: Boolean(hasExactTime),
            place_name: placeName,
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
            lagna: chart.ascendant?.signName || 'Unknown',
            moonSign: chart.moonSign,
            sunSign: chart.sunSign,
            placeName,
            chartSummary: chart.formattedSummary
        });
    } catch (err) {
        console.error('[SetupAPI] Error generating chart:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

// ─────────────────────────── Webhook Trigger Listener ───────────────────────────
app.post('/webhook', async (req, res) => {
    const signatureHeader = req.headers['x-memorystore-signature'] || '';
    const rawBody = req.rawBody || JSON.stringify(req.body);

    // 1. Verify HMAC Signature
    if (PLUGIN_SECRET) {
        const expectedSig = crypto.createHmac('sha256', PLUGIN_SECRET).update(rawBody).digest('hex');
        const formattedExpected = `sha256=${expectedSig}`;

        if (signatureHeader && signatureHeader !== formattedExpected) {
            console.warn('[Webhook] Signature verification failed!');
            return res.status(401).json({ error: 'Invalid HMAC signature' });
        }
    }

    const payload = req.body;
    const { result_id, callback_url, memory, user_config: userConfig, user } = payload;

    if (!result_id || !callback_url) {
        return res.status(400).json({ error: 'result_id and callback_url are required' });
    }

    console.log(`[Webhook] Received trigger for result ${result_id} | Memory: "${memory?.title || memory?.url}"`);

    // 2. Respond 200 OK immediately
    res.status(200).json({
        status: 'accepted',
        result_id,
        message: 'Processing astrology video analysis asynchronously'
    });

    // 3. Process asynchronously in background
    setImmediate(async () => {
        try {
            await processAstrologyVideoJob({
                resultId: result_id,
                callbackUrl: callback_url,
                memory,
                userConfig,
                userId: user?.id
            });
        } catch (err) {
            console.error(`[WebhookWorker] Failed processing result ${result_id}:`, err);
        }
    });
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

// ─────────────────────────── Background Async Worker ───────────────────────────
async function processAstrologyVideoJob({ resultId, callbackUrl, memory, userConfig, userId }) {
    console.log(`[Worker] Starting job for result ${resultId}...`);

    // 1. Retrieve User Chart
    let profile = null;
    if (userConfig?.profile_id) {
        profile = await firebaseStore.getUserProfile(userConfig.profile_id);
    }

    // Fallback: If profile wasn't found by ID, try userId or generate from userConfig
    if (!profile && userId) {
        profile = await firebaseStore.getUserProfile(`profile_${userId}`);
    }

    if (!profile && userConfig?.dob) {
        const chart = generateKundli({
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

    // Default chart if no profile yet
    if (!profile) {
        const defaultChart = generateKundli({ dob: '1998-07-22', tob: '14:30' });
        profile = { dob: '1998-07-22', chart: defaultChart };
    }

    // 2. Resolve User's Gemini AI Key (passed from MemoryStore App)
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

    // 3. Save to Firebase
    const analysisRecord = {
        ...analysisReport,
        profile_id: userConfig?.profile_id || `profile_${userId}`,
        memory_id: memory?.id,
        memory_title: memory?.title,
        memory_url: memory?.url
    };
    await firebaseStore.saveAnalysisResult(resultId, analysisRecord);

    // 4. Dispatch Callback to MemoryStore
    const resultUrl = `${SERVER_BASE_URL.replace(/\/+$/, '')}/view/${resultId}`;

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
}

// ─────────────────────────── Server Start ───────────────────────────
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`\n=================================================`);
        console.log(`🪐 MemoryStore Astrology Plugin Server Running!`);
        console.log(`🚀 Port: ${PORT}`);
        console.log(`🔗 Setup Page: ${SERVER_BASE_URL}/setup`);
        console.log(`📩 Webhook URL: ${SERVER_BASE_URL}/webhook`);
        console.log(`=================================================\n`);
    });
}

export default app;
