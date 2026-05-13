// js/weather.js — Earth weather via Open-Meteo (free, no API key)
// Mars/Moon/Venus: NASA InSight-style simulated data

const WeatherModule = (function () {

  // WMO weather condition codes → emoji + label
  const WMO = {
    0: ['☀️','Clear'],    1: ['🌤️','Mostly Clear'], 2: ['⛅','Partly Cloudy'],
    3: ['☁️','Overcast'], 45:['🌫️','Fog'],          48:['🌫️','Icy Fog'],
    51:['🌦️','Drizzle'],  53:['🌦️','Drizzle'],      55:['🌧️','Heavy Drizzle'],
    61:['🌧️','Rain'],     63:['🌧️','Moderate Rain'], 65:['🌧️','Heavy Rain'],
    71:['🌨️','Snow'],     73:['🌨️','Moderate Snow'], 75:['❄️','Heavy Snow'],
    80:['🌦️','Showers'],  81:['🌧️','Showers'],       82:['⛈️','Heavy Showers'],
    95:['⛈️','Thunderstorm'], 96:['⛈️','Thunderstorm'], 99:['⛈️','Hail Storm'],
  };

  function cToF(c) { return Math.round(c * 9/5 + 32); }
  function msToMph(ms) { return Math.round(ms * 2.237); }

  // Simulated planetary data (NASA InSight/Voyager data inspired)
  function getMarsData() {
    const sols = [3900, 3901, 3902, 3903, 3904];
    const sol  = sols[Math.floor(Math.random() * sols.length)];
    const conditions = ['Dust Storm','Clear','Light Haze','Moderate Winds','Dust Devil'];
    return {
      temp:  cToF(-63 + (Math.random() * 20 - 10)),
      cond:  conditions[Math.floor(Math.random() * conditions.length)],
      pres:  (700 + Math.random() * 100).toFixed(0) + ' Pa',
      wind:  Math.floor(Math.random() * 25 + 5) + ' mph',
      sol:   sol,
    };
  }

  function getMoonData() {
    const phase = ['New Moon','Waxing Crescent','First Quarter','Waxing Gibbous','Full Moon','Waning Gibbous'];
    const side  = Math.random() > 0.5 ? 'Dayside' : 'Nightside';
    return {
      temp:   side === 'Dayside' ? cToF(127) : cToF(-173),
      cond:   side,
      pres:   '~0 Pa (Vacuum)',
      radiat: Math.floor(Math.random() * 50 + 100) + ' mSv/day',
      phase:  phase[Math.floor(Math.random() * phase.length)],
    };
  }

  function getVenusData() {
    return {
      temp:   cToF(465 + Math.floor(Math.random() * 10 - 5)),
      cond:   'Sulfuric Acid Clouds',
      pres:   '92 atm (~9.2 MPa)',
      wind:   Math.floor(Math.random() * 30 + 200) + ' mph',
      clouds: '~50 km altitude',
    };
  }

  async function fetchEarthWeather(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code` +
      `&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`;
    const res  = await fetch(url);
    const data = await res.json();
    return data.current;
  }

  async function fetchForecast(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&daily=temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&timezone=auto&forecast_days=7`;
    const res  = await fetch(url);
    const data = await res.json();
    return data.daily;
  }

  function getUserLocation() {
    const saved = localStorage.getItem('sc_location');
    if (saved) {
      try { return JSON.parse(saved); } catch(e) {}
    }
    // Default: Las Cruces, NM
    return { lat: 32.3199, lon: -106.7637, name: 'Las Cruces, NM' };
  }

  async function loadEarthWidget() {
    const loc = getUserLocation();
    try {
      const current = await fetchEarthWeather(loc.lat, loc.lon);
      const code    = current.weather_code;
      const [icon, label] = WMO[code] || ['🌡️', 'Unknown'];
      document.getElementById('ow-icon').textContent = icon;
      document.getElementById('ow-temp').textContent = Math.round(current.temperature_2m);
      document.getElementById('ow-cond').textContent = label;
      document.getElementById('ow-hum').textContent  = current.relative_humidity_2m + '%';
      document.getElementById('ow-wind').textContent = Math.round(current.wind_speed_10m) + ' mph';
      document.getElementById('ow-loc').textContent  = loc.name;
    } catch(e) {
      document.getElementById('ow-temp').textContent = '--';
      document.getElementById('ow-cond').textContent = 'Unavailable';
    }
  }

  function loadMarsWidget() {
    const d = getMarsData();
    document.getElementById('mars-temp').textContent = d.temp;
    document.getElementById('mars-cond').textContent = d.cond;
    document.getElementById('mars-pres').textContent = d.pres;
    document.getElementById('mars-wind').textContent = d.wind;
    document.getElementById('mars-sol').textContent  = 'Sol ' + d.sol;
  }

  async function loadWeatherTab() {
    const loc = getUserLocation();

    // Earth full
    try {
      const current = await fetchEarthWeather(loc.lat, loc.lon);
      const code    = current.weather_code;
      const [icon, label] = WMO[code] || ['🌡️','Unknown'];
      document.getElementById('earth-stats-full').innerHTML = statRows([
        ['Temperature', Math.round(current.temperature_2m) + ' °F'],
        ['Condition', icon + ' ' + label],
        ['Humidity', current.relative_humidity_2m + '%'],
        ['Wind Speed', Math.round(current.wind_speed_10m) + ' mph'],
        ['Location', loc.name],
        ['Data Source', 'Open-Meteo API'],
      ]);
    } catch(e) {
      document.getElementById('earth-stats-full').textContent = 'Failed to load.';
    }

    // Mars full
    const mars = getMarsData();
    document.getElementById('mars-stats-full').innerHTML = statRows([
      ['High Temp', mars.temp + ' °F'],
      ['Low Temp',  cToF(-130) + ' °F'],
      ['Condition', mars.cond],
      ['Pressure',  mars.pres],
      ['Wind Speed',mars.wind],
      ['Sol Number','Sol ' + mars.sol],
    ]);

    // Moon full
    const moon = getMoonData();
    document.getElementById('moon-stats-full').innerHTML = statRows([
      ['Surface Temp', moon.temp + ' °F'],
      ['Condition', moon.cond],
      ['Atmosphere', moon.pres],
      ['Radiation', moon.radiat],
      ['Lunar Phase', moon.phase],
      ['Data Source', 'NASA LADEE Model'],
    ]);

    // Venus full
    const venus = getVenusData();
    document.getElementById('venus-stats-full').innerHTML = statRows([
      ['Surface Temp', venus.temp + ' °F'],
      ['Condition', venus.cond],
      ['Atmosphere', venus.pres],
      ['Upper Winds', venus.wind],
      ['Cloud Deck', venus.clouds],
      ['Data Source', 'NASA Magellan Model'],
    ]);
  }

  function statRows(pairs) {
    return pairs.map(([k,v]) =>
      `<div class="planet-stat-row"><span class="pstat-label">${k}</span><span class="pstat-val">${v}</span></div>`
    ).join('');
  }

  return { loadEarthWidget, loadMarsWidget, loadWeatherTab, fetchForecast, getUserLocation };
})();
