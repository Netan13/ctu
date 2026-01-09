// UEC Origin : June 15th -763 BC 12:00am GMT+3
// The Assyrian eclipse, also known as the Bur-Sagale eclipse.
//
// Convention CTU : Bur-Sagale = 1/1/0000 at 10:00:00 CTU
// - Solion changes at anti-zenith (midnight) in UTC (stable universal rule).
// - Clock is sidereal (GMST), with a phase offset so that ORIGIN maps to 10:00:00.

const ORIGIN_UEC = 1486102.5;

const LUNITIONS = [
    "Nuiron", "Kelva", "Drenae", "Vellune", "Rokel", "Cereon",
    "Elvora", "Zailun", "Aruel", "Thylis", "Velunor", "Ombran", "Siliane"
];

// Calendar shaping (your CTU calendar conventions)
const NUIRON_DURATION = 11;
const LUNITION_DURATION = 29;

// Julian Day uses 86400s days by definition (civil day base)
const SOLION_DURATION = 86400;

// Mean tropical year used by your calendar math
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
    if (sunrise) approxTimeOfEventInDays = dayOfYear + ((6 - hoursFromMeridian) / 24);
    else approxTimeOfEventInDays = dayOfYear + ((18.0 - hoursFromMeridian) / 24);

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
// Julian Day in UTC (NO timezone offset)
// This is mandatory for GMST and stable day counting.
// -----------------------------
Date.prototype.toJulian = function () {
    const msPerDay = 86400000;
    const epochJD = 2440587.5;
    return (this.getTime() / msPerDay) + epochJD;
};

// -----------------------------
// Calendar: elapsed solions -> (solion, lunition, orbion)
// 1-based solion/lunition for display conventions.
// -----------------------------
function date_elapsedSolionsToCalendar(elapsedSolionsInt) {
    let orbion = Math.floor(elapsedSolionsInt / ORBION_DURATION);
    let solionOfOrbion = Math.mod(elapsedSolionsInt, ORBION_DURATION);

    let lunition; // 1..13
    let solion;   // 1..len

    if (orbion >= 0) {
        // Nuiron = lunition 1
        if (solionOfOrbion < NUIRON_DURATION) {
            lunition = 1;
            solion = Math.floor(solionOfOrbion) + 1;
        } else {
            solionOfOrbion -= NUIRON_DURATION;
            lunition = 2 + Math.floor(solionOfOrbion / LUNITION_DURATION); // 2..13
            solion = Math.floor(solionOfOrbion % LUNITION_DURATION) + 1;   // 1..29
        }
    } else {
        // Legacy rule: negative orbions without Nuiron
        lunition = 2 + Math.floor(solionOfOrbion / LUNITION_DURATION);
        solion = Math.floor(solionOfOrbion % LUNITION_DURATION) + 1;

        while (lunition > 13) lunition -= 13;
        while (lunition < 1) lunition += 13;
    }

    const lunitionIndex = lunition - 1;
    return {solion, lunition, lunitionIndex, orbion};
}

// -----------------------------
// Sidereal clock: GMST (UTC JD) + phase offset
// decor = π/10 rad => 20 decor per spin
// milor, cenor are base-100 subdivisions
// -----------------------------
function gmstRadiansFromJD(jd) {
    const T = (jd - 2451545.0) / 36525.0;

    let gmstDeg =
        280.46061837 +
        360.98564736629 * (jd - 2451545.0) +
        0.000387933 * T * T -
        (T * T * T) / 38710000.0;

    gmstDeg = ((gmstDeg % 360) + 360) % 360;
    return (gmstDeg * Math.PI) / 180;
}

const TWO_PI = 2 * Math.PI;

// ORIGIN should display 10:00:00 => decor=10 => fraction=10/20=0.5 => angle=π
const ORIGIN_TARGET_THETA = Math.PI;

const CLOCK_PHASE_OFFSET = (() => {
    const thetaAtOrigin = gmstRadiansFromJD(ORIGIN_UEC);
    let off = ORIGIN_TARGET_THETA - thetaAtOrigin;
    off = ((off % TWO_PI) + TWO_PI) % TWO_PI;
    return off;
})();

function date_siderealClockFromJD(jd) {
    let theta = gmstRadiansFromJD(jd);
    theta = (theta + CLOCK_PHASE_OFFSET) % TWO_PI;

    const frac = theta / TWO_PI;

    const decor = Math.floor(frac * 20);               // 0..19
    const milor = Math.floor((frac * 2000) % 100);     // 0..99
    const cenor = Math.floor((frac * 200000) % 100);   // 0..99

    return {decor, milor, cenor, siderealFraction: frac, siderealRadians: theta};
}

// -----------------------------
// Formatting helpers
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

    // JDN changes at midnight (UTC) when using UTC JD:
    const jdnNow = Math.floor(jd + 0.5);
    const jdnOrigin = Math.floor(ORIGIN_UEC + 0.5);

    const elapsedSolions = jdnNow - jdnOrigin; // integer, changes at UTC midnight

    const elapsedDays = jd - ORIGIN_UEC;
    const elapsedSecondsSolar = elapsedDays * SOLION_DURATION;

    const {solion, lunition, lunitionIndex, orbion} =
        date_elapsedSolionsToCalendar(elapsedSolions);

    const lunitionName = LUNITIONS[lunitionIndex];

    const clock = date_siderealClockFromJD(jd);

    return {
        // New names
        solion,
        lunition,           // 1..13
        lunitionIndex,      // 0..12
        lunitionName,
        orbion,

        decor: clock.decor,
        milor: clock.milor,
        cenor: clock.cenor,

        // Legacy aliases (temporary)
        spinion: solion,
        spinor: clock.decor,
        minor: clock.milor,
        secor: clock.cenor,

        // Extras
        julianDay: jd,
        jdnNow,
        elapsedSolions,
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
// Utility functions
// -----------------------------
Date.prototype.getDayOfYear = function () {
    const onejan = new Date(this.getFullYear(), 0, 1);
    return Math.ceil((this - onejan) / 86400000);
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

// Expose
window.date_compute = date_compute;
window.ctu_pad2 = ctu_pad2;
window.ctu_format_time = ctu_format_time;
window.LUNITIONS = LUNITIONS;
window.ORIGIN_UEC = ORIGIN_UEC;
