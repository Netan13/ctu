(function () {
    // Petit ajustement FR
    if (navigator.language === "fr-FR") {
        document.title = "CTU";
        document
            .querySelector('meta[name="description"]')
            ?.setAttribute("content", "Calendrier Terrestre Universel");
    }

    tick();
})();

function pad2(n) {
    return String(n).padStart(2, "0");
}

function render(now) {
    const dateEl = document.getElementById("ctu-date");
    const timeEl = document.getElementById("ctu-time");

    if (typeof date_compute !== "function") {
        dateEl.textContent = "CTU non dispo";
        timeEl.textContent = "Tu as bien chargé date.js ?";
        return;
    }

    const c = date_compute(now);

    // Noms nouveaux + fallback anciens
    const solion = c.solion ?? c.spinion;
    const lunitionName = c.lunitionName ?? (typeof LUNITIONS !== "undefined" ? LUNITIONS[c.lunition] : "");
    const orbion = c.orbion;

    const decor = c.decor ?? c.spinor;
    const milor = c.milor ?? c.minor;
    const cenor = c.cenor ?? c.secor;

    dateEl.textContent = `${solion} ${lunitionName} ${orbion}`;
    timeEl.textContent = `${pad2(decor)}:${pad2(milor)}:${pad2(cenor)} CTU`;
}

function tick() {
    render(new Date());
    requestAnimationFrame(tick);
}
