// UEC Origin : June 15th -763 BC 12:00am GMT+3
// The Assyrian eclipse, also known as the Bur-Sagale eclipse.
// The first precisely dated astronomical event
const ORIGIN_UEC = 1486102.5;

const LUNITIONS = [
    "Nuiron", "Kelva", "Drenae", "Vellune", "Rokel", "Cereon",
    "Elvora", "Zailun", "Aruel", "Thylis", "Velunor", "Ombran", "Siliane"
];

// Calendar shaping (your CTU calendar conventions)
const NUIRON_DURATION = 11;
const LUNITION_DURATION = 29;

// "Solion" as solar day for the civil timeline base.
// We keep it here because Julian Day is defined with 86400s per day.
const SOLION_DURATION = 86400;

// Mean tropical year (used by your calendar math)
const ORBION_DURATION = 365.2422;

// -----------------------------
// Sunrise / Sunset (unchanged)
// -----------------------------
Date.prototype.sunrise = function (latitude, longitude, zenith) {
    return this.sunriseSet(latitude, longitude, true, zenith);
};

Date.prototype.sunset = function (latitude, longitude, zenith) {
    return this.sunriseSet(latitude, longitude, false, zenith);
};

Date.prototype.sunriseSet = function (latitude, longitude, sunrise, zenith) {
    if (!zenith) zenith = 90.8333;

    const hoursFromMeridian = longitude / Date.DEGREES_PER_HOUR;
    const dayOfYear = this.getDayOfYear();

    let approxTimeOfEventInDays;
    if (sunrise) {
        approxTimeOfEventInDays = dayOfYear + ((6 - hoursFromMeridian) / 24);
    } else {
        approxTimeOfEventInDays = dayOfYear + ((18.0 - hoursFromMeridian) / 24);
    }

    const sunMeanAnomaly = (0.9856 * approxTimeOfEventInDays) - 3.289;

    let sunTrueLongitude =
        sunMeanAnomaly +
        (1.916 * Math.sinDeg(sunMeanAnomaly)) +
        (0.020 * Math.sinDeg(2 * sunMeanAnomaly)) +
        282.634;

    sunTrueLongitude = Math.mod(sunTrueLongitude, 360);

    const ascension = 0.91764 * Math.tanDeg(sunTrueLongitude);

    let rightAscension = 360 / (2 * Math.PI) * Math.atan(ascension);
    rightAscension = Math.mod(rightAscension, 360);

    const lQuadrant = Math.floor(sunTrueLongitude / 90) * 90;
    const raQuadrant = Math.floor(rightAscension / 90) * 90;

    rightAscension = rightAscension + (lQuadrant - raQuadrant);
    rightAscension /= Date.DEGREES_PER_HOUR;

    const sinDec = 0.39782 * Math.sinDeg(sunTrueLongitude);
    const cosDec = Math.cosDeg(Math.asinDeg(sinDec));

    const cosLocalHourAngle =
        ((Math.cosDeg(zenith)) - (sinDec * (Math.sinDeg(latitude)))) /
        (cosDec * (Math.cosDeg(latitude)));

    let localHourAngle = Math.acosDeg(cosLocalHourAngle);

    if (sunrise) localHourAngle = 360 - localHourAngle;

    const localHour = localHourAngle / Date.DEGREES_PER_HOUR;

    const localMeanTime =
        localHour +
        rightAscension -
        (0.06571 * approxTimeOfEventInDays) -
        6.622;

    let time = localMeanTime - (longitude / Date.DEGREES_PER_HOUR);
    time = Math.mod(time, 24);

    const midnight = new Date(0);
    midnight.setUTCFullYear(this.getUTCFullYear());
    midnight.setUTCMonth(this.getUTCMonth());
    midnight.setUTCDate(this.getUTCDate());

    const milli = midnight.getTime() + (time * 60 * 60 * 1000);
    return new Date(milli);
};

// -----------------------------
// Julian Day (as in your code)
// NOTE: kept as-is to avoid breaking your existing baseline.
// -----------------------------
Date.prototype.toJulian = function () {
    const msPerDay = 86400000;
    const epochJD = 2440587.5;
    return (this / msPerDay) - (this.getTimezoneOffset() / 1440) + epochJD;
};

// -----------------------------
// Calendar (orbion/lunition/solion)
// -----------------------------
function date_elapsedDaysToSolionLunionOrbion(elapsedDays) {
    let orbion = (elapsedDays / ORBION_DURATION);
    let solionOfOrbion = Math.mod(elapsedDays, ORBION_DURATION);
    let lunition, solion;

    // instant 0 : 1/1/0
    if (Math.abs(orbion) < 1e-12 && Math.abs(solionOfOrbion) < 1e-12) {
        lunition = 1;
        solion = 1;
    } else {
        if (orbion > 0) {
            // orbion "normal" : Nuiron existe
            if (solionOfOrbion < NUIRON_DURATION) {
                lunition = 0;
                solion = solionOfOrbion; // solion peut valoir 0
            } else {
                solionOfOrbion -= NUIRON_DURATION;
                lunition = (solionOfOrbion / LUNITION_DURATION) + 1;
                solion = solionOfOrbion % LUNITION_DURATION;
            }
        } else {
            // orbion <= 0 : pas de Nuiron
            lunition = (solionOfOrbion / LUNITION_DURATION) + 1;
            solion = solionOfOrbion % LUNITION_DURATION;
        }

        if (solion === 0) solion = 0;
        else solion += 1;
    }

    solion = Math.floor(solion);
    lunition = Math.floor(lunition % 13);
    orbion = Math.floor(orbion);

    return {solion, lunition, orbion};
}

// -----------------------------
// Sidereal rotation (decor/milor/cenor)
// decor = π/10 rad => 20 decor per full spin (2π)
// base 100: milor/ cenor
// -----------------------------
function gmstRadiansFromJD(jd) {
    const T = (jd - 2451545.0) / 36525.0;

    let gmstDeg =
        280.46061837 +
        360.98564736629 * (jd - 2451545.0) +
        0.000387933 * T * T -
        (T * T * T) / 38710000.0;

    gmstDeg = ((gmstDeg % 360) + 360) % 360; // [0,360)
    return (gmstDeg * Math.PI) / 180;        // [0,2π)
}

function date_siderealClockFromJD(jd) {
    const theta = gmstRadiansFromJD(jd);             // [0,2π)
    const frac = theta / (2 * Math.PI);             // [0,1)

    // 20 decor per spin, then base-100 subdivisions
    const decor = Math.floor(frac * 20);             // 0..19
    const milor = Math.floor((frac * 2000) % 100);   // 0..99
    const cenor = Math.floor((frac * 200000) % 100); // 0..99

    return {decor, milor, cenor, siderealFraction: frac, siderealRadians: theta};
}

// -----------------------------
// Formatting helpers (shared)
// -----------------------------
function ctu_pad2(n) {
    return String(n).padStart(2, "0");
}

function ctu_format_time(ctuLike) {
    const decor = ctuLike.decor ?? ctuLike.spinor ?? 0;
    const milor = ctuLike.milor ?? ctuLike.minor ?? 0;
    const cenor = ctuLike.cenor ?? ctuLike.secor ?? 0;
    return `${ctu_pad2(decor)}:${ctu_pad2(milor)}:${ctu_pad2(cenor)}`;
}

// -----------------------------
// Main compute
// -----------------------------
function date_compute(date) {
    const d = (date instanceof Date) ? date : new Date(date);
    if (Number.isNaN(d.getTime())) throw new Error("Invalid date for date_compute");

    const jd = d.toJulian();
    const elapsedDays = jd - ORIGIN_UEC;

    // Calendar
    const {solion, lunition, orbion} =
        date_elapsedDaysToSolionLunionOrbion(elapsedDays);

    // Clock (sidereal)
    const clock = date_siderealClockFromJD(jd);

    // For legacy/debug
    const elapsedSecondsSolar = elapsedDays * SOLION_DURATION;

    return {
        // new names
        solion,
        lunition,
        lunitionName: LUNITIONS[lunition],
        orbion,

        decor: clock.decor,
        milor: clock.milor,
        cenor: clock.cenor,

        // legacy aliases (temporary)
        spinion: solion,
        spinor: clock.decor,
        minor: clock.milor,
        secor: clock.cenor,

        // extras
        julianDay: jd,
        elapsedDays,
        elapsedSecondsSolar,
        siderealRadians: clock.siderealRadians,
        siderealFraction: clock.siderealFraction
    };
}

Date.prototype.toCTU = function () {
    return date_compute(this);
};

Date.DEGREES_PER_HOUR = 360 / 24;

// -----------------------------
// Utility functions (unchanged)
// -----------------------------
Date.prototype.getDayOfYear = function () {
    const onejan = new Date(this.getFullYear(), 0, 1);
    return Math.ceil((this - onejan) / 86400000);
};

Math.degToRad = function (num) {
    return num * Math.PI / 180;
};
Math.radToDeg = function (radians) {
    return radians * 180.0 / Math.PI;
};

Math.sinDeg = function (deg) {
    return Math.sin(deg * 2.0 * Math.PI / 360.0);
};
Math.acosDeg = function (x) {
    return Math.acos(x) * 360.0 / (2 * Math.PI);
};
Math.asinDeg = function (x) {
    return Math.asin(x) * 360.0 / (2 * Math.PI);
};
Math.tanDeg = function (deg) {
    return Math.tan(deg * 2.0 * Math.PI / 360.0);
};
Math.cosDeg = function (deg) {
    return Math.cos(deg * 2.0 * Math.PI / 360.0);
};

Math.mod = function (a, b) {
    let result = a % b;
    if (result < 0) result += b;
    return result;
};

// Expose helpers if needed by other pages
window.date_compute = date_compute;
window.ctu_pad2 = ctu_pad2;
window.ctu_format_time = ctu_format_time;
window.LUNITIONS = LUNITIONS;
window.ORIGIN_UEC = ORIGIN_UEC;
