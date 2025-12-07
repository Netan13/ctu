(function () {
  const elDate = document.getElementById('ctu-date');
  const elTime = document.getElementById('ctu-time');

  function pad2(n) { return String(n).padStart(2, '0'); }

  function render(now) {
    if (!CTU || typeof date_compute !== 'function') {
      elDate.textContent = 'CTU non dispo';
      elTime.textContent = 'Tu as bien chargé date.js (avec le patch CTU) ?';
      return;
    }

    const c = date_compute(now);

    elDate.textContent = `${c.spinion} ${c.lunitionName} ${c.orbion}`;
    elTime.textContent = `${pad2(c.spinor)}:${pad2(c.minor)}:${pad2(c.secor)} CTU`;
    elMeta.textContent = `Local : ${now.toString()}`;
  }

  function tick() {
    render(new Date());
    requestAnimationFrame(tick);
  }

  tick();
})();
