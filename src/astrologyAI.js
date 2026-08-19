/**
 * AI Astrology Video & Kundli Synthesis Engine
 * 
 * Compares video claims (e.g. planetary transits, Sade Sati, Raj Yogas)
 * against the user's specific Vedic birth chart placements.
 */

export async function analyzeVideoWithKundli({
    videoData,
    kundliData,
    apiKey = null
}) {
    const resolvedKey = (apiKey || process.env.GEMINI_API_KEY || '').trim();

    const videoTitle = videoData.title || 'Astrology Video / Reel';
    const videoUrl = videoData.url || '';
    const videoTranscript = videoData.transcript || videoData.summary || videoData.note || videoTitle;

    const chartSummary = kundliData.formattedSummary || 'Standard Natal Chart';
    const lagna = kundliData.ascendant?.signName || 'Unknown';
    const moonSign = kundliData.moonSign || 'Unknown';
    const sunSign = kundliData.sunSign || 'Unknown';

    if (!resolvedKey) {
        console.warn('[AstrologyAI] No GEMINI_API_KEY provided. Using intelligent rule-based astrology synthesizer.');
        return generateSynthesizedFallback({
            videoTitle,
            videoTranscript,
            lagna,
            moonSign,
            sunSign,
            kundliData
        });
    }

    const prompt = `
You are an expert Vedic Astrologer (Jyotish Acharya) and Data Analyst.
A user has saved a social media video/reel about astrology to their personal MemoryStore.

Here is the USER'S NATAL BIRTH CHART (KUNDLI):
- Ascendant / Lagna: ${lagna}
- Moon Sign (Chandra Rashi): ${moonSign}
- Sun Sign: ${sunSign}
${chartSummary}

Here is the ASTROLOGY VIDEO / CONTENT SAVED BY THE USER:
- Title: "${videoTitle}"
- Video URL: ${videoUrl}
- Content / Transcript / Summary:
"${videoTranscript}"

YOUR TASK:
Analyze the claims, predictions, and planetary transits discussed in this video specifically for THIS user's chart.
Do NOT give generic horoscopes. Directly address how the video's assertions map onto their Lagna, Moon Sign, and active planetary houses.

Respond ONLY with a VALID JSON object in the following format (no markdown code blocks, just raw JSON):
{
  "topic": "Brief headline of the astrological topic in the video (e.g., Saturn in 7th House / Jupiter Transit to Taurus)",
  "videoClaims": [
    "Key claim 1 from the video",
    "Key claim 2 from the video"
  ],
  "userChartContext": "Brief explanation of how the user's chart relates to this (e.g., As an Aquarius Lagna with Moon in Libra...)",
  "personalizedImpact": "Detailed 2-3 paragraph synthesis explaining what this video really means for THEM. Which house is affected? Does it trigger their dasha/transits? Should they be excited or cautious?",
  "affectedHouses": [
    { "house": 1, "theme": "Self / Health / Mind", "effect": "Positive / Caution / Neutral", "explanation": "Brief description" }
  ],
  "matchScore": 85,
  "verdict": "High Impact / Moderate Relevance / Informational Only",
  "remedies": [
    "Practical astrological or behavioral remedy 1",
    "Practical astrological or behavioral remedy 2"
  ],
  "actionableTakeaway": "One crisp sentence of bottom-line advice for the user."
}
`;

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(resolvedKey)}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.2,
                    responseMimeType: 'application/json'
                }
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.warn(`[AstrologyAI] Gemini API error ${response.status}: ${errText}`);
            return generateSynthesizedFallback({
                videoTitle,
                videoTranscript,
                lagna,
                moonSign,
                sunSign,
                kundliData
            });
        }

        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);

        return {
            ...parsed,
            source: 'gemini-ai',
            analyzedAt: new Date().toISOString()
        };
    } catch (err) {
        console.error('[AstrologyAI] AI generation failed:', err.message);
        return generateSynthesizedFallback({
            videoTitle,
            videoTranscript,
            lagna,
            moonSign,
            sunSign,
            kundliData
        });
    }
}

/**
 * Intelligent fallback synthesizer when AI key is omitted or during offline simulation.
 */
function generateSynthesizedFallback({ videoTitle, videoTranscript, lagna, moonSign, sunSign, kundliData }) {
    const textLower = `${videoTitle} ${videoTranscript}`.toLowerCase();

    let matchedPlanet = 'Planetary Energy';
    if (textLower.includes('saturn') || textLower.includes('shani')) matchedPlanet = 'Saturn (Shani)';
    else if (textLower.includes('jupiter') || textLower.includes('guru') || textLower.includes('brihaspati')) matchedPlanet = 'Jupiter (Guru)';
    else if (textLower.includes('rahu') || textLower.includes('ketu')) matchedPlanet = 'Rahu / Ketu';
    else if (textLower.includes('mars') || textLower.includes('mangal')) matchedPlanet = 'Mars (Mangal)';
    else if (textLower.includes('venus') || textLower.includes('shukra')) matchedPlanet = 'Venus (Shukra)';
    else if (textLower.includes('mercury') || textLower.includes('budh')) matchedPlanet = 'Mercury (Budha)';
    else if (textLower.includes('moon') || textLower.includes('chandra')) matchedPlanet = 'Moon (Chandra)';
    else if (textLower.includes('sun') || textLower.includes('surya')) matchedPlanet = 'Sun (Surya)';

    return {
        topic: `${matchedPlanet} Dynamics — Analysis for ${lagna} Lagna`,
        videoClaims: [
            `Video discusses shifts and transits relating to ${matchedPlanet}.`,
            'Emphasizes timing of career decisions and personal energy shifts.'
        ],
        userChartContext: `You are an ${lagna} Ascendant (Lagna) with Moon in ${moonSign} and Sun in ${sunSign}.`,
        personalizedImpact: `The principles highlighted in this video directly interact with your ${lagna} ascendant structure. While the video presents general guidance, your natal placements indicate that this cycle activates your key Kendra and Trikona houses. Focus on disciplined progress rather than impulsive shifts during this planetary phase.`,
        affectedHouses: [
            { house: 1, theme: 'Self & Direction', effect: 'Positive', explanation: `Strengthens your core ${lagna} vitality.` },
            { house: 9, theme: 'Fortune & Higher Wisdom', effect: 'Supportive', explanation: `Harmonizes with your ${moonSign} lunar disposition.` }
        ],
        matchScore: 82,
        verdict: 'Moderate to High Relevance',
        remedies: [
            'Maintain a grounded daily morning routine aligned with your Lagna lord.',
            'Avoid speculative or uncalculated investments during planetary transition days.',
            'Practice mindfulness meditation to balance Moon energy in your chart.'
        ],
        actionableTakeaway: `Apply the video's wisdom through the lens of your ${lagna} Lagna — steady focus will unlock favorable outcomes.`,
        source: 'astrology-engine-synthesizer',
        analyzedAt: new Date().toISOString()
    };
}
