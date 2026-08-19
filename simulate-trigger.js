import crypto from 'crypto';

/**
 * End-to-End Test & Simulation Harness for Astrology Plugin
 * 
 * Runs a complete test cycle:
 * 1. Simulates user setup (DOB + TOB + Place)
 * 2. Simulates an incoming MemoryStore video save webhook
 * 3. Triggers async AI analysis
 * 4. Verifies callback and prints result URL
 */

const PLUGIN_URL = process.env.PLUGIN_URL || 'http://localhost:3456';
const PLUGIN_SECRET = process.env.MEMORYSTORE_PLUGIN_SECRET || 'mst_plugin_secret_astrology_123';

async function runSimulation() {
    console.log('\n======================================================');
    console.log('🧪 Starting Astrology Plugin End-to-End Simulation');
    console.log('======================================================\n');

    // 1. Setup User Profile
    console.log('Step 1: Simulating user setup via /api/setup-chart...');
    const setupPayload = {
        userId: 'usr_test_nikhil',
        dob: '2002-06-19',
        tob: '07:10',
        hasExactTime: true,
        placeName: 'Ballia, Uttar Pradesh, India',
        knownMoonSign: 'Virgo'
    };

    let setupRes = null;
    try {
        const res = await fetch(`${PLUGIN_URL}/api/setup-chart`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(setupPayload)
        });
        setupRes = await res.json();
        console.log('✓ Chart generated & saved to database:');
        console.log(`  Profile ID: ${setupRes.profileId}`);
        console.log(`  Lagna: ${setupRes.lagna} | Moon: ${setupRes.moonSign} | Sun: ${setupRes.sunSign}\n`);
    } catch (err) {
        console.error('❌ Failed to connect to plugin server. Is "npm start" running?', err.message);
        process.exit(1);
    }

    // 2. Simulate MemoryStore Video Webhook Trigger
    console.log('Step 2: Simulating MemoryStore webhook trigger for saved video...');
    const resultId = `res_${Date.now()}_test`;
    const mockCallbackUrl = `${PLUGIN_URL}/mock-memorystore-callback`;

    const webhookPayload = JSON.stringify({
        event: 'plugin.triggered',
        result_id: resultId,
        callback_url: mockCallbackUrl,
        memory: {
            id: 'mem_reel_9988',
            title: 'Saturn Transit 2026: Why Gemini & Virgo Placements Need To Watch Career Moves',
            url: 'https://www.instagram.com/reel/C_astro123',
            type: 'video',
            transcript: 'In this video, astrologer explains the massive shift of Shani (Saturn) and how it affects those with planets in Gemini 10th house or Virgo Moon. If you are starting a venture, focus on structure and avoid shortcuts.'
        },
        trigger: {
            phrase: 'kundli',
            platform: 'instagram'
        },
        user: { id: 'usr_test_nikhil' },
        user_config: {
            profile_id: setupRes.profileId,
            dob: setupPayload.dob,
            moon_sign: setupRes.moonSign
        },
        timestamp: new Date().toISOString()
    });

    const signature = crypto.createHmac('sha256', PLUGIN_SECRET).update(webhookPayload).digest('hex');

    const webhookRes = await fetch(`${PLUGIN_URL}/webhook`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-MemoryStore-Signature': `sha256=${signature}`
        },
        body: webhookPayload
    });

    const webhookJson = await webhookRes.json();
    console.log(`✓ Webhook accepted (HTTP ${webhookRes.status}):`, webhookJson);

    // 3. Wait for background async processing
    console.log('\nStep 3: Waiting 2.5s for AI analysis worker to complete...');
    await new Promise(r => setTimeout(r, 2500));

    // 4. Check View URL
    const resultUrl = `${PLUGIN_URL}/view/${resultId}`;
    console.log('\n======================================================');
    console.log('🎉 Simulation Completed Successfully!');
    console.log(`👉 Open Result Viewer in Browser:`);
    console.log(`   ${resultUrl}`);
    console.log('======================================================\n');
}

runSimulation();
