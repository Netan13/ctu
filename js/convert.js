(function () {
	if (navigator.language === 'fr-FR') {
		document.title = "CTU - Convertisseur";
        document.querySelector('meta[name="description"]')?.setAttribute("content", "Calendrier Terrestre Universel - Convertisseur de date");
	}

	document.getElementById('btn-now').addEventListener('click', () => {
		const now = new Date();
		document.getElementById('dt').value = toDatetimeLocalValue(now);
		render(now);
	});

	document.getElementById('btn-convert').addEventListener('click', () => {
		// Interprété en local, ce qu’on veut avec datetime-local
		render(new Date(document.getElementById('dt').value));
	});

	// init
	document.getElementById('btn-now').click();
})();

function pad2(n) {
	return String(n).padStart(2, '0');
}

// datetime-local attend une string locale sans timezone.
function toDatetimeLocalValue(d) {
	const z = d.getTimezoneOffset() * 60000;
	const local = new Date(d.getTime() - z);
	return local.toISOString().slice(0, 19);
}

function render(date) {
	if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
		document.getElementById('out-date').textContent = 'Date invalide';
		document.getElementById('out-time').textContent = '—';
		return;
	}

	if (typeof date.toCTU !== 'function') {
		document.getElementById('out-date').textContent = 'CTU non dispo';
		document.getElementById('out-time').textContent = 'Tu as bien chargé date.js (avec le patch CTU) ?';
		return;
	}

	const c = date.toCTU();
	document.getElementById('out-date').textContent = `${c.spinion} ${c.lunitionName} ${c.orbion}`;
	document.getElementById('out-time').textContent = `${pad2(c.spinor)}:${pad2(c.minor)}:${pad2(c.secor)} CTU`;
}