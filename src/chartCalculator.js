/**
 * Vedic Astrology (Jyotish) Kundli Calculation Engine
 * 
 * Computes Sidereal planetary longitudes (Lahiri Ayanamsa), Ascendant (Lagna),
 * 12 Bhavas (houses), Rashis (signs), Nakshatras, and planetary relationships
 * from Date of Birth, Time of Birth, and Geographic Location.
 * 
 * Supports:
 * 1. Full Lagna Kundli (DOB + Exact TOB + Place)
 * 2. Time-Independent Chandra Kundali (DOB + Moon Sign when time is unknown)
 * 3. Cross-verification between user's stated Rashi and calculated positions.
 */

export const ZODIAC_SIGNS = [
    { id: 1, name: 'Aries', sanskrit: 'Mesha', lord: 'Mars', element: 'Fire' },
    { id: 2, name: 'Taurus', sanskrit: 'Vrishabha', lord: 'Venus', element: 'Earth' },
    { id: 3, name: 'Gemini', sanskrit: 'Mithuna', lord: 'Mercury', element: 'Air' },
    { id: 4, name: 'Cancer', sanskrit: 'Karka', lord: 'Moon', element: 'Water' },
    { id: 5, name: 'Leo', sanskrit: 'Simha', lord: 'Sun', element: 'Fire' },
    { id: 6, name: 'Virgo', sanskrit: 'Kanya', lord: 'Mercury', element: 'Earth' },
    { id: 7, name: 'Libra', sanskrit: 'Tula', lord: 'Venus', element: 'Air' },
    { id: 8, name: 'Scorpio', sanskrit: 'Vrishchika', lord: 'Mars', element: 'Water' },
    { id: 9, name: 'Sagittarius', sanskrit: 'Dhanu', lord: 'Jupiter', element: 'Fire' },
    { id: 10, name: 'Capricorn', sanskrit: 'Makara', lord: 'Saturn', element: 'Earth' },
    { id: 11, name: 'Aquarius', sanskrit: 'Kumbha', lord: 'Saturn', element: 'Air' },
    { id: 12, name: 'Pisces', sanskrit: 'Meena', lord: 'Jupiter', element: 'Water' }
];

export const NAKSHATRAS = [
    'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
    'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
    'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
    'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
    'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
];

const DEG2RAD = Math.PI / 180.0;
const RAD2DEG = 180.0 / Math.PI;

function normalizeDeg(deg) {
    let d = deg % 360;
    if (d < 0) d += 360;
    return d;
}

/**
 * Calculates Julian Day Number from UTC date components.
 */
export function getJulianDay(year, month, day, hours = 0, minutes = 0, seconds = 0) {
    let y = year;
    let m = month;
    if (m <= 2) {
        y -= 1;
        m += 12;
    }
    const a = Math.floor(y / 100);
    const b = 2 - a + Math.floor(a / 4);
    const dayFraction = (hours + minutes / 60.0 + seconds / 3600.0) / 24.0;
    const jd = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + dayFraction + b - 1524.5;
    return jd;
}

/**
 * Computes Lahiri Ayanamsa for a given Julian Day.
 */
export function getLahiriAyanamsa(jd) {
    const t = (jd - 2451545.0) / 36525.0; // Julian centuries since J2000.0
    const ayanamsa = 23.858055 + (1.396825 * t) + (0.000308 * t * t);
    return ayanamsa;
}

/**
 * Planetary orbital positions (Keplerian approximations + sidereal reduction).
 */
export function calculatePlanetLongitudes(jd, ayanamsa) {
    const d = jd - 2451545.0;

    // Sun
    const sunMean = normalizeDeg(280.460 + 0.9856474 * d);
    const sunAnomaly = normalizeDeg(357.528 + 0.9856003 * d) * DEG2RAD;
    const sunEcliptic = sunMean + 1.915 * Math.sin(sunAnomaly) + 0.020 * Math.sin(2 * sunAnomaly);
    const sunSidereal = normalizeDeg(sunEcliptic - ayanamsa);

    // Moon
    const moonMean = normalizeDeg(218.316 + 13.176396 * d);
    const moonAnomaly = normalizeDeg(134.963 + 13.064993 * d) * DEG2RAD;
    const moonEcliptic = moonMean + 6.289 * Math.sin(moonAnomaly);
    const moonSidereal = normalizeDeg(moonEcliptic - ayanamsa);

    // Mars
    const marsMean = normalizeDeg(355.433 + 0.524033 * d);
    const marsAnomaly = normalizeDeg(19.373 + 0.5240207 * d) * DEG2RAD;
    const marsEcliptic = marsMean + 10.691 * Math.sin(marsAnomaly);
    const marsSidereal = normalizeDeg(marsEcliptic - ayanamsa);

    // Mercury
    const mercAnomaly = normalizeDeg(168.656 + 4.0923344 * d) * DEG2RAD;
    const mercEcliptic = sunEcliptic + 23.44 * Math.sin(mercAnomaly);
    const mercSidereal = normalizeDeg(mercEcliptic - ayanamsa);

    // Jupiter
    const jupMean = normalizeDeg(34.351 + 0.0830853 * d);
    const jupAnomaly = normalizeDeg(20.020 + 0.0830853 * d) * DEG2RAD;
    const jupEcliptic = jupMean + 5.555 * Math.sin(jupAnomaly);
    const jupSidereal = normalizeDeg(jupEcliptic - ayanamsa);

    // Venus
    const venusAnomaly = normalizeDeg(50.115 + 1.6021302 * d) * DEG2RAD;
    const venusEcliptic = sunEcliptic + 46.0 * Math.sin(venusAnomaly);
    const venusSidereal = normalizeDeg(venusEcliptic - ayanamsa);

    // Saturn
    const satMean = normalizeDeg(50.077 + 0.0334442 * d);
    const satAnomaly = normalizeDeg(317.020 + 0.0334442 * d) * DEG2RAD;
    const satEcliptic = satMean + 6.300 * Math.sin(satAnomaly);
    const satSidereal = normalizeDeg(satEcliptic - ayanamsa);

    // Rahu (Mean Lunar Ascending Node)
    const rahuMean = normalizeDeg(125.0445 - 0.0529538 * d);
    const rahuSidereal = normalizeDeg(rahuMean - ayanamsa);

    // Ketu (180° opposite Rahu)
    const ketuSidereal = normalizeDeg(rahuSidereal + 180.0);

    return {
        Sun: sunSidereal,
        Moon: moonSidereal,
        Mars: marsSidereal,
        Mercury: mercSidereal,
        Jupiter: jupSidereal,
        Venus: venusSidereal,
        Saturn: satSidereal,
        Rahu: rahuSidereal,
        Ketu: ketuSidereal
    };
}

/**
 * Calculates Ascendant (Lagna) in degrees (Sidereal).
 */
export function calculateAscendant(jd, lat, lon, ayanamsa) {
    const d = jd - 2451545.0;
    const gmst = normalizeDeg(280.46061837 + 360.98564736629 * d);
    const lst = normalizeDeg(gmst + lon);
    const ramc = lst * DEG2RAD;
    const eps = (23.4392911 - 0.0130042 * (d / 36525.0)) * DEG2RAD;
    const phi = lat * DEG2RAD;

    const y = Math.cos(ramc);
    const x = -Math.sin(ramc) * Math.cos(eps) - Math.tan(phi) * Math.sin(eps);
    let ascDeg = Math.atan2(y, x) * RAD2DEG;
    ascDeg = normalizeDeg(ascDeg + 90);

    const ascSidereal = normalizeDeg(ascDeg - ayanamsa);
    return ascSidereal;
}

/**
 * Returns Rashi, degree in sign, and Nakshatra for a given longitude.
 */
export function getLongitudeDetails(longitude) {
    const norm = normalizeDeg(longitude);
    const signIndex = Math.floor(norm / 30.0);
    const degInSign = norm % 30.0;
    const sign = ZODIAC_SIGNS[signIndex];

    const nakshatraIndex = Math.floor(norm / (360.0 / 27.0));
    const nakshatra = NAKSHATRAS[nakshatraIndex % 27];
    const pada = Math.floor((norm % (360.0 / 27.0)) / (360.0 / 108.0)) + 1;

    return {
        longitude: Number(norm.toFixed(2)),
        signNumber: sign.id,
        signName: sign.name,
        signSanskrit: sign.sanskrit,
        signLord: sign.lord,
        degInSign: Number(degInSign.toFixed(2)),
        nakshatra,
        pada
    };
}

/**
 * Generates Vedic Kundli Chart with support for exact time, optional time, and sign cross-verification.
 */
export function generateKundli({
    dob,
    tob = '12:00',
    hasExactTime = true,
    latitude = 28.6139,
    longitude = 77.2090,
    timezoneOffsetHours = 5.5,
    placeName = 'New Delhi, India',
    knownMoonSign = null,
    knownSunSign = null
}) {
    const [yearStr, monthStr, dayStr] = String(dob).split('-');
    const [hourStr, minuteStr] = String(tob || '12:00').split(':');

    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);
    const localHour = hasExactTime ? parseInt(hourStr || '12', 10) : 12;
    const localMinute = hasExactTime ? parseInt(minuteStr || '0', 10) : 0;

    // Convert local time to UTC
    let utcDecimalHours = (localHour + localMinute / 60.0) - timezoneOffsetHours;
    let utcDay = day;
    if (utcDecimalHours < 0) {
        utcDecimalHours += 24.0;
        utcDay -= 1;
    } else if (utcDecimalHours >= 24) {
        utcDecimalHours -= 24.0;
        utcDay += 1;
    }

    const jd = getJulianDay(year, month, utcDay, Math.floor(utcDecimalHours), (utcDecimalHours % 1) * 60);
    const ayanamsa = getLahiriAyanamsa(jd);

    const planetsRaw = calculatePlanetLongitudes(jd, ayanamsa);
    const planetaryPositions = {};

    for (const [planetName, deg] of Object.entries(planetsRaw)) {
        planetaryPositions[planetName] = {
            planet: planetName,
            ...getLongitudeDetails(deg)
        };
    }

    const calculatedMoonSign = planetaryPositions.Moon?.signName || 'Unknown';
    const calculatedSunSign = planetaryPositions.Sun?.signName || 'Unknown';

    // Cross-Verification Check
    const verification = {
        hasExactTime: Boolean(hasExactTime),
        statedMoonSign: knownMoonSign || null,
        statedSunSign: knownSunSign || null,
        calculatedMoonSign,
        calculatedSunSign,
        isMoonSignVerified: knownMoonSign ? (knownMoonSign.toLowerCase() === calculatedMoonSign.toLowerCase()) : null,
        isSunSignVerified: knownSunSign ? (knownSunSign.toLowerCase() === calculatedSunSign.toLowerCase()) : null
    };

    let chartMode = 'lagna_chart';
    let baseSignNumber = 1;
    let ascendantInfo = null;

    if (hasExactTime) {
        const ascendantDeg = calculateAscendant(jd, latitude, longitude, ayanamsa);
        ascendantInfo = getLongitudeDetails(ascendantDeg);
        baseSignNumber = ascendantInfo.signNumber;
        chartMode = 'lagna_chart';
    } else {
        // When birth time is unknown, use Chandra Kundali (Moon as House 1)
        baseSignNumber = planetaryPositions.Moon?.signNumber || 1;
        const baseSign = ZODIAC_SIGNS[baseSignNumber - 1];
        ascendantInfo = {
            longitude: planetaryPositions.Moon?.longitude || 0,
            signNumber: baseSign.id,
            signName: baseSign.name,
            signSanskrit: baseSign.sanskrit,
            signLord: baseSign.lord,
            degInSign: planetaryPositions.Moon?.degInSign || 0,
            nakshatra: planetaryPositions.Moon?.nakshatra || 'Unknown',
            pada: planetaryPositions.Moon?.pada || 1,
            isChandraLagna: true
        };
        chartMode = 'chandra_kundali';
    }

    // Initialize 12 Bhavas (houses)
    const housePlacements = {};
    for (let h = 1; h <= 12; h++) {
        const houseSignNum = ((baseSignNumber - 1 + (h - 1)) % 12) + 1;
        const signData = ZODIAC_SIGNS[houseSignNum - 1];
        housePlacements[h] = {
            houseNumber: h,
            signNumber: houseSignNum,
            signName: signData.name,
            signSanskrit: signData.sanskrit,
            signLord: signData.lord,
            planets: []
        };
    }

    // Place planets in houses
    for (const [planetName, info] of Object.entries(planetaryPositions)) {
        const houseNumber = ((info.signNumber - baseSignNumber + 12) % 12) + 1;
        planetaryPositions[planetName].house = houseNumber;
        housePlacements[houseNumber].planets.push(planetName);
    }

    return {
        chartMode,
        birthDetails: {
            dob,
            tob: hasExactTime ? tob : 'Unknown (Time-Independent Mode)',
            hasExactTime,
            placeName,
            latitude,
            longitude,
            timezoneOffsetHours,
            julianDay: Number(jd.toFixed(4)),
            ayanamsa: Number(ayanamsa.toFixed(4))
        },
        verification,
        ascendant: ascendantInfo,
        moonSign: calculatedMoonSign,
        moonNakshatra: planetaryPositions.Moon ? `${planetaryPositions.Moon.nakshatra} (Pada ${planetaryPositions.Moon.pada})` : 'Unknown',
        sunSign: calculatedSunSign,
        planetaryPositions,
        houses: housePlacements,
        formattedSummary: formatChartForPrompt({
            chartMode,
            ascendant: ascendantInfo,
            planetaryPositions,
            houses: housePlacements,
            verification
        })
    };
}

/**
 * Creates formatted markdown of the chart for AI prompts.
 */
export function formatChartForPrompt({ chartMode, ascendant, planetaryPositions, houses, verification }) {
    const lines = [];
    if (chartMode === 'chandra_kundali') {
        lines.push(`- **Chart Type**: Chandra Kundali (Moon Chart / Time-Independent Gochara Baseline)`);
        lines.push(`- **Chandra Lagna (House 1 Reference)**: ${ascendant.signName} (${ascendant.signSanskrit}) [Moon in ${planetaryPositions.Moon.nakshatra}]`);
    } else {
        lines.push(`- **Chart Type**: Natal Lagna Kundli`);
        lines.push(`- **Lagna (Ascendant)**: ${ascendant.signName} (${ascendant.signSanskrit}) at ${ascendant.degInSign}° [Nakshatra: ${ascendant.nakshatra}]`);
    }

    lines.push(`- **Moon Sign (Chandra Rashi)**: ${planetaryPositions.Moon.signName} in House ${planetaryPositions.Moon.house}`);
    lines.push(`- **Sun Sign (Surya)**: ${planetaryPositions.Sun.signName} in House ${planetaryPositions.Sun.house}`);

    if (verification?.statedMoonSign) {
        lines.push(`- **Stated vs Calculated Moon Sign**: Stated = ${verification.statedMoonSign} | Calculated = ${verification.calculatedMoonSign} (${verification.isMoonSignVerified ? 'Verified Match' : 'Discrepancy / Boundary'})`);
    }

    lines.push('\n**Planetary Placements by House:**');
    for (let h = 1; h <= 12; h++) {
        const house = houses[h];
        const planetList = house.planets.length > 0 ? house.planets.join(', ') : 'None';
        lines.push(`  * House ${h} (${house.signName} / Lord: ${house.signLord}): ${planetList}`);
    }

    lines.push('\n**Key Planetary Longitudes:**');
    for (const [planet, info] of Object.entries(planetaryPositions)) {
        lines.push(`  * ${planet}: ${info.signName} (${info.degInSign}°) in House ${info.house}, Nakshatra ${info.nakshatra}`);
    }

    return lines.join('\n');
}
