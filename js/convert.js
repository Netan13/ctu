(function () {
    if (navigator.language === "fr-FR") {
        document.title = "CTU - Convertisseur";
        document
            .querySelector('meta[name="description"]')
            ?.setAttribute("content", "Calendrier Terrestre Universel - Convertisseur de date");
    }

    document.getElementById("btn-now").addEventListener("click", () => {
        const now = new Date();
        document.getElementById("dt").value = toDatetimeLocalValue(now);
        render(now);
    });

    document.getElementById("btn-convert").addEventListener("click", () => {
        // datetime-local => interprété en local (c'est ce qu'on veut ici)
        render(new Date(document.getElementById("dt").value));
    });

    // init
    document.getElementById("btn-now").click();
})();

function pad2(n) {
    return String(n).padStart(2, "0");
}

// datetime-local attend une string locale sans timezone.
function toDatetimeLocalValue(d) {
    const z = d.getTimezoneOffset() * 60000;
    const local = new Date(d.getTime() - z);
    return local.toISOString().slice(0, 19);
}

function render(date) {
    const outDate = document.getElementById("out-date");
    const outTime = document.getElementById("out-time");

    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
        outDate.textContent = "Date invalide";
        outTime.textContent = "—";
        return;
    }

    if (typeof date.toCTU !== "function") {
        outDate.textContent = "CTU non dispo";
        outTime.textContent = "Tu as bien chargé date.js ?";
        return;
    }

    const c = date.toCTU();

    // Nouveaux champs + fallback anciens
    const solion = c.solion ?? c.spinion;
    const lunitionName = c.lunitionName;
    const orbion = c.orbion;

    const decor = c.decor ?? c.spinor;
    const milor = c.milor ?? c.minor;
    const cenor = c.cenor ?? c.secor;

    outDate.textContent = `${solion} ${lunitionName} ${orbion}`;
    outTime.textContent = `${pad2(decor)}:${pad2(milor)}:${pad2(cenor)} CTU`;
}
