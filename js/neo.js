// js/neo.js — Near Earth Objects via NASA NeoWs API

const NeoModule = (function () {

  const NASA_KEY = () => localStorage.getItem('sc_nasa_key') || 'DEMO_KEY';

  const HAZARD_LEVELS = [
    { max: 0.5,  label: 'NOMINAL',   color: '#00ff88', bg: 'rgba(0,255,136,0.08)'  },
    { max: 2,    label: 'ELEVATED',  color: '#ffcc00', bg: 'rgba(255,204,0,0.08)'  },
    { max: 10,   label: 'CAUTION',   color: '#ff6600', bg: 'rgba(255,102,0,0.08)'  },
    { max: 999,  label: 'ALERT',     color: '#ff2244', bg: 'rgba(255,34,68,0.08)'  },
  ];

  function getHazardLevel(distanceLd) {
    return HAZARD_LEVELS.find(h => distanceLd <= h.max) || HAZARD_LEVELS[3];
  }

  function formatDate(d) {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  async function fetchNeos() {
    const today = new Date().toISOString().split('T')[0];
    const end   = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    const url   = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${today}&end_date=${end}&api_key=${NASA_KEY()}`;
    const res   = await fetch(url);
    const data  = await res.json();

    const all = [];
    for (const date in data.near_earth_objects) {
      data.near_earth_objects[date].forEach(neo => {
        const cd = neo.close_approach_data[0];
        all.push({
          name:        neo.name.replace(/[()]/g, ''),
          id:          neo.id,
          hazardous:   neo.is_potentially_hazardous_asteroid,
          diameter:    ((neo.estimated_diameter.meters.estimated_diameter_min +
                         neo.estimated_diameter.meters.estimated_diameter_max) / 2).toFixed(0),
          distanceKm:  parseFloat(cd.miss_distance.kilometers).toFixed(0),
          distanceLd:  parseFloat(cd.miss_distance.lunar).toFixed(2),
          velocity:    parseFloat(cd.relative_velocity.kilometers_per_hour).toFixed(0),
          date:        cd.close_approach_date,
          magnitude:   neo.absolute_magnitude_h,
        });
      });
    }

    return all.sort((a, b) => parseFloat(a.distanceLd) - parseFloat(b.distanceLd)).slice(0, 12);
  }

  async function render() {
    const el = document.getElementById('neoContainer');
    if (!el) return;

    el.innerHTML = '<div class="neo-loading">Scanning orbital trajectories…</div>';

    try {
      const neos = await fetchNeos();

      // Stats bar
      const hazardous = neos.filter(n => n.hazardous).length;
      const closest   = neos[0];

      el.innerHTML = `
        <div class="neo-stats-bar">
          <div class="neo-stat">
            <span class="neo-stat-val">${neos.length}</span>
            <span class="neo-stat-label">OBJECTS THIS WEEK</span>
          </div>
          <div class="neo-stat">
            <span class="neo-stat-val" style="color:${hazardous > 0 ? '#ff6600' : '#00ff88'}">${hazardous}</span>
            <span class="neo-stat-label">POTENTIALLY HAZARDOUS</span>
          </div>
          <div class="neo-stat">
            <span class="neo-stat-val">${closest ? closest.distanceLd : '--'}</span>
            <span class="neo-stat-label">CLOSEST (LUNAR DIST.)</span>
          </div>
          <div class="neo-stat">
            <span class="neo-stat-val">${closest ? Number(closest.distanceKm).toLocaleString() : '--'} km</span>
            <span class="neo-stat-label">CLOSEST MISS DISTANCE</span>
          </div>
        </div>
        <div class="neo-grid">
          ${neos.map(neo => {
            const lvl = getHazardLevel(parseFloat(neo.distanceLd));
            return `
              <div class="neo-card" style="border-color:${lvl.color}22; background:${lvl.bg}">
                <div class="neo-card-top">
                  <span class="neo-name">${neo.name}</span>
                  <span class="neo-level" style="color:${lvl.color};border-color:${lvl.color}44">${lvl.label}</span>
                </div>
                <div class="neo-stats">
                  <div class="neo-row"><span class="nl">APPROACH</span><span class="nv">${formatDate(neo.date)}</span></div>
                  <div class="neo-row"><span class="nl">DISTANCE</span><span class="nv">${neo.distanceLd} LD</span></div>
                  <div class="neo-row"><span class="nl">DIAMETER</span><span class="nv">~${neo.diameter} m</span></div>
                  <div class="neo-row"><span class="nl">VELOCITY</span><span class="nv">${Number(neo.velocity).toLocaleString()} km/h</span></div>
                </div>
                ${neo.hazardous ? '<div class="neo-hazard-flag">⚠ PHA FLAGGED</div>' : ''}
              </div>`;
          }).join('')}
        </div>`;
    } catch(e) {
      el.innerHTML = '<div class="neo-loading">Failed to load NEO data. Check NASA API key.</div>';
    }
  }

  return { render };
})();
