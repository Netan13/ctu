(function () {
    if (navigator.language === "fr-FR") {
        document.title = "CTU - Calendrier Terrestre Universel";
        const mark = document.getElementById("mark");
        if (mark) mark.textContent = "après l'éclispe de Bûr-Sagalé";
        const sunLabel = document.getElementById("sun-label");
        if (sunLabel) sunLabel.textContent = "Lever et Coucher de Soleil";
    }
    startCTU();
})();

function $(idA, idB) {
    return document.getElementById(idA) || document.getElementById(idB);
}

function setText(idA, idB, value) {
    const el = $(idA, idB);
    if (el && el.textContent !== value) el.textContent = value;
}

function setMeta(nameA, nameB, value) {
    const m =
        document.querySelector(`meta[name="${nameA}"]`) ||
        document.querySelector(`meta[name="${nameB}"]`);
    m?.setAttribute("content", value);
}

let lastGeo = null;
let lastSunRefresh = 0;

function updateMainDisplay() {
    const now = new Date();
    const ctu = now.toCTU(); // uses date_compute from date.js

    // Calendar
    const solion = (ctu.solion ?? ctu.spinion);
    setText("solion", "spinion", String(salionOr(solion)));
    setMeta("ctu-solion", "ctu-spinion", String(salionOr(solion)));

    setText("lunition", "lunition", ctu.lunitionName);
    setMeta("ctu-lunition", "ctu-lunition", String(ctu.lunition));

    setText("orbion", "orbion", String(ctu.orbion));
    setMeta("ctu-orbion", "ctu-orbion", String(ctu.orbion));

    // Clock
    const timeStr = ctu_format_time(ctu);
    // split for old/new ids
    const [hh, mm, ss] = timeStr.split(":");

    setText("decor", "spinor", hh);
    setMeta("ctu-decor", "ctu-spinor", hh);

    setText("milor", "minor", mm);
    setMeta("ctu-milor", "ctu-minor", mm);

    setText("cenor", "secor", ss);
    setMeta("ctu-cenor", "ctu-secor", ss);

    // Local time (kept)
    setText("hours", "hours", String(now.getHours()).padStart(2, "0"));
    setText("minutes", "minutes", String(now.getMinutes()).padStart(2, "0"));
    setText("secondes", "secondes", String(now.getSeconds()).padStart(2, "0"));
}

function salionOr(solion) {
    // helper to avoid typo in updateMainDisplay
    return solion;
}

function updateSunTimesIfPossible() {
    if (!lastGeo) return;

    const now = new Date();
    // refresh at most once per minute
    if (now.getTime() - lastSunRefresh < 60_000) return;
    lastSunRefresh = now.getTime();

    const lat = lastGeo.coords.latitude;
    const lon = lastGeo.coords.longitude;

    const sunriseDate = new Date().sunrise(lat, lon);
    const sunsetDate = new Date().sunset(lat, lon);

    const sunriseCTU = date_compute(sunriseDate);
    const sunsetCTU = date_compute(sunsetDate);

    // "J gap" based on elapsedDays (calendar), as you did before
    const todayElapsedDays = now.toJulian() - ORIGIN_UEC;

    const sunriseGap = Math.floor(sunriseCTU.elapsedDays) - Math.floor(todayElapsedDays);
    const sunsetGap = Math.floor(sunsetCTU.elapsedDays) - Math.floor(todayElapsedDays);

    const sunriseStr =
        `${ctu_format_time(sunriseCTU)}` +
        (sunriseGap > 0 ? ` +1J` : sunriseGap < 0 ? ` -1J` : ``) +
        ` CTU`;

    const sunsetStr =
        `${ctu_format_time(sunsetCTU)}` +
        (sunsetGap > 0 ? ` +1J` : sunsetGap < 0 ? ` -1J` : ``) +
        ` CTU`;

    setText("local-sunrise", "local-sunrise", sunriseStr);
    setMeta("ctu-local-sunrise", "ctu-local-sunrise", sunriseStr);

    setText("local-sunset", "local-sunset", sunsetStr);
    setMeta("ctu-local-sunset", "ctu-local-sunset", sunsetStr);
}

function startCTU() {
    // one geolocation request, then cached
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                lastGeo = pos;
                // update immediately after getting location
                lastSunRefresh = 0;
                updateSunTimesIfPossible();
            },
            () => { /* ignore if denied */ },
            { maximumAge: 600000, timeout: 5000 }
        );
    }

    function tick() {
        updateMainDisplay();
        updateSunTimesIfPossible();
        requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
}
