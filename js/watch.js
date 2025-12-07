(function () {
	if (navigator.language === 'fr-FR') {
		document.title = "CTU";
        document.querySelector('meta[name="description"]')?.setAttribute("content", "Calendrier Terrestre Universel");
	}

	tick();
})();

function pad2(n) {
	return String(n).padStart(2, '0');
}

function render(now) {
	if (typeof date_compute !== 'function') {
		document.getElementById('ctu-date').textContent = 'CTU non dispo';
		document.getElementById('ctu-time').textContent = 'Tu as bien chargé date.js (avec le patch CTU) ?';
		return;
	}

	const c = date_compute(now);

	document.getElementById('ctu-date').textContent = `${c.spinion} ${c.lunitionName} ${c.orbion}`;
	document.getElementById('ctu-time').textContent = `${pad2(c.spinor)}:${pad2(c.minor)}:${pad2(c.secor)} CTU`;
}

function tick() {
	render(new Date());
	requestAnimationFrame(tick);
}