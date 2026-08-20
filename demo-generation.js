import { generateKundli } from './src/chartCalculator.js';
import { analyzeVideoWithKundli } from './src/astrologyAI.js';

console.log('\n' + '='.repeat(70));
console.log('🪐 LIVE DEMONSTRATION: SWISS EPHEMERIS KUNDLI & VIDEO SYNTHESIS');
console.log('='.repeat(70) + '\n');

// ─────────────────────────────────────────────────────────────────────────────
// CASE 1: USER WITH EXACT BIRTH TIME (FULL LAGNA KUNDLI)
// ─────────────────────────────────────────────────────────────────────────────
console.log('📍 CASE 1: USER WITH EXACT BIRTH TIME (Full Natal Lagna Kundli)');
console.log('   Input: DOB = 2002-06-19 | Time = 07:10 | Place = Ballia, Uttar Pradesh\n');

const fullChart = await generateKundli({
    dob: '2002-06-19',
    tob: '07:10',
    hasExactTime: true,
    latitude: 25.760278,
    longitude: 84.146944,
    timezoneOffsetHours: 5.5,
    placeName: 'Ballia, Uttar Pradesh, India'
});

console.log('✨ Calculated Core Placements (Swiss Ephemeris):');
console.log(`   • Chart Mode:      ${fullChart.chartMode}`);
console.log(`   • Lagna (Rising):  ${fullChart.ascendant.signName} (${fullChart.ascendant.degInSign.toFixed(2)}°) [Nakshatra: ${fullChart.ascendant.nakshatra}]`);
console.log(`   • Moon Sign:       ${fullChart.moonSign} (${fullChart.planetaryPositions.Moon.degInSign.toFixed(2)}°) [Nakshatra: ${fullChart.planetaryPositions.Moon.nakshatra}]`);
console.log(`   • Sun Sign:        ${fullChart.sunSign} (${fullChart.planetaryPositions.Sun.degInSign.toFixed(2)}°) [Nakshatra: ${fullChart.planetaryPositions.Sun.nakshatra}]`);
console.log(`   • Lahiri Ayanamsa: ${fullChart.birthDetails.ayanamsa}°\n`);

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
console.log('   Input: DOB = 2002-06-19 | Time = UNKNOWN | Known Rashi = Virgo\n');

const moonChart = await generateKundli({
    dob: '2002-06-19',
    hasExactTime: false,
    knownMoonSign: 'Virgo',
    placeName: 'Ballia, India'
});

console.log('✨ Calculated Chandra Kundali:');
console.log(`   • Chart Mode:     ${moonChart.chartMode}`);
console.log(`   • Moon Sign (H1): ${moonChart.moonSign}`);
console.log(`   • Ascendant:      ${moonChart.ascendant.signName} (Chandra Lagna Baseline)`);
console.log(`   • Sun Sign:       ${moonChart.sunSign}\n`);

console.log('🛡️ Transparency & Trade-Offs:');
console.log('   ✓ AVAILABLE: Planetary Transits (Gochar), Moon Sign predictions, Custom remedies.');
console.log('   ⚠️ UNAVAILABLE: Exact Ascendant (Lagna), Minute-level Navamsha (D9), Sub-dasha timings.\n');

// ─────────────────────────────────────────────────────────────────────────────
// CASE 3: SYNTHESIZING AN ASTROLOGY VIDEO AGAINST USER'S CHART
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n' + '='.repeat(70));
console.log('📹 STEP 3: AI SYNTHESIS OF SAVED REEL AGAINST USER CHART');
console.log('='.repeat(70) + '\n');

const mockVideo = {
    title: 'Saturn Transit 2026: Why Cancer & Virgo Placements Need To Be Careful in Career',
    url: 'https://instagram.com/reel/C_saturn_transit_2026',
    transcript: 'Astrologer explains the intense impact of Saturn shifting. If you have Cancer Lagna or Virgo Moon, you must focus on steady discipline, avoid workplace conflicts, and protect mental peace.'
};

console.log(`Video Title: "${mockVideo.title}"`);
console.log('Synthesizing with User Natal Placements (Cancer Lagna, Virgo Moon)...\n');

const analysis = await analyzeVideoWithKundli({
    videoData: mockVideo,
    kundliData: fullChart
});

console.log(`📊 AI Relevance Score: ${analysis.matchScore}% | Verdict: ${analysis.verdict}`);
console.log(`💡 Actionable Takeaway: ${analysis.actionableTakeaway}\n`);

console.log('✨ Personalized Impact Analysis:');
console.log(analysis.personalizedImpact.split('\n').map(l => `   ${l}`).join('\n'));

console.log('\n' + '='.repeat(70));
console.log('✅ Demonstration Completed Successfully!');
console.log('='.repeat(70) + '\n');
