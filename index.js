// UEC Origin : June 15th -763 BC 12:00pm GMT+3 ≈ 09:00am UTC
// The Assyrian eclipse, also known as the Bur-Sagale eclipse.
// The first precisely dated astronomical event
const ORIGIN_UEC = 1442902.875; 
const LUNITIONS = [
    "Nuiron", "Kelva", "Drenae", "Vellune", "Rokel", "Cereon",
    "Elvora", "Zailun", "Aruel", "Thylis", "Velunor", "Ombran", "Siliane"
];
const NUIRON_DURATION = 11;
const LUNITION_DURATION = 29;
const SPINION_DURATION = 86400;

(function() {
    if (navigator.language === 'fr-FR') {
        document.title = "CTU - Calendrier Terrestre Universel";
        document.getElementById("mark").textContent = "après l'éclispe de Bûr-Sagalé";
    }
    updateCTU();
})();

function updateCTU() {
  let now = new Date();
  let elapsedDays = now.toJulian() - ORIGIN_UEC;
  let elapsedSeconds = elapsedDays * SPINION_DURATION;

  // UEC Date (Orbion/Lunition/Spinion)
  let orbion = (elapsedDays / 365.2422);
  let spinionOfOrbion = (elapsedDays % 365.2422);

  let lunition, spinion;
  if (orbion === 0 && spinionOfOrbion === 0) {
    // Instant 0 : 1/1/0
    lunition = 1;
    spinion = 1;
  } else {
    if (orbion > 0) {
      // Usual Orbion : Nuiron exist
      if (spinionOfOrbion < NUIRON_DURATION) {
        lunition = 0;
        spinion = spinionOfOrbion; // with spinion 0
      } else {
        spinionOfOrbion -= NUIRON_DURATION;
        lunition = (spinionOfOrbion / LUNITION_DURATION) + 1;
        spinion = spinionOfOrbion % LUNITION_DURATION;
      }
    } else {
      // Orbion 0 after instant 0
      lunition = (spinionOfOrbion / LUNITION_DURATION) + 1;
      spinion = spinionOfOrbion % LUNITION_DURATION;
    }

    if (spinion === 0) {
      spinion = 0;
    } else {
      spinion += 1; 
    }
  }
  
  spinion = Math.floor(spinion);
  lunition = Math.floor(lunition%13);
  orbion = Math.floor(orbion);

  let monthName = lunition === 0 ? "" : "(" + (new Date(2000, lunition-1, 1)).toLocaleDateString(navigator.language, { month: 'long' }) + ")";
  let lunitionName = LUNITIONS[lunition];

  // UEC Time (Spinor/Minor/Secor)
  let secondsToSpinion = (elapsedSeconds % SPINION_DURATION);
  let spinor = Math.floor((secondsToSpinion / SPINION_DURATION) * 20);
  let minor = Math.floor(((secondsToSpinion / SPINION_DURATION) * 2000) % 100);
  let secor = Math.floor(((secondsToSpinion / SPINION_DURATION) * 200000) % 100);

  // Display update
  document.getElementById("spinion").textContent = `${spinion}`;
  document.getElementById("lunition").textContent = `${lunitionName}`;
  document.getElementById("orbion").textContent = `${orbion}`;
  document.getElementById("month").textContent = `${monthName}`;
  document.getElementById("spinor").textContent = `${spinor.toString().padStart(2,'0')}`;
  document.getElementById("minor").textContent = `${minor.toString().padStart(2,'0')}`;
  document.getElementById("secor").textContent = `${secor.toString().padStart(2,'0')}`;
  document.getElementById("hours").textContent = `${now.getHours().toString().padStart(2,'0')}`;
  document.getElementById("minutes").textContent = `${now.getMinutes().toString().padStart(2,'0')}`;
  document.getElementById("secondes").textContent = `${now.getSeconds().toString().padStart(2,'0')}`;

  // Metadata update
  document.querySelector('meta[name="ctu-orbion"]')?.setAttribute("content", `${orbion}`);
  document.querySelector('meta[name="ctu-lunition"]')?.setAttribute("content", `${lunition}`);
  document.querySelector('meta[name="ctu-spinion"]')?.setAttribute("content", `${spinion}`);
  document.querySelector('meta[name="ctu-spinor"]')?.setAttribute("content", `${spinor.toString().padStart(2,'0')}`);
  document.querySelector('meta[name="ctu-minor"]')?.setAttribute("content", `${minor.toString().padStart(2,'0')}`);
  document.querySelector('meta[name="ctu-secor"]')?.setAttribute("content", `${secor.toString().padStart(2,'0')}`);

  // ISO update
  document.getElementById("ctu-iso").textContent = `${orbion.toString().padStart(4,'0')}-${lunition.toString().padStart(2,'0')}-${spinion.toString().padStart(2,'0')}T${spinor.toString().padStart(2,'0')}:${minor.toString().padStart(2,'0')}:${secor.toString().padStart(2,'0')} CTU`;
  
  requestAnimationFrame(updateCTU);
}
