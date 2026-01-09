// UEC Origin : June 15th -763 BC 12:00am GMT+3
// The Assyrian eclipse, also known as the Bur-Sagale eclipse.
// The first precisely dated astronomical event

// =========================
// Utilities
// =========================

Math.mod = function (a, b) {
    let r = a % b;
    if (r < 0) r += b;
    return r;
};

Math.sinDeg = function (deg) { return Math.sin(deg * 2.0 * Math.PI / 360.0); };
Math.acosDeg = function (x) { return Math.acos(x) * 360.0 / (2 * Math.PI); };
Math.asinDeg = function (x) { return Math.asin(x) * 360.0 / (2 * Math.PI); };
Math.tanDeg = function (deg) { return Math.tan(deg * 2.0 * Math.PI / 360.0); };
Math.cosDeg = function (deg) { return Math.cos(deg * 2.0 * Math.PI / 360.0); };

Date.DEGREES_PER_HOUR = 360 / 24;

Date.prototype.getDayOfYear = function () {
    const onejan = new Date(this.getFullYear(), 0, 1);
    return Math.ceil((this - onejan) / 86400000);
};

// =========================
// Constants
// =========================

const ORIGIN_UEC = 1486102.5;

const REF_LONGITUDE_DEG = 43.15;

const LUNITIONS = [
    "Nuiron", "Kelva", "Drenae", "Vellune", "Rokel", "Cereon",
    "Elvora", "Zailun", "Aruel", "Thylis", "Velunor", "Ombran", "Siliane"
];

// Structuration calendrier
const NUIRON_DURATION = 11;   // solions
const LUNITION_DURATION = 29; // solions
const ORBION_DURATION = 365.2422;

const SOLION_DURATION = 86400;

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

    const approx = sunrise
        ? dayOfYear + ((6 - hoursFromMeridian) / 24)
        : dayOfYear + ((18.0 - hoursFromMeridian) / 24);

    const M = (0.9856 * approx) - 3.289;

    let L =
        M +
        (1.916 * Math.sinDeg(M)) +
        (0.020 * Math.sinDeg(2 * M)) +
        282.634;

    L = Math.mod(L, 360);

    const asc = 0.91764 * Math.tanDeg(L);

    let RA = 360 / (2 * Math.PI) * Math.atan(asc);
    RA = Math.mod(RA, 360);

    const Lq = Math.floor(L / 90) * 90;
    const RAq = Math.floor(RA / 90) * 90;
    RA = (RA + (Lq - RAq)) / Date.DEGREES_PER_HOUR;

    const sinDec = 0.39782 * Math.sinDeg(L);
    const cosDec = Math.cosDeg(Math.asinDeg(sinDec));

    const cosH =
        (Math.cosDeg(zenith) - sinDec * Math.sinDeg(latitude)) /
        (cosDec * Math.cosDeg(latitude));

    let H = Math.acosDeg(cosH);
    if (sunrise) H = 360 - H;

    const localHour = H / Date.DEGREES_PER_HOUR;

    const T =
        localHour +
        RA -
        (0.06571 * approx) -
        6.622;

    let UT = T - (longitude / Date.DEGREES_PER_HOUR);
    UT = Math.mod(UT, 24);

    const midnight = new Date(0);
    midnight.setUTCFullYear(this.getUTCFullYear());
    midnight.setUTCMonth(this.getUTCMonth());
    midnight.setUTCDate(this.getUTCDate());

    return new Date(midnight.getTime() + UT * 3600 * 1000);
};

// =========================
// Reference-meridian helpers
// =========================

// Convertit un JD UTC "courant" en JD "référence" (méridien Ninive/Mossoul)
function jdToJdRefFromUtc(jdUtc) {
    // East longitude => local solar time ahead => +λ/360 day
    return jdUtc + (REF_LONGITUDE_DEG / 360);
}

function jdnFromJdRef(jdRef) {
    // Changement de jour à minuit référence : floor(jdRef + 0.5)
    return Math.floor(jdRef + 0.5);
}

function fracDayFromJdRef(jdRef) {
    // Fraction de journée depuis minuit référence (0 à minuit référence)
    return Math.mod(jdRef + 0.5, 1);
}

// =========================
// Calendar mapping (1-based solion/lunition)
// =========================

function elapsedSolionsToCalendar(elapsedSolionsInt) {
    const orbion = Math.floor(elapsedSolionsInt / ORBION_DURATION);
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
        // legacy: orbions négatifs sans Nuiron
        lunition = 2 + Math.floor(solionOfOrbion / LUNITION_DURATION);
        solion = Math.floor(solionOfOrbion % LUNITION_DURATION) + 1;
        while (lunition > 13) lunition -= 13;
        while (lunition < 1) lunition += 13;
    }

    const lunitionIndex = lunition - 1;
    return { solion, lunition, lunitionIndex, orbion };
}

// =========================
// Clock (sidereal-rate, anchored to ref midnight)
// =========================

function spinFractionFromJdRef(jdRef) {
    const fDay = fracDayFromJdRef(jdRef);   // 0..1 (solar day fraction)
    const tSolar = fDay * SOLION_DURATION;  // seconds since ref midnight (solar seconds)

    // Convert to sidereal-spin fraction:
    // one spin = SIDEREAL_DAY_SECONDS
    return Math.mod(tSolar / SIDEREAL_DAY_SECONDS, 1);
}

// Calibration: at eclipse moment (ORIGIN_UEC + 0.5), CTU time must be 10:00:00
const TARGET_SPIN_FRACTION_AT_ECLIPSE = 0.5; // 10/20
const CLOCK_PHASE_OFFSET_FRACTION = (() => {
    // ORIGIN_UEC is already in reference JD => do NOT shift it.
    const eclipseMoment = ORIGIN_UEC + 0.5;
    const fEclipse = spinFractionFromJdRef(eclipseMoment);
    return Math.mod(TARGET_SPIN_FRACTION_AT_ECLIPSE - fEclipse, 1);
})();

function clockFromJdRef(jdRef) {
    let fSpin = spinFractionFromJdRef(jdRef);
    fSpin = Math.mod(fSpin + CLOCK_PHASE_OFFSET_FRACTION, 1);

    const decor = Math.floor(fSpin * 20);            // 0..19
    const milor = Math.floor((fSpin * 2000) % 100);  // 0..99
    const cenor = Math.floor((fSpin * 200000) % 100);// 0..99

    return { decor, milor, cenor, spinFraction: fSpin };
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

    // "Now" in UTC JD, then mapped to reference-meridian JD
    const jdUtcNow = d.toJulian();
    const jdRefNow = jdToJdRefFromUtc(jdUtcNow);

    // Origin is already reference JD midnight => do NOT shift it.
    const jdnNowRef = jdnFromJdRef(jdRefNow);
    const jdnOriginRef = jdnFromJdRef(ORIGIN_UEC);

    const elapsedSolions = jdnNowRef - jdnOriginRef;

    const cal = elapsedSolionsToCalendar(elapsedSolions);
    const lunitionName = LUNITIONS[cal.lunitionIndex];

    const clk = clockFromJdRef(jdRefNow);

    // debug
    const elapsedDaysUtc = jdUtcNow - ORIGIN_UEC;

    return {
        // Calendar
        solion: cal.solion,
        lunition: cal.lunition,
        lunitionIndex: cal.lunitionIndex,
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

        // Extras
        julianDayUtcNow: jdUtcNow,
        julianDayRefNow: jdRefNow,
        jdnNowRef,
        elapsedSolions,
        spinFraction: clk.spinFraction,
        elapsedDaysUtc,
        refLongitudeDeg: REF_LONGITUDE_DEG,
        originUec: ORIGIN_UEC
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
