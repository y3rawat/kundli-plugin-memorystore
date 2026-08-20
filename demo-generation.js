import { generateKundli, ZODIAC_SIGNS } from './src/chartCalculator.js';
import { analyzeVideoWithKundli } from './src/astrologyAI.js';

console.log('\n' + '='.repeat(70));
console.log('🪐 LIVE DEMONSTRATION: VEDIC KUNDLI GENERATION & VIDEO SYNTHESIS');
console.log('='.repeat(70) + '\n');

// ─────────────────────────────────────────────────────────────────────────────
// CASE 1: USER WITH EXACT BIRTH TIME (FULL LAGNA KUNDLI)
// ─────────────────────────────────────────────────────────────────────────────
console.log('📍 CASE 1: USER WITH EXACT BIRTH TIME (Full Natal Lagna Kundli)');
console.log('   Input: DOB = 1998-07-22 | Time = 14:30 | Place = New Delhi, India\n');

const fullChart = generateKundli({
    dob: '1998-07-22',
    tob: '14:30',
    hasExactTime: true,
    latitude: 28.6139,
    longitude: 77.2090,
    placeName: 'New Delhi, India'
});

console.log('✨ Calculated Core Placements:');
console.log(`   • Chart Mode:     ${fullChart.chartMode}`);
console.log(`   • Lagna (Rising): ${fullChart.ascendant.signName} (${fullChart.ascendant.degInSign}°) [Nakshatra: ${fullChart.ascendant.nakshatra}]`);
console.log(`   • Moon Sign:      ${fullChart.moonSign} [Nakshatra: ${fullChart.planetaryPositions.Moon.nakshatra}]`);
console.log(`   • Sun Sign:       ${fullChart.sunSign} [Nakshatra: ${fullChart.planetaryPositions.Sun.nakshatra}]`);
console.log(`   • Lahiri Ayanamsa: ${fullChart.ayanamsa}°\n`);

console.log('🏛️ Planetary Placements Across 12 Houses:');
for (let h = 1; h <= 12; h++) {
    const house = fullChart.houses[h];
    const planetsStr = house.planets.length > 0 ? house.planets.join(', ') : 'Empty';
    console.log(`   House ${String(h).padStart(2, ' ')} (${house.signName.padEnd(11, ' ')} / Lord: ${house.signLord.padEnd(7, ' ')}): ${planetsStr}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// CASE 2: USER WITHOUT EXACT BIRTH TIME (CHANDRA KUNDALI / MOON CHART)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n' + '-'.repeat(70));
console.log('📍 CASE 2: USER WITHOUT EXACT BIRTH TIME (Chandra Kundali Mode)');
console.log('   Input: DOB = 2001-11-15 | Time = UNKNOWN | Known Rashi = Scorpio\n');

const moonChart = generateKundli({
    dob: '2001-11-15',
    hasExactTime: false,
    knownMoonSign: 'Scorpio',
    placeName: 'Mumbai, India'
});

console.log('✨ Calculated Chandra Kundali:');
console.log(`   • Chart Mode:     ${moonChart.chartMode}`);
console.log(`   • Moon Sign (H1): ${moonChart.moonSign}`);
console.log(`   • Ascendant:      ${moonChart.ascendant.signName} (Not calculated - requires exact time)`);
console.log(`   • Sun Sign:       ${moonChart.sunSign}\n`);

console.log('🛡️ Transparency & Trade-Offs:');
console.log('   ✓ AVAILABLE: Planetary Transits (Gochar), Moon Sign predictions, Custom remedies.');
console.log('   ⚠️ UNAVAILABLE: Exact Ascendant (Lagna), Minute-level Navamsha (D9), Sub-dasha timings.\n');

console.log('🏛️ Planetary Placements Relative to Moon (Chandra Lagna):');
for (let h = 1; h <= 12; h++) {
    const house = moonChart.houses[h];
    const planetsStr = house.planets.length > 0 ? house.planets.join(', ') : 'Empty';
    console.log(`   House ${String(h).padStart(2, ' ')} (${house.signName.padEnd(11, ' ')}): ${planetsStr}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// CASE 3: SYNTHESIZING AN ASTROLOGY VIDEO AGAINST USER'S CHART
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n' + '='.repeat(70));
console.log('📹 STEP 3: AI SYNTHESIS OF SAVED REEL AGAINST USER CHART');
console.log('='.repeat(70) + '\n');

const mockVideo = {
    title: 'Saturn Transit 2026: Why Gemini & Scorpio Placements Need To Be Careful in Career',
    url: 'https://instagram.com/reel/C_saturn_transit_2026',
    transcript: 'Astrologer explains the intense impact of Saturn shifting. If you have planets in Gemini or Scorpio, you must avoid impulsive investments, watch out for sudden office politics in the 8th/10th house, and perform Saturday grounding remedies.'
};

console.log(`Video Title: "${mockVideo.title}"`);
console.log('Synthesizing with User Natal Placements (Scorpio Lagna, Gemini Moon)...\n');

const analysis = await analyzeVideoWithKundli({
    videoData: mockVideo,
    kundliData: fullChart
});

console.log(`📊 AI Relevance Score: ${analysis.matchScore}% | Verdict: ${analysis.verdict}`);
console.log(`💡 Actionable Takeaway: ${analysis.actionableTakeaway}\n`);

console.log('✨ Personalized Impact Analysis:');
console.log(analysis.personalizedImpact.split('\n').map(l => `   ${l}`).join('\n'));

console.log('\n🏛️ Activated Houses in Your Chart:');
for (const h of analysis.affectedHouses) {
    console.log(`   • House ${h.house}: ${h.theme} → [${h.effect}]`);
}

console.log('\n🌿 Tailored Remedies:');
for (const r of analysis.remedies) {
    console.log(`   • ${r}`);
}

console.log('\n' + '='.repeat(70));
console.log('✅ Demonstration Completed Successfully!');
console.log('='.repeat(70) + '\n');
