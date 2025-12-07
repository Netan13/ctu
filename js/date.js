// UEC Origin : June 15th -763 BC 12:00am GMT+3
// The Assyrian eclipse, also known as the Bur-Sagale eclipse.
// The first precisely dated astronomical event
const ORIGIN_UEC = 1486102.5;
const LUNITIONS = [
    "Nuiron", "Kelva", "Drenae", "Vellune", "Rokel", "Cereon",
    "Elvora", "Zailun", "Aruel", "Thylis", "Velunor", "Ombran", "Siliane"
];
const NUIRON_DURATION = 11;
const LUNITION_DURATION = 29;
const SPINION_DURATION = 86400;

Date.prototype.sunrise = function(latitude, longitude, zenith) {
	return this.sunriseSet(latitude, longitude, true, zenith);
}

Date.prototype.sunset = function(latitude, longitude, zenith) {
	return this.sunriseSet(latitude, longitude, false, zenith);
}

Date.prototype.sunriseSet = function(latitude, longitude, sunrise, zenith) {
	if(!zenith) {
		zenith = 90.8333;
	}


	var hoursFromMeridian = longitude / Date.DEGREES_PER_HOUR,
		dayOfYear = this.getDayOfYear(),
		approxTimeOfEventInDays,
		sunMeanAnomaly,
		sunTrueLongitude,
		ascension,
		rightAscension,
		lQuadrant,
		raQuadrant,
		sinDec,
		cosDec,
		localHourAngle,
		localHour,
		localMeanTime,
		time;

	if (sunrise) {
        approxTimeOfEventInDays = dayOfYear + ((6 - hoursFromMeridian) / 24);
    } else {
        approxTimeOfEventInDays = dayOfYear + ((18.0 - hoursFromMeridian) / 24);
    }

	sunMeanAnomaly = (0.9856 * approxTimeOfEventInDays) - 3.289;

	sunTrueLongitude = sunMeanAnomaly + (1.916 * Math.sinDeg(sunMeanAnomaly)) + (0.020 * Math.sinDeg(2 * sunMeanAnomaly)) + 282.634;
	sunTrueLongitude =  Math.mod(sunTrueLongitude, 360);

	ascension = 0.91764 * Math.tanDeg(sunTrueLongitude);
    rightAscension = 360 / (2 * Math.PI) * Math.atan(ascension);
    rightAscension = Math.mod(rightAscension, 360);
    
    lQuadrant = Math.floor(sunTrueLongitude / 90) * 90;
    raQuadrant = Math.floor(rightAscension / 90) * 90;
    rightAscension = rightAscension + (lQuadrant - raQuadrant);
    rightAscension /= Date.DEGREES_PER_HOUR;

    sinDec = 0.39782 * Math.sinDeg(sunTrueLongitude);
	cosDec = Math.cosDeg(Math.asinDeg(sinDec));
	cosLocalHourAngle = ((Math.cosDeg(zenith)) - (sinDec * (Math.sinDeg(latitude)))) / (cosDec * (Math.cosDeg(latitude)));

	localHourAngle = Math.acosDeg(cosLocalHourAngle)

	if (sunrise) {
		localHourAngle = 360 - localHourAngle;
	} 

	localHour = localHourAngle / Date.DEGREES_PER_HOUR;

	localMeanTime = localHour + rightAscension - (0.06571 * approxTimeOfEventInDays) - 6.622;

	time = localMeanTime - (longitude / Date.DEGREES_PER_HOUR);
	time = Math.mod(time, 24);

	var midnight = new Date(0);
		midnight.setUTCFullYear(this.getUTCFullYear());
		midnight.setUTCMonth(this.getUTCMonth());
		midnight.setUTCDate(this.getUTCDate());
	


	var milli = midnight.getTime() + (time * 60 *60 * 1000);


	return new Date(milli);
}

Date.prototype.toJulian = function() {
  let msPerDay = 86400000;
  let epochJD = 2440587.5;

  let isBeforeEpoch = this < 0;

  return (this / msPerDay)
       - (this.getTimezoneOffset() / 1440)
       + epochJD;
}

function date_elapsedDaysToSpinionLunitionOrbion(elapsedDays) {
  const { ORBION_DURATION, NUIRON_DURATION, LUNITION_DURATION } = Date.CTU;

  let orbion = (elapsedDays / ORBION_DURATION);
  let spinionOfOrbion = Math.mod(elapsedDays, ORBION_DURATION);
  let lunition, spinion;

  // instant 0 : 1/1/0
  if (Math.abs(orbion) < 1e-12 && Math.abs(spinionOfOrbion) < 1e-12) {
    lunition = 1;
    spinion = 1;
  } else {
    if (orbion > 0) {
      // orbion "normal" : Nuiron existe
      if (spinionOfOrbion < NUIRON_DURATION) {
        lunition = 0;
        spinion = spinionOfOrbion; // spinion peut valoir 0
      } else {
        spinionOfOrbion -= NUIRON_DURATION;
        lunition = (spinionOfOrbion / LUNITION_DURATION) + 1;
        spinion = spinionOfOrbion % LUNITION_DURATION;
      }
    } else {
      // orbion <= 0 : pas de Nuiron
      lunition = (spinionOfOrbion / LUNITION_DURATION) + 1;
      spinion = spinionOfOrbion % LUNITION_DURATION;
    }

    if (spinion === 0) spinion = 0;
    else spinion += 1;
  }

  spinion = Math.floor(spinion);
  lunition = Math.floor(lunition % 13);
  orbion = Math.floor(orbion);

  return { spinion, lunition, orbion };
};

function date_compute(date) {
  const d = (date instanceof Date) ? date : new Date(date);
  if (Number.isNaN(d.getTime())) throw new Error("Invalid date for date_compute");

  const jd = d.toJulian();
  const elapsedDays = jd - ORIGIN_UEC;
  const elapsedSeconds = elapsedDays * SPINION_DURATION;

  const { spinion, lunition, orbion } =
    date_elapsedDaysToSpinionLunitionOrbion(elapsedDays);

  const secondsToSpinion = Math.mod(elapsedSeconds, SPINION_DURATION);
  const fraction = secondsToSpinion / SPINION_DURATION;

  const spinor = Math.floor(fraction * 20);
  const minor = Math.floor((fraction * 2000) % 100);
  const secor = Math.floor((fraction * 200000) % 100);

  return {
    spinion,
    lunition,
    lunitionName: LUNITIONS[lunition],
    orbion,
    spinor,
    minor,
    secor,
    secondsIntoSpinion: secondsToSpinion,
    julianDay: jd,
    elapsedDays
  };
};

Date.prototype.toCTU = function () {
  return date_compute(this);
};

Date.DEGREES_PER_HOUR = 360 / 24;


// Utility functions

Date.prototype.getDayOfYear = function() {
	var onejan = new Date(this.getFullYear(),0,1);
	return Math.ceil((this - onejan) / 86400000);
}

Math.degToRad = function(num) {
	return num * Math.PI / 180;
}

Math.radToDeg = function(radians){
    return radians * 180.0 / Math.PI;
}

Math.sinDeg = function(deg) {
    return Math.sin(deg * 2.0 * Math.PI / 360.0);
}


Math.acosDeg = function(x) {
    return Math.acos(x) * 360.0 / (2 * Math.PI);
}

Math.asinDeg = function(x) {
    return Math.asin(x) * 360.0 / (2 * Math.PI);
}


Math.tanDeg = function(deg) {
    return Math.tan(deg * 2.0 * Math.PI / 360.0);
}

Math.cosDeg = function(deg) {
    return Math.cos(deg * 2.0 * Math.PI / 360.0);
}

Math.mod = function(a, b) {
	var result = a % b;
	if(result < 0) {
		result += b;
	}
	return result;
}
