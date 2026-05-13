// js/rovers.js — Mars Rover Photos via NASA API
// Get your free key at https://api.nasa.gov (takes 30 seconds)

const RoversModule = (function () {

  const NASA_KEY = localStorage.getItem('sc_nasa_key') || 'DEMO_KEY';

  const ROVERS = [
    { id: 'curiosity',     name: 'Curiosity',     launch: '2011', status: 'ACTIVE' },
    { id: 'perseverance',  name: 'Perseverance',  launch: '2020', status: 'ACTIVE' },
  ];

  async function fetchLatestPhotos(rover, count = 6) {
    try {
      // Get latest photos
      const url = `https://api.nasa.gov/mars-photos/api/v1/rovers/${rover}/latest_photos?api_key=${NASA_KEY}&page=1`;
      const res  = await fetch(url);
      const data = await res.json();
      return (data.latest_photos || []).slice(0, count);
    } catch(e) {
      return [];
    }
  }

  function timeAgo(dateStr) {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return diff + ' days ago';
  }

  async function render() {
    const el = document.getElementById('roversContainer');
    if (!el) return;

    const key = localStorage.getItem('sc_nasa_key');
    if (!key) {
      el.innerHTML = `
        <div class="api-key-prompt">
          <div class="akp-icon">🔑</div>
          <div class="akp-title">NASA API KEY REQUIRED</div>
          <div class="akp-desc">Mars Rover photos require a free NASA API key.<br>
            Get yours in 30 seconds at <a href="https://api.nasa.gov" target="_blank" rel="noopener">api.nasa.gov</a>
          </div>
          <div class="akp-input-row">
            <input id="nasaKeyInput" class="modal-input" type="text" placeholder="Paste your NASA API key here" />
            <button id="nasaKeySave" class="btn-refresh">SAVE KEY</button>
          </div>
          <div class="akp-note">Key is stored in your browser only. Never sent anywhere except NASA.</div>
        </div>`;
      document.getElementById('nasaKeySave').addEventListener('click', () => {
        const k = document.getElementById('nasaKeyInput').value.trim();
        if (k) { localStorage.setItem('sc_nasa_key', k); render(); }
      });
      return;
    }

    el.innerHTML = '<div class="rover-loading">Downloading telemetry from Mars…</div>';

    for (const rover of ROVERS) {
      const photos = await fetchLatestPhotos(rover.id, 6);
      const section = document.createElement('div');
      section.className = 'rover-section';

      if (photos.length === 0) {
        section.innerHTML = `
          <div class="rover-header">
            <span class="rover-name">${rover.name.toUpperCase()}</span>
            <span class="rover-status ${rover.status === 'ACTIVE' ? 'active' : ''}">${rover.status}</span>
          </div>
          <div class="rover-empty">No photos available — DEMO_KEY rate limited. <a href="https://api.nasa.gov" target="_blank">Get a free key</a>.</div>`;
      } else {
        const meta = photos[0];
        section.innerHTML = `
          <div class="rover-header">
            <span class="rover-name">${rover.name.toUpperCase()}</span>
            <span class="rover-status active">${rover.status}</span>
            <span class="rover-meta">Sol ${meta.sol} · ${timeAgo(meta.earth_date)} · ${meta.camera.full_name}</span>
          </div>
          <div class="rover-grid">
            ${photos.map(p => `
              <div class="rover-photo" onclick="window.open('${p.img_src}','_blank')">
                <img src="${p.img_src}" alt="${p.camera.name}" loading="lazy" />
                <div class="rover-photo-label">${p.camera.name}</div>
              </div>
            `).join('')}
          </div>`;
      }

      if (el.querySelector('.rover-loading')) el.innerHTML = '';
      el.appendChild(section);
    }
  }

  return { render };
})();
