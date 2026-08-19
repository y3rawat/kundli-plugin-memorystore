import { generateKundli, getJulianDay, getLahiriAyanamsa } from '../src/chartCalculator.js';

function runTests() {
    console.log('--- Testing Chart Calculator ---');

    // Test Julian Day calculation
    const jd = getJulianDay(2000, 1, 1, 12, 0, 0);
    console.assert(Math.abs(jd - 2451545.0) < 0.01, `JD should be 2451545.0, got ${jd}`);
    console.log('✓ Julian Day calculation passed');

    // Test Ayanamsa
    const ayanamsa = getLahiriAyanamsa(jd);
    console.assert(ayanamsa > 23.8 && ayanamsa < 23.9, `Ayanamsa for 2000 should be ~23.85°, got ${ayanamsa}`);
    console.log('✓ Lahiri Ayanamsa calculation passed');

    // Test full Kundli Generation
    const kundli = generateKundli({
        dob: '1995-10-24',
        tob: '08:30',
        latitude: 28.6139,
        longitude: 77.2090,
        placeName: 'New Delhi'
    });

    console.assert(kundli.ascendant && kundli.ascendant.signName, 'Ascendant must be calculated');
    console.assert(kundli.moonSign, 'Moon sign must be calculated');
    console.assert(Object.keys(kundli.planetaryPositions).length === 9, 'All 9 planets must be present');
    console.assert(Object.keys(kundli.houses).length === 12, '12 houses must be defined');

    console.log('✓ Generated Kundli:');
    console.log(`  Lagna: ${kundli.ascendant.signName} (${kundli.ascendant.degInSign}°)`);
    console.log(`  Moon Sign: ${kundli.moonSign}`);
    console.log(`  Sun Sign: ${kundli.sunSign}`);
    console.log('\nSample Formatted Prompt:');
    console.log(kundli.formattedSummary);
    console.log('\n--- All Chart Calculator Tests Passed! ---');
}

runTests();
