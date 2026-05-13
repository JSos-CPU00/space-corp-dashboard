// js/spaceweather.js — Space Weather via NOAA (free, no key needed)

const SpaceWeatherModule = (function () {

  const ENDPOINTS = {
    solarWind:   'https://services.swpc.noaa.gov/products/summary/solar-wind-speed.json',
    magneticFld: 'https://services.swpc.noaa.gov/products/summary/solar-wind-mag-field.json',
    geoStorm:    'https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json',
    solarFlares: 'https://services.swpc.noaa.gov/json/goes/primary/xray-flares-7-day.json',
    alerts:      'https://services.swpc.noaa.gov/products/alerts.json',
    forecast:    'https://services.swpc.noaa.gov/products/noaa-scales.json',
  };

  const KP_LEVELS = [
    { max: 1,  label: 'QUIET',    color: '#00ff88', desc: 'Minimal activity' },
    { max: 3,  label: 'UNSETTLED',color: '#88ff00', desc: 'Minor fluctuations' },
    { max: 5,  label: 'ACTIVE',   color: '#ffcc00', desc: 'Possible auroras at high latitudes' },
    { max: 7,  label: 'STORM',    color: '#ff6600', desc: 'Geomagnetic storm in progress' },
    { max: 9,  label: 'SEVERE',   color: '#ff2244', desc: 'Severe geomagnetic storm' },
  ];

  function getKpLevel(kp) {
    return KP_LEVELS.find(l => kp <= l.max) || KP_LEVELS[4];
  }

  const FLARE_CLASS = {
    'X': { color: '#ff2244', weight: 4 },
    'M': { color: '#ff6600', weight: 3 },
    'C': { color: '#ffcc00', weight: 2 },
    'B': { color: '#00aaff', weight: 1 },
    'A': { color: '#00ff88', weight: 0 },
  };

  async function fetchAll() {
    const results = await Promise.allSettled([
      fetch(ENDPOINTS.solarWind).then(r => r.json()),
      fetch(ENDPOINTS.magneticFld).then(r => r.json()),
      fetch(ENDPOINTS.geoStorm).then(r => r.json()),
      fetch(ENDPOINTS.solarFlares).then(r => r.json()),
      fetch(ENDPOINTS.alerts).then(r => r.json()),
    ]);
    return results.map(r => r.status === 'fulfilled' ? r.value : null);
  }

  async function render() {
    const el = document.getElementById('spaceweatherContainer');
    if (!el) return;
    el.innerHTML = '<div class="sw-loading">Acquiring solar wind data…</div>';

    const [wind, mag, kpData, flares, alerts] = await fetchAll();

    // Parse Kp index — last value in the array
    let currentKp = 0;
    if (kpData && Array.isArray(kpData)) {
      const last = kpData[kpData.length - 1];
      currentKp  = parseFloat(last?.[1] || 0);
    }
    const kpLevel = getKpLevel(currentKp);

    // Solar wind speed
    const windSpeed  = wind?.WindSpeed || '--';
    const windStatus = wind?.Status || '';

    // Magnetic field Bz
    const bz     = mag?.Bz || '--';
    const bzNum  = parseFloat(bz);
    const bzDir  = isNaN(bzNum) ? '' : bzNum < 0 ? '↓ Southward (Storm Risk)' : '↑ Northward (Stable)';
    const bzColor= isNaN(bzNum) ? '#6a90b8' : bzNum < -10 ? '#ff2244' : bzNum < 0 ? '#ff6600' : '#00ff88';

    // Recent flares
    const recentFlares = (flares || [])
      .filter(f => f.class)
      .sort((a,b) => (FLARE_CLASS[b.class[0]]?.weight||0) - (FLARE_CLASS[a.class[0]]?.weight||0))
      .slice(0, 6);

    // Active alerts
    const activeAlerts = (alerts || [])
      .filter(a => a.message && a.issue_datetime)
      .slice(0, 3);

    el.innerHTML = `
      <!-- Kp Gauge + Wind Stats -->
      <div class="sw-top-row">
        <div class="sw-kp-card">
          <div class="sw-section-title">GEOMAGNETIC INDEX (Kp)</div>
          <div class="sw-kp-display">
            <div class="sw-kp-number" style="color:${kpLevel.color};text-shadow:0 0 20px ${kpLevel.color}88">${currentKp.toFixed(1)}</div>
            <div class="sw-kp-info">
              <span class="sw-kp-label" style="color:${kpLevel.color}">${kpLevel.label}</span>
              <span class="sw-kp-desc">${kpLevel.desc}</span>
            </div>
          </div>
          <div class="sw-kp-bar">
            ${[0,1,2,3,4,5,6,7,8,9].map(i => `
              <div class="sw-kp-seg ${currentKp >= i ? 'active' : ''}"
                style="${currentKp >= i ? `background:${getKpLevel(i).color}` : ''}"></div>
            `).join('')}
          </div>
        </div>

        <div class="sw-conditions-card">
          <div class="sw-section-title">SOLAR WIND CONDITIONS</div>
          <div class="sw-cond-grid">
            <div class="sw-cond-item">
              <span class="sw-cond-label">WIND SPEED</span>
              <span class="sw-cond-val" style="color:#00aaff">${windSpeed} km/s</span>
            </div>
            <div class="sw-cond-item">
              <span class="sw-cond-label">STATUS</span>
              <span class="sw-cond-val">${windStatus || 'Nominal'}</span>
            </div>
            <div class="sw-cond-item">
              <span class="sw-cond-label">Bz FIELD</span>
              <span class="sw-cond-val" style="color:${bzColor}">${bz} nT</span>
            </div>
            <div class="sw-cond-item">
              <span class="sw-cond-label">DIRECTION</span>
              <span class="sw-cond-val" style="color:${bzColor};font-size:0.65rem">${bzDir || '--'}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Flares -->
      <div class="sw-section">
        <div class="sw-section-title">RECENT SOLAR FLARES (7-DAY)</div>
        ${recentFlares.length === 0
          ? '<div class="sw-empty">No significant flares detected</div>'
          : `<div class="sw-flares-grid">
              ${recentFlares.map(f => {
                const cls   = f.class[0];
                const style = FLARE_CLASS[cls] || { color: '#6a90b8' };
                return `
                  <div class="sw-flare-card" style="border-color:${style.color}44">
                    <span class="sw-flare-class" style="color:${style.color}">${f.class}</span>
                    <span class="sw-flare-time">${f.begin_time ? f.begin_time.slice(0,16).replace('T',' ') : '--'}</span>
                    <span class="sw-flare-region">Region ${f.noaa_region || 'N/A'}</span>
                  </div>`;
              }).join('')}
            </div>`
        }
      </div>

      <!-- Alerts -->
      <div class="sw-section">
        <div class="sw-section-title">NOAA ACTIVE ALERTS</div>
        ${activeAlerts.length === 0
          ? '<div class="sw-empty">✓ No active space weather alerts</div>'
          : activeAlerts.map(a => `
              <div class="sw-alert-item">
                <span class="sw-alert-time">${a.issue_datetime?.slice(0,16).replace('T',' ') || ''}</span>
                <span class="sw-alert-msg">${a.message?.split('\n')[0] || ''}</span>
              </div>`).join('')
        }
      </div>

      <div class="sw-source">Data: NOAA Space Weather Prediction Center · Updated in real-time</div>
    `;
  }

  return { render };
})();
