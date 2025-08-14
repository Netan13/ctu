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
        document.getElementById("sun-label").textContent = "Lever et Coucher de Soleil";
    }
    updateCTU();
})();

function elapsedDaysToSpinionLunitionOrbion(elapsedDays) {
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

    return {spinion, lunition, orbion};
}

function updateSunriseCTU(position) {
    let elapsedDays = new Date().sunrise(position.coords.latitude, position.coords.longitude).toJulian() - ORIGIN_UEC;
    let spinionGap = Math.floor(elapsedDays % 365.2422) - Math.floor((new Date().toJulian() - ORIGIN_UEC) % 365.2422);
    let secondsToSpinion = elapsedDays * SPINION_DURATION % SPINION_DURATION;
    let spinor = Math.floor((secondsToSpinion / SPINION_DURATION) * 20);
    let minor = Math.floor(((secondsToSpinion / SPINION_DURATION) * 2000) % 100);
    let secor = Math.floor(((secondsToSpinion / SPINION_DURATION) * 200000) % 100);
    let sunrise = `${spinor.toString().padStart(2,'0')}:${minor.toString().padStart(2,'0')}:${secor.toString().padStart(2,'0')}` + (spinionGap > 0 ? ` +1J` : spinionGap < 0 ? ` -1J` : ``) + ` CTU`
    if (document.getElementById("local-sunrise").textContent !== sunrise) {
        document.getElementById("local-sunrise").textContent = sunrise;
        document.querySelector('meta[name="ctu-local-sunrise"]')?.setAttribute("content", `${minor.toString().padStart(2,'0')}`);
    }
};

function updateSunsetCTU(position) {
    let elapsedDays = new Date().sunset(position.coords.latitude, position.coords.longitude).toJulian() - ORIGIN_UEC;
    let spinionGap = Math.floor(elapsedDays % 365.2422) - Math.floor((new Date().toJulian() - ORIGIN_UEC) % 365.2422);
    let secondsToSpinion = elapsedDays * SPINION_DURATION % SPINION_DURATION;
    let spinor = Math.floor((secondsToSpinion / SPINION_DURATION) * 20);
    let minor = Math.floor(((secondsToSpinion / SPINION_DURATION) * 2000) % 100);
    let secor = Math.floor(((secondsToSpinion / SPINION_DURATION) * 200000) % 100);
    let sunset = `${spinor.toString().padStart(2,'0')}:${minor.toString().padStart(2,'0')}:${secor.toString().padStart(2,'0')}` + (spinionGap > 0 ? ` +1J` : spinionGap < 0 ? ` -1J` : ``) + ` CTU`;
    if (document.getElementById("local-sunset").textContent !== sunset) {
        document.getElementById("local-sunset").textContent = sunset;
    }
};

function updateDisplay(now, spinion, lunition, orbion, spinor, minor, secor) {
    let monthName = lunition === 0 ? "" : "(" + (new Date(2000, lunition-1, 1)).toLocaleDateString(navigator.language, { month: 'long' }) + ")";
    let lunitionName = LUNITIONS[lunition];
    
    if (document.getElementById("spinion").textContent !== `${spinion}`) {
        document.getElementById("spinion").textContent = `${spinion}`;
        document.querySelector('meta[name="ctu-spinion"]')?.setAttribute("content", `${spinion}`);
    }
    if (document.getElementById("lunition").textContent !== `${lunitionName}`) {
        document.getElementById("lunition").textContent = `${lunitionName}`;
        document.querySelector('meta[name="ctu-lunition"]')?.setAttribute("content", `${lunition}`);
    }
    if (document.getElementById("month").textContent !== `${monthName}`) {
        document.getElementById("month").textContent = `${monthName}`;
    }
    if (document.getElementById("orbion").textContent !== `${orbion}`) {
        document.getElementById("orbion").textContent = `${orbion}`;
        document.querySelector('meta[name="ctu-orbion"]')?.setAttribute("content", `${orbion}`);
    }
    if (document.getElementById("spinion").textContent !== `${spinion}`) {
        document.getElementById("spinion").textContent = `${spinion}`;
    }
    if (document.getElementById("spinor").textContent !== `${spinor.toString().padStart(2,'0')}`) {
        document.getElementById("spinor").textContent = `${spinor.toString().padStart(2,'0')}`;
        document.querySelector('meta[name="ctu-spinor"]')?.setAttribute("content", `${spinor.toString().padStart(2,'0')}`);
    }
    if (document.getElementById("minor").textContent !== `${minor.toString().padStart(2,'0')}`) {
        document.getElementById("minor").textContent = `${minor.toString().padStart(2,'0')}`;
        document.querySelector('meta[name="ctu-minor"]')?.setAttribute("content", `${minor.toString().padStart(2,'0')}`);
    }
    if (document.getElementById("secor").textContent !== `${secor.toString().padStart(2,'0')}`) {
        document.getElementById("secor").textContent = `${secor.toString().padStart(2,'0')}`;
        document.querySelector('meta[name="ctu-secor"]')?.setAttribute("content", `${secor.toString().padStart(2,'0')}`);
    }
    if (document.getElementById("hours").textContent !== `${now.getHours().toString().padStart(2,'0')}`) {
        document.getElementById("hours").textContent = `${now.getHours().toString().padStart(2,'0')}`;
    }
    if (document.getElementById("minutes").textContent !== `${now.getMinutes().toString().padStart(2,'0')}`) {
        document.getElementById("minutes").textContent = `${now.getMinutes().toString().padStart(2,'0')}`;
    }
    if (document.getElementById("secondes").textContent !== `${now.getSeconds().toString().padStart(2,'0')}`) {
        document.getElementById("secondes").textContent = `${now.getSeconds().toString().padStart(2,'0')}`;
    }
}

function updateCTU() {
    let now = new Date();
    let elapsedDays = now.toJulian() - ORIGIN_UEC;
    let elapsedSeconds = elapsedDays * SPINION_DURATION;
    
    // UEC Date (Orbion/Lunition/Spinion)
    let {lunition, spinion, orbion} = elapsedDaysToSpinionLunitionOrbion(elapsedDays);
    
    // UEC Time (Spinor/Minor/Secor)
    let secondsToSpinion = (elapsedSeconds % SPINION_DURATION);
    let spinor = Math.floor((secondsToSpinion / SPINION_DURATION) * 20);
    let minor = Math.floor(((secondsToSpinion / SPINION_DURATION) * 2000) % 100);
    let secor = Math.floor(((secondsToSpinion / SPINION_DURATION) * 200000) % 100);
    
    // Display update
    updateDisplay(now, spinion, lunition, orbion, spinor, minor, secor);
    navigator.geolocation.getCurrentPosition(updateSunriseCTU);
    navigator.geolocation.getCurrentPosition(updateSunsetCTU);
    
    requestAnimationFrame(updateCTU);
}
