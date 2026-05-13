// js/satellites.js — Satellite Tracker
// ISS position: api.open-notify.org (free, no key)
// TLE orbital data: Celestrak (free, no key)
// N2YO API optional for passes prediction

const SatelliteModule = (function () {

  const TRACKED_SATS = [
    { id: 25544, name: 'ISS (ZARYA)',       type: 'Space Station', icon: '🛸' },
    { id: 20580, name: 'Hubble Space Tel.', type: 'Observatory',   icon: '🔭' },
    { id: 43013, name: 'NOAA-20',           type: 'Weather Sat',   icon: '🌩️' },
    { id: 27424, name: 'XMM-Newton',        type: 'Observatory',   icon: '🔭' },
    { id: 48274, name: 'Starlink Group',    type: 'Comms',         icon: '📡' },
  ];

  // ISS live position - no key needed
  async function fetchISSPosition() {
    const res  = await fetch('https://api.open-notify.org/iss-now.json');
    const data = await res.json();
    return {
      lat: parseFloat(data.iss_position.latitude).toFixed(4),
      lon: parseFloat(data.iss_position.longitude).toFixed(4),
      timestamp: data.timestamp,
    };
  }

  // Astronauts in space - no key needed
  async function fetchAstronauts() {
    const res  = await fetch('https://api.open-notify.org/astros.json');
    const data = await res.json();
    return data;
  }

  // Simulated orbital data for non-ISS satellites
  function simulateOrbitalData(sat) {
    const now    = Date.now();
    const period = 90 + Math.random() * 30; // minutes
    const phase  = (now / (period * 60000)) % 1;
    const lat    = Math.sin(phase * Math.PI * 2) * 51.6;
    const lon    = ((phase * 360) - 180 + (sat.id % 60)) % 360;
    const alt    = 400 + (sat.id % 200);
    const vel    = 7.6 + Math.random() * 0.5;
    return {
      lat:       lat.toFixed(4),
      lon:       lon.toFixed(4),
      altitude:  alt.toFixed(0),
      velocity:  vel.toFixed(2),
      period:    period.toFixed(1),
    };
  }

  function latLonToRegion(lat, lon) {
    const latN = parseFloat(lat), lonN = parseFloat(lon);
    const latDir = latN >= 0 ? 'N' : 'S';
    const lonDir = lonN >= 0 ? 'E' : 'W';
    return `${Math.abs(latN).toFixed(1)}°${latDir}, ${Math.abs(lonN).toFixed(1)}°${lonDir}`;
  }

  function drawMiniMap(canvasId, lat, lon) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = '#080d1a';
    ctx.fillRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = 'rgba(26,42,68,0.8)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 6; i++) {
      ctx.beginPath(); ctx.moveTo(i * W/6, 0); ctx.lineTo(i * W/6, H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * H/6); ctx.lineTo(W, i * H/6); ctx.stroke();
    }

    // Equator and prime meridian
    ctx.strokeStyle = 'rgba(0,170,255,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, H/2); ctx.lineTo(W, H/2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W/2, 0); ctx.lineTo(W/2, H); ctx.stroke();

    // Satellite position
    const x = ((parseFloat(lon) + 180) / 360) * W;
    const y = ((90 - parseFloat(lat)) / 180) * H;

    // Orbit trail (simplified circle)
    ctx.strokeStyle = 'rgba(0,255,238,0.15)';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.ellipse(W/2, H/2, W * 0.42, H * 0.38, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Satellite dot with glow
    const grad = ctx.createRadialGradient(x, y, 0, x, y, 8);
    grad.addColorStop(0, 'rgba(0,255,238,1)');
    grad.addColorStop(1, 'rgba(0,255,238,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#00ffee';
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();

    // Crosshair
    ctx.strokeStyle = 'rgba(0,255,238,0.5)';
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(x-10, y); ctx.lineTo(x+10, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y-10); ctx.lineTo(x, y+10); ctx.stroke();
  }

  let refreshTimer = null;

  async function render() {
    const el = document.getElementById('satellitesContainer');
    if (!el) return;
    el.innerHTML = '<div class="sat-loading">Acquiring satellite telemetry…</div>';

    // Fetch ISS and astronauts
    let issPos = null, astronauts = null;
    try { issPos      = await fetchISSPosition(); } catch(e) {}
    try { astronauts  = await fetchAstronauts();  } catch(e) {}

    // Build satellite data
    const satData = TRACKED_SATS.map(sat => {
      if (sat.id === 25544 && issPos) {
        return { ...sat, lat: issPos.lat, lon: issPos.lon, altitude: '408', velocity: '7.66', period: '92.8', live: true };
      }
      return { ...sat, ...simulateOrbitalData(sat), live: false };
    });

    el.innerHTML = `
      <!-- Astronaut Banner -->
      <div class="sat-astro-bar">
        <span class="sat-astro-icon">👨‍🚀</span>
        <span class="sat-astro-count">${astronauts ? astronauts.number : '--'} HUMANS CURRENTLY IN SPACE</span>
        <div class="sat-astro-names">
          ${astronauts ? astronauts.people.map(p =>
            `<span class="sat-astro-name">${p.name} <em>(${p.craft})</em></span>`
          ).join('') : ''}
        </div>
      </div>

      <!-- Satellite Cards -->
      <div class="sat-grid">
        ${satData.map((sat, i) => `
          <div class="sat-card" style="animation-delay:${i*0.08}s">
            <div class="sat-card-header">
              <span class="sat-icon">${sat.icon}</span>
              <div class="sat-info">
                <span class="sat-name">${sat.name}</span>
                <span class="sat-type">${sat.type}</span>
              </div>
              <span class="sat-live-badge ${sat.live ? 'live' : 'sim'}">${sat.live ? '● LIVE' : '◎ SIM'}</span>
            </div>
            <canvas id="satmap-${sat.id}" class="sat-minimap" width="280" height="120"></canvas>
            <div class="sat-telemetry">
              <div class="sat-tel-row"><span class="stl">POSITION</span><span class="stv">${latLonToRegion(sat.lat, sat.lon)}</span></div>
              <div class="sat-tel-row"><span class="stl">ALTITUDE</span><span class="stv">${sat.altitude} km</span></div>
              <div class="sat-tel-row"><span class="stl">VELOCITY</span><span class="stv">${sat.velocity} km/s</span></div>
              <div class="sat-tel-row"><span class="stl">PERIOD</span><span class="stv">${sat.period} min</span></div>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="sat-source">ISS position: Open-Notify API (live) · Other satellites: simulated orbital mechanics · <a href="https://www.n2yo.com" target="_blank" rel="noopener">N2YO</a> for real pass predictions</div>
    `;

    // Draw mini maps after DOM renders
    requestAnimationFrame(() => {
      satData.forEach(sat => drawMiniMap(`satmap-${sat.id}`, sat.lat, sat.lon));
    });

    // Auto-refresh ISS every 5 seconds
    clearInterval(refreshTimer);
    refreshTimer = setInterval(async () => {
      try {
        const pos = await fetchISSPosition();
        const issCard = satData.find(s => s.id === 25544);
        if (issCard) {
          issCard.lat = pos.lat;
          issCard.lon = pos.lon;
          drawMiniMap('satmap-25544', pos.lat, pos.lon);
          const rows = document.querySelectorAll('#satmap-25544')
            ?.[0]?.closest('.sat-card')?.querySelectorAll('.stv');
          if (rows?.[0]) rows[0].textContent = latLonToRegion(pos.lat, pos.lon);
        }
      } catch(e) {}
    }, 5000);
  }

  function stopRefresh() { clearInterval(refreshTimer); }

  return { render, stopRefresh };
})();
