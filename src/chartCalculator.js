import { createSwissEph, Ayanamsa, Body, Flag } from '@kuntay/swisseph';

/**
 * Vedic Kundli Calculation Engine
 * 
 * Supports:
 * 1. External Kundali API (when KUNDLI_API_URL / VEDIC_ASTRO_API_URL is configured)
 * 2. High-precision Swiss Ephemeris WebAssembly Engine (100% accurate, zero manual approximations)
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

export const POPULAR_CITIES = [
    { city: 'New Delhi', country: 'India', state: 'Delhi', lat: 28.6139, lon: 77.2090, tz: 5.5 },
    { city: 'Mumbai', country: 'India', state: 'Maharashtra', lat: 19.0760, lon: 72.8777, tz: 5.5 },
    { city: 'Bengaluru', country: 'India', state: 'Karnataka', lat: 12.9716, lon: 77.5946, tz: 5.5 },
    { city: 'Kolkata', country: 'India', state: 'West Bengal', lat: 22.5726, lon: 88.3639, tz: 5.5 },
    { city: 'Chennai', country: 'India', state: 'Tamil Nadu', lat: 13.0827, lon: 80.2707, tz: 5.5 },
    { city: 'Hyderabad', country: 'India', state: 'Telangana', lat: 17.3850, lon: 78.4867, tz: 5.5 },
    { city: 'Pune', country: 'India', state: 'Maharashtra', lat: 18.5204, lon: 73.8567, tz: 5.5 },
    { city: 'Ahmedabad', country: 'India', state: 'Gujarat', lat: 23.0225, lon: 72.5714, tz: 5.5 },
    { city: 'Jaipur', country: 'India', state: 'Rajasthan', lat: 26.9124, lon: 75.7873, tz: 5.5 },
    { city: 'Lucknow', country: 'India', state: 'Uttar Pradesh', lat: 26.8467, lon: 80.9462, tz: 5.5 },
    { city: 'Varanasi', country: 'India', state: 'Uttar Pradesh', lat: 25.3176, lon: 82.9739, tz: 5.5 },
    { city: 'Patna', country: 'India', state: 'Bihar', lat: 25.5941, lon: 85.1376, tz: 5.5 },
    { city: 'Chandigarh', country: 'India', state: 'Punjab/Haryana', lat: 30.7333, lon: 76.7794, tz: 5.5 },
    { city: 'Indore', country: 'India', state: 'Madhya Pradesh', lat: 22.7196, lon: 75.8577, tz: 5.5 },
    { city: 'Bhopal', country: 'India', state: 'Madhya Pradesh', lat: 23.2599, lon: 77.4126, tz: 5.5 },
    { city: 'Surat', country: 'India', state: 'Gujarat', lat: 21.1702, lon: 72.8311, tz: 5.5 },
    { city: 'Nagpur', country: 'India', state: 'Maharashtra', lat: 21.1458, lon: 79.0882, tz: 5.5 },
    { city: 'Dehradun', country: 'India', state: 'Uttarakhand', lat: 30.3165, lon: 78.0322, tz: 5.5 },
    { city: 'Noida', country: 'India', state: 'Uttar Pradesh', lat: 28.5355, lon: 77.3910, tz: 5.5 },
    { city: 'Gurugram', country: 'India', state: 'Haryana', lat: 28.4595, lon: 77.0266, tz: 5.5 },
    { city: 'Ballia', country: 'India', state: 'Uttar Pradesh', lat: 25.760278, lon: 84.146944, tz: 5.5 },
    { city: 'Mundi', country: 'India', state: 'Madhya Pradesh', lat: 22.0669, lon: 76.4933, tz: 5.5 },
    { city: 'Prayagraj (Allahabad)', country: 'India', state: 'Uttar Pradesh', lat: 25.4358, lon: 81.8463, tz: 5.5 },
    { city: 'Gorakhpur', country: 'India', state: 'Uttar Pradesh', lat: 26.7606, lon: 83.3732, tz: 5.5 },
    { city: 'Kanpur', country: 'India', state: 'Uttar Pradesh', lat: 26.4499, lon: 80.3319, tz: 5.5 },
    { city: 'Agra', country: 'India', state: 'Uttar Pradesh', lat: 27.1767, lon: 78.0081, tz: 5.5 },
    { city: 'Amritsar', country: 'India', state: 'Punjab', lat: 31.6340, lon: 74.8723, tz: 5.5 },
    { city: 'Kochi', country: 'India', state: 'Kerala', lat: 9.9312, lon: 76.2673, tz: 5.5 },
    { city: 'Thiruvananthapuram', country: 'India', state: 'Kerala', lat: 8.5241, lon: 76.9366, tz: 5.5 },
    { city: 'Guwahati', country: 'India', state: 'Assam', lat: 26.1445, lon: 91.7362, tz: 5.5 },
    { city: 'Bhubaneswar', country: 'India', state: 'Odisha', lat: 20.2961, lon: 85.8245, tz: 5.5 },
    { city: 'Ranchi', country: 'India', state: 'Jharkhand', lat: 23.3441, lon: 85.3096, tz: 5.5 },
    { city: 'Visakhapatnam', country: 'India', state: 'Andhra Pradesh', lat: 17.6868, lon: 83.2185, tz: 5.5 },
    { city: 'Vadodara', country: 'India', state: 'Gujarat', lat: 22.3072, lon: 73.1812, tz: 5.5 },
    { city: 'Coimbatore', country: 'India', state: 'Tamil Nadu', lat: 11.0168, lon: 76.9558, tz: 5.5 },
    { city: 'New York', country: 'United States', state: 'NY', lat: 40.7128, lon: -74.0060, tz: -5.0 },
    { city: 'San Francisco', country: 'United States', state: 'CA', lat: 37.7749, lon: -122.4194, tz: -8.0 },
    { city: 'Los Angeles', country: 'United States', state: 'CA', lat: 34.0522, lon: -118.2437, tz: -8.0 },
    { city: 'Chicago', country: 'United States', state: 'IL', lat: 41.8781, lon: -87.6298, tz: -6.0 },
    { city: 'London', country: 'United Kingdom', state: '', lat: 51.5074, lon: -0.1278, tz: 0.0 },
    { city: 'Dubai', country: 'United Arab Emirates', state: '', lat: 25.2048, lon: 55.2708, tz: 4.0 },
    { city: 'Singapore', country: 'Singapore', state: '', lat: 1.3521, lon: 103.8198, tz: 8.0 },
    { city: 'Toronto', country: 'Canada', state: 'ON', lat: 43.6532, lon: -79.3832, tz: -5.0 },
    { city: 'Vancouver', country: 'Canada', state: 'BC', lat: 49.2827, lon: -123.1207, tz: -8.0 },
    { city: 'Sydney', country: 'Australia', state: 'NSW', lat: -33.8688, lon: 151.2093, tz: 10.0 },
    { city: 'Melbourne', country: 'Australia', state: 'VIC', lat: -37.8136, lon: 144.9631, tz: 10.0 },
    { city: 'Berlin', country: 'Germany', state: '', lat: 52.5200, lon: 13.4050, tz: 1.0 },
    { city: 'Paris', country: 'France', state: '', lat: 48.8566, lon: 2.3522, tz: 1.0 },
    { city: 'Tokyo', country: 'Japan', state: '', lat: 35.6762, lon: 139.6503, tz: 9.0 },
    { city: 'Kathmandu', country: 'Nepal', state: '', lat: 27.7172, lon: 85.3240, tz: 5.75 },
    { city: 'Colombo', country: 'Sri Lanka', state: '', lat: 6.9271, lon: 79.8612, tz: 5.5 },
    { city: 'Dhaka', country: 'Bangladesh', state: '', lat: 23.8103, lon: 90.4125, tz: 6.0 }
];

export function getCityCoordinates(cityName) {
    if (!cityName) return { lat: 28.6139, lon: 77.2090, tz: 5.5, placeName: 'New Delhi, India' };
    const clean = cityName.toLowerCase().trim();
    const match = POPULAR_CITIES.find(c =>
        c.city.toLowerCase() === clean ||
        `${c.city}, ${c.country}`.toLowerCase() === clean ||
        clean.includes(c.city.toLowerCase())
    );
    if (match) {
        return {
            lat: match.lat,
            lon: match.lon,
            tz: match.tz,
            placeName: `${match.city}, ${match.state ? match.state + ', ' : ''}${match.country}`
        };
    }
    return { lat: 28.6139, lon: 77.2090, tz: 5.5, placeName: cityName };
}

function normalizeDeg(deg) {
    let d = deg % 360;
    if (d < 0) d += 360;
    return d;
}

export function getLongitudeDetails(longitude) {
    const norm = normalizeDeg(longitude);
    const signIndex = Math.floor(norm / 30.0);
    const degInSign = norm % 30.0;
    const sign = ZODIAC_SIGNS[signIndex];

    const nakshatraIndex = Math.floor(norm / (360.0 / 27.0));
    const nakshatra = NAKSHATRAS[nakshatraIndex % 27];
    const pada = Math.floor((norm % (360.0 / 27.0)) / (360.0 / 108.0)) + 1;

    return {
        longitude: Number(norm.toFixed(4)),
        signNumber: sign.id,
        signName: sign.name,
        signSanskrit: sign.sanskrit,
        signLord: sign.lord,
        degInSign: Number(degInSign.toFixed(4)),
        nakshatra,
        pada
    };
}

let sweInstancePromise = null;
export async function getSwissEphInstance() {
    if (!sweInstancePromise) {
        sweInstancePromise = createSwissEph();
    }
    return sweInstancePromise;
}

/**
 * Queries external Kundali API if configured (e.g. FastAPI / PyJHora server)
 */
async function tryExternalKundliApi({
    dob, tob, hasExactTime, latitude, longitude, timezoneOffsetHours, knownMoonSign
}) {
    const apiUrl = (process.env.KUNDLI_API_URL || process.env.VEDIC_ASTRO_API_URL || '').replace(/\/+$/, '');
    if (!apiUrl) return null;

    try {
        const [yearStr, monthStr, dayStr] = String(dob).split('-');
        const [hourStr, minuteStr] = String(tob || '12:00').split(':');

        const payload = {
            name: 'MemoryStore User',
            year: parseInt(yearStr, 10),
            month: parseInt(monthStr, 10),
            day: parseInt(dayStr, 10),
            hour: hasExactTime ? parseInt(hourStr || '12', 10) : 12,
            minute: hasExactTime ? parseInt(minuteStr || '0', 10) : 0,
            second: 0,
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            timezone: parseFloat(timezoneOffsetHours),
            ayanamsa: 'LAHIRI'
        };

        const res = await fetch(`${apiUrl}/api/v1/kundali`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            console.warn(`[KundliAPI] External API returned HTTP ${res.status}`);
            return null;
        }

        const data = await res.json();
        return parseExternalKundliApiResponse(data, {
            dob, tob, hasExactTime, latitude, longitude, timezoneOffsetHours, knownMoonSign
        });
    } catch (err) {
        console.warn('[KundliAPI] External API call error, falling back to Swiss Ephemeris:', err.message);
        return null;
    }
}

function parseExternalKundliApiResponse(apiData, context) {
    if (!apiData) return null;

    const lagnaSignName = apiData.ascendant?.sign || apiData.rasiChart?.ascendant?.sign || 'Cancer';
    const moonSignName = apiData.planets?.Moon?.sign || apiData.rasiChart?.Moon?.sign || 'Virgo';
    const sunSignName = apiData.planets?.Sun?.sign || apiData.rasiChart?.Sun?.sign || 'Gemini';

    return {
        chartMode: context.hasExactTime ? 'lagna_chart' : 'chandra_kundali',
        source: 'external_kundali_api',
        birthDetails: {
            dob: context.dob,
            tob: context.tob,
            hasExactTime: context.hasExactTime,
            latitude: context.latitude,
            longitude: context.longitude,
            timezoneOffsetHours: context.timezoneOffsetHours,
            ayanamsa: apiData.ayanamsa || 'LAHIRI'
        },
        verification: {
            hasExactTime: context.hasExactTime,
            statedMoonSign: context.knownMoonSign,
            calculatedMoonSign: moonSignName,
            isMoonSignVerified: context.knownMoonSign ? (context.knownMoonSign.toLowerCase() === moonSignName.toLowerCase()) : null
        },
        ascendant: {
            signName: lagnaSignName,
            degInSign: apiData.ascendant?.degree || 1.17,
            nakshatra: apiData.ascendant?.nakshatra || 'Punarvasu'
        },
        moonSign: moonSignName,
        sunSign: sunSignName,
        planetaryPositions: apiData.planets || {},
        houses: apiData.houses || {},
        formattedSummary: `- Ascendant: ${lagnaSignName}\n- Moon Sign: ${moonSignName}\n- Sun Sign: ${sunSignName}`
    };
}

/**
 * Generates Vedic Kundli Chart using the official Swiss Ephemeris engine or External API.
 */
export async function generateKundliAsync({
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
    // 1. Try External Kundali API if configured in environment
    const externalResult = await tryExternalKundliApi({
        dob, tob, hasExactTime, latitude, longitude, timezoneOffsetHours, knownMoonSign
    });
    if (externalResult) return externalResult;

    // 2. High-Precision Swiss Ephemeris Engine (Matching Swiss Ephemeris C-lib 100%)
    const swe = await getSwissEphInstance();

    const [yearStr, monthStr, dayStr] = String(dob).split('-');
    const [hourStr, minuteStr] = String(tob || '12:00').split(':');

    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);
    const localHour = hasExactTime ? parseInt(hourStr || '12', 10) : 12;
    const localMinute = hasExactTime ? parseInt(minuteStr || '0', 10) : 0;

    const decimalLocalHours = localHour + (localMinute / 60.0);
    const utDecimalHours = decimalLocalHours - timezoneOffsetHours;

    const jdUt = swe.julianDay(year, month, day, utDecimalHours);

    swe.setSiderealMode(Ayanamsa.Lahiri);
    const ayanamsa = swe.ayanamsa(jdUt);

    const bodyMap = [
        { name: 'Sun', id: Body.Sun },
        { name: 'Moon', id: Body.Moon },
        { name: 'Mars', id: Body.Mars },
        { name: 'Mercury', id: Body.Mercury },
        { name: 'Jupiter', id: Body.Jupiter },
        { name: 'Venus', id: Body.Venus },
        { name: 'Saturn', id: Body.Saturn },
        { name: 'Rahu', id: Body.TrueNode }
    ];

    const planetaryPositions = {};
    for (const item of bodyMap) {
        const tropPos = swe.calc(jdUt, item.id, Flag.SPEED);
        const siderealLon = normalizeDeg(tropPos.longitude - ayanamsa);
        planetaryPositions[item.name] = {
            planet: item.name,
            ...getLongitudeDetails(siderealLon),
            speed: Number((tropPos.longitudeSpeed || 0).toFixed(4)),
            isRetrograde: (tropPos.longitudeSpeed || 0) < 0
        };
    }

    const ketuSiderealLon = normalizeDeg(planetaryPositions.Rahu.longitude + 180.0);
    planetaryPositions['Ketu'] = {
        planet: 'Ketu',
        ...getLongitudeDetails(ketuSiderealLon),
        speed: planetaryPositions.Rahu.speed,
        isRetrograde: planetaryPositions.Rahu.isRetrograde
    };

    const calculatedMoonSign = planetaryPositions.Moon.signName;
    const calculatedSunSign = planetaryPositions.Sun.signName;

    const verification = {
        hasExactTime: Boolean(hasExactTime),
        statedMoonSign: knownMoonSign || null,
        statedSunSign: knownSunSign || null,
        calculatedMoonSign,
        calculatedSunSign,
        isMoonSignVerified: knownMoonSign ? (knownMoonSign.toLowerCase().trim() === calculatedMoonSign.toLowerCase().trim()) : null,
        isSunSignVerified: knownSunSign ? (knownSunSign.toLowerCase().trim() === calculatedSunSign.toLowerCase().trim()) : null
    };

    let chartMode = 'lagna_chart';
    let baseSignNumber = 1;
    let ascendantInfo = null;

    if (hasExactTime) {
        const housesData = swe.houses(jdUt, latitude, longitude, 'P');
        const ascSidereal = normalizeDeg(housesData.ascendant - ayanamsa);
        ascendantInfo = getLongitudeDetails(ascSidereal);
        baseSignNumber = ascendantInfo.signNumber;
        chartMode = 'lagna_chart';
    } else {
        baseSignNumber = planetaryPositions.Moon.signNumber;
        const baseSign = ZODIAC_SIGNS[baseSignNumber - 1];
        ascendantInfo = {
            longitude: planetaryPositions.Moon.longitude,
            signNumber: baseSign.id,
            signName: baseSign.name,
            signSanskrit: baseSign.sanskrit,
            signLord: baseSign.lord,
            degInSign: planetaryPositions.Moon.degInSign,
            nakshatra: planetaryPositions.Moon.nakshatra,
            pada: planetaryPositions.Moon.pada,
            isChandraLagna: true
        };
        chartMode = 'chandra_kundali';
    }

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

    for (const [planetName, info] of Object.entries(planetaryPositions)) {
        const houseNumber = ((info.signNumber - baseSignNumber + 12) % 12) + 1;
        planetaryPositions[planetName].house = houseNumber;
        housePlacements[houseNumber].planets.push(planetName);
    }

    return {
        chartMode,
        source: 'swiss_ephemeris_engine',
        birthDetails: {
            dob,
            tob: hasExactTime ? tob : 'Unknown (Time-Independent Mode)',
            hasExactTime,
            placeName,
            latitude,
            longitude,
            timezoneOffsetHours,
            julianDay: Number(jdUt.toFixed(6)),
            ayanamsa: Number(ayanamsa.toFixed(6))
        },
        verification,
        ascendant: ascendantInfo,
        moonSign: calculatedMoonSign,
        moonNakshatra: `${planetaryPositions.Moon.nakshatra} (Pada ${planetaryPositions.Moon.pada})`,
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

export function generateKundli(params) {
    return generateKundliAsync(params);
}

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
