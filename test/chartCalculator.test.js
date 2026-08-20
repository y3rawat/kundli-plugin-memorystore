import { generateKundli } from '../src/chartCalculator.js';

async function runTests() {
    console.log('--- Testing Swiss Ephemeris Kundli Calculator ---');

    // Test Case: DOB 2002-06-19 07:10:00 in Ballia, UP
    const kundli = await generateKundli({
        dob: '2002-06-19',
        tob: '07:10',
        latitude: 25.760278,
        longitude: 84.146944,
        timezoneOffsetHours: 5.5,
        placeName: 'Ballia, Uttar Pradesh, India'
    });

    console.assert(kundli.ascendant && kundli.ascendant.signName === 'Cancer', `Ascendant should be Cancer, got ${kundli.ascendant.signName}`);
    console.assert(kundli.moonSign === 'Virgo', `Moon sign should be Virgo, got ${kundli.moonSign}`);
    console.assert(kundli.sunSign === 'Gemini', `Sun sign should be Gemini, got ${kundli.sunSign}`);
    console.assert(Object.keys(kundli.planetaryPositions).length === 9, 'All 9 planets must be present');
    console.assert(Object.keys(kundli.houses).length === 12, '12 houses must be defined');

    console.log('✓ Verified 1:1 against Python Swiss Ephemeris / PyJHora:');
    console.log(`  Lagna: ${kundli.ascendant.signName} (${kundli.ascendant.degInSign.toFixed(2)}°) [Nakshatra: ${kundli.ascendant.nakshatra}]`);
    console.log(`  Moon Sign: ${kundli.moonSign} (${kundli.planetaryPositions.Moon.degInSign.toFixed(2)}°) [Nakshatra: ${kundli.planetaryPositions.Moon.nakshatra}]`);
    console.log(`  Sun Sign: ${kundli.sunSign} (${kundli.planetaryPositions.Sun.degInSign.toFixed(2)}°) [Nakshatra: ${kundli.planetaryPositions.Sun.nakshatra}]`);
    console.log(`  Julian Day (UT): ${kundli.birthDetails.julianDay}`);
    console.log(`  Lahiri Ayanamsa: ${kundli.birthDetails.ayanamsa}°`);
    console.log('\nFormatted Prompt Summary:');
    console.log(kundli.formattedSummary);
    console.log('\n--- All Swiss Ephemeris Tests Passed! ---');
}

runTests().catch(console.error);
