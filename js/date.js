// CTU — core date/time logic (Option A: Reference meridian = Ninive/Mossoul)
//
// Bur-Sagale eclipse defines:
// - a reference instant: ORIGIN_UEC (Julian Day)
// - a reference location: REF_LONGITUDE_DEG (meridian of reference)
//
// Conventions:
// - Calendar: solion/lunition are 1-based for display (origin => 1/1/0000)
// - Solion switches at anti-zenith (midnight) ON THE REFERENCE MERIDIAN
// - Clock: decor/milor/cenor tick at sidereal rate (1 decor = π/10 rad => 20 decor per spin)
// - Clock is a "day clock" anchored to reference midnight, with a phase offset such that
//   ORIGIN_UEC displays 10:00:00 CTU.

// =========================
// Utilities FIRST (order matters)
// =========================

Math.mod = function (a, b) {
    let result = a % b;
    if (result < 0) result += b;
    return result;
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

Date.DEGREES_PER_HOUR = 360 / 24;

Date.prototype.getDayOfYear = function () {
    const onejan = new Date(this.getFullYear(), 0, 1);
    return Math.ceil((this - onejan) / 86400000);
};

// =========================
// Constants
// =========================

const ORIGIN_UEC = 1486102.5;

// Reference meridian (Ninive/Mossoul). Adjust if you want finer anchoring.
const REF_LONGITUDE_DEG = 43.15; // ~ Mosul / Nineveh (east positive)

// Calendar naming
const LUNITIONS = [
    "Nuiron", "Kelva", "Drenae", "Vellune", "Rokel", "Cereon",
    "Elvora", "Zailun", "Aruel", "Thylis", "Velunor", "Ombran", "Siliane"
];

// Calendar shaping (your CTU conventions)
const NUIRON_DURATION = 11;   // solions
const LUNITION_DURATION = 29; // solions

// Julian Day uses 86400s per day by definition
const SOLION_DURATION = 86400;

// Used by your calendar math (mean tropical year)
const ORBION_DURATION = 365.2422;

// Mean sidereal day length in seconds
const SIDEREAL_DAY_SECONDS = 86164.0905;

// =========================
// Julian Day in UTC (no timezone offset)
// =========================

Date.prototype.toJulian = function () {
    const msPerDay = 86400000;
    const epochJD = 2440587.5;
    return (this.getTime() / msPerDay) + epochJD;
};

// =========================
// Sunrise / Sunset (unchanged)
// =========================

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

// =========================
// Reference-meridian helpers
// =========================

function jdToJdRef(jdUtc) {
    // Shift by longitude: +λ/360 day
    return jdUtc + (REF_LONGITUDE_DEG / 360);
}

function jdnFromJdRef(jdRef) {
    // JDN changes at midnight on the reference meridian
    return Math.floor(jdRef + 0.5);
}

function fracDayFromJdRef(jdRef) {
    // Fraction since reference midnight (0 at reference midnight)
    return Math.mod(jdRef + 0.5, 1);
}

// =========================
// Calendar mapping (1-based solion/lunition)
// =========================

function elapsedSolionsToCalendar(elapsedSolionsInt) {
    let orbion = Math.floor(elapsedSolionsInt / ORBION_DURATION);
    let solionOfOrbion = Math.mod(elapsedSolionsInt, ORBION_DURATION);

    let lunition; // 1..13
    let solion;   // 1..len

    if (orbion >= 0) {
        if (solionOfOrbion < NUIRON_DURATION) {
            lunition = 1;
            solion = Math.floor(solionOfOrbion) + 1;
        } else {
            solionOfOrbion -= NUIRON_DURATION;
            lunition = 2 + Math.floor(solionOfOrbion / LUNITION_DURATION);
            solion = Math.floor(solionOfOrbion % LUNITION_DURATION) + 1;
        }
    } else {
        lunition = 2 + Math.floor(solionOfOrbion / LUNITION_DURATION);
        solion = Math.floor(solionOfOrbion % LUNITION_DURATION) + 1;
        while (lunition > 13) lunition -= 13;
        while (lunition < 1) lunition += 13;
    }

    const lunitionIndex = lunition - 1;
    return {solion, lunition, lunitionIndex, orbion};
}

// =========================
// Clock: sidereal-rate day clock anchored to reference midnight
// =========================

function spinFractionFromJdRef(jdRef) {
    const fDay = fracDayFromJdRef(jdRef);      // 0..1
    const tSolar = fDay * SOLION_DURATION;     // 0..86400
    return Math.mod(tSolar / SIDEREAL_DAY_SECONDS, 1);
}

// Phase offset so ORIGIN_UEC shows 10:00:00 (decor=10 => fraction 0.5)
const ORIGIN_TARGET_SPIN_FRACTION = 0.5;
const CLOCK_PHASE_OFFSET_FRACTION = (() => {
    const jdRefOrigin = jdToJdRef(ORIGIN_UEC);
    const fOrigin = spinFractionFromJdRef(jdRefOrigin);
    return Math.mod(ORIGIN_TARGET_SPIN_FRACTION - fOrigin, 1);
})();

function clockFromJdRef(jdRef) {
    let fSpin = spinFractionFromJdRef(jdRef);
    fSpin = Math.mod(fSpin + CLOCK_PHASE_OFFSET_FRACTION, 1);

    const decor = Math.floor(fSpin * 20);
    const milor = Math.floor((fSpin * 2000) % 100);
    const cenor = Math.floor((fSpin * 200000) % 100);

    return {decor, milor, cenor, spinFraction: fSpin};
}

// =========================
// Formatting helpers
// =========================

function ctu_pad2(n) {
    return String(n).padStart(2, "0");
}

function ctu_format_time(ctuLike) {
    const decor = ctuLike.decor ?? ctuLike.spinor ?? 0;
    const milor = ctuLike.milor ?? ctuLike.minor ?? 0;
    const cenor = ctuLike.cenor ?? ctuLike.secor ?? 0;
    return `${ctu_pad2(decor)}:${ctu_pad2(milor)}:${ctu_pad2(cenor)}`;
}

// =========================
// Main compute
// =========================

function date_compute(date) {
    const d = (date instanceof Date) ? date : new Date(date);
    if (Number.isNaN(d.getTime())) throw new Error("Invalid date for date_compute");

    const jdUtc = d.toJulian();
    const jdRef = jdToJdRef(jdUtc);

    const jdnNowRef = jdnFromJdRef(jdRef);
    const jdnOriginRef = jdnFromJdRef(jdToJdRef(ORIGIN_UEC));
    const elapsedSolions = jdnNowRef - jdnOriginRef; // changes at ref midnight

    const cal = elapsedSolionsToCalendar(elapsedSolions);
    const lunitionName = LUNITIONS[cal.lunitionIndex];

    const clk = clockFromJdRef(jdRef);

    const elapsedDaysUtc = jdUtc - ORIGIN_UEC;
    const elapsedSecondsSolarUtc = elapsedDaysUtc * SOLION_DURATION;

    return {
        // Calendar
        solion: cal.solion,
        lunition: cal.lunition,           // 1..13
        lunitionIndex: cal.lunitionIndex, // 0..12
        lunitionName,
        orbion: cal.orbion,

        // Clock
        decor: clk.decor,
        milor: clk.milor,
        cenor: clk.cenor,

        // Legacy aliases
        spinion: cal.solion,
        spinor: clk.decor,
        minor: clk.milor,
        secor: clk.cenor,

        // Debug
        julianDayUtc: jdUtc,
        julianDayRef: jdRef,
        jdnNowRef,
        elapsedSolions,
        spinFraction: clk.spinFraction,
        elapsedDaysUtc,
        elapsedSecondsSolarUtc
    };
}

Date.prototype.toCTU = function () {
    return date_compute(this);
};

// =========================
// Expose
// =========================

window.date_compute = date_compute;
window.ctu_pad2 = ctu_pad2;
window.ctu_format_time = ctu_format_time;
window.LUNITIONS = LUNITIONS;
window.ORIGIN_UEC = ORIGIN_UEC;
window.REF_LONGITUDE_DEG = REF_LONGITUDE_DEG;
