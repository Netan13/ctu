(function () {
	if (navigator.language === 'fr-FR') {
		document.title = "CTU - Convertisseur";
        document.querySelector('meta[name="description"]')?.setAttribute("content", "Calendrier Terrestre Universel - Convertisseur de date");
	}

	btnNow.addEventListener('click', () => {
		const now = new Date();
		elDt.value = toDatetimeLocalValue(now);
		render(now);
	});

	btnConvert.addEventListener('click', () => {
		// Interprété en local, ce qu’on veut avec datetime-local
		render(new Date(elDt.value));
	});

	// init
	btnNow.click();
})();

const elDt = document.getElementById('dt');
const elOutDate = document.getElementById('out-date');
const elOutTime = document.getElementById('out-time');
const btnNow = document.getElementById('btn-now');
const btnConvert = document.getElementById('btn-convert');

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
		elOutDate.textContent = 'Date invalide';
		elOutTime.textContent = '—';
		return;
	}

	if (typeof date.toCTU !== 'function') {
		elOutDate.textContent = 'CTU non dispo';
		elOutTime.textContent = 'Tu as bien chargé date.js (avec le patch CTU) ?';
		return;
	}

	const c = date.toCTU();
	elOutDate.textContent = `${c.spinion} ${c.lunitionName} ${c.orbion}`;
	elOutTime.textContent = `${pad2(c.spinor)}:${pad2(c.minor)}:${pad2(c.secor)} CTU`;
}