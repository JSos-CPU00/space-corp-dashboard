// js/app.js — Main application controller

(async function () {

  // ---- TAB SWITCHING ----
  const tabs   = document.querySelectorAll('.nav-tab');
  const panels = document.querySelectorAll('.tab-panel');

  let weatherTabLoaded  = false;
  let marketsTabLoaded  = false;
  let newsTabLoaded     = false;

  tabs.forEach(tab => {
    tab.addEventListener('click', async () => {
      tabs.forEach(t   => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const id = 'tab-' + tab.dataset.tab;
      document.getElementById(id).classList.add('active');

      // Lazy-load tab content
      if (tab.dataset.tab === 'weather' && !weatherTabLoaded) {
        weatherTabLoaded = true;
        await WeatherModule.loadWeatherTab();
      }
      if (tab.dataset.tab === 'markets' && !marketsTabLoaded) {
        marketsTabLoaded = true;
        StocksModule.renderFullGrid();
        ChartsModule.buildMultiStockChart();
      }
      if (tab.dataset.tab === 'news' && !newsTabLoaded) {
        newsTabLoaded = true;
        await NewsModule.renderFullGrid();
      }
    });
  });

  // ---- CUSTOMIZE MODAL ----
  const fab         = document.getElementById('customizeBtn');
  const modal       = document.getElementById('customizeModal');
  const closeBtn    = document.getElementById('closeModal');
  const saveBtn     = document.getElementById('saveSettings');
  const locInput    = document.getElementById('locationInput');

  fab.addEventListener('click', () => {
    modal.removeAttribute('hidden');
    // Pre-fill location
    const saved = localStorage.getItem('sc_location');
    if (saved) {
      try { locInput.value = JSON.parse(saved).name || ''; } catch(e) {}
    }
  });

  closeBtn.addEventListener('click', () => modal.setAttribute('hidden', ''));
  modal.addEventListener('click', e => { if (e.target === modal) modal.setAttribute('hidden', ''); });

  // Widget visibility toggles
  document.querySelectorAll('.widget-toggles input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', () => {
      const selector = cb.dataset.widget;
      const target   = selector.startsWith('card--')
        ? document.querySelector('.' + selector)
        : document.getElementById(selector);
      if (target) target.style.display = cb.checked ? '' : 'none';
    });
  });

  saveBtn.addEventListener('click', async () => {
    const raw = locInput.value.trim();
    if (raw) {
      try {
        // Geocode via Open-Meteo geocoding API (free)
        const url  = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(raw)}&count=1&language=en&format=json`;
        const res  = await fetch(url);
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          const r = data.results[0];
          localStorage.setItem('sc_location', JSON.stringify({
            lat:  r.latitude,
            lon:  r.longitude,
            name: r.name + (r.admin1 ? ', ' + r.admin1 : '') + ', ' + r.country_code,
          }));
          showToast('Location updated to ' + r.name);
          // Reload weather
          await WeatherModule.loadEarthWidget();
          await ChartsModule.buildTempChart();
        } else {
          showToast('Location not found — try city, state format');
        }
      } catch(e) {
        showToast('Geocoding failed — check connection');
      }
    }
    modal.setAttribute('hidden', '');
  });

  // ---- NEWS REFRESH BUTTON ----
  document.getElementById('refreshNews')?.addEventListener('click', async () => {
    newsTabLoaded = false;
    await NewsModule.renderFullGrid();
    newsTabLoaded = true;
  });

  // ---- TOAST NOTIFICATION ----
  function showToast(msg) {
    const t = document.createElement('div');
    t.style.cssText = `
      position:fixed; bottom:5rem; left:50%; transform:translateX(-50%);
      background:#0b1220; border:1px solid #1e4a8a; color:#d0e8ff;
      font-family:'Share Tech Mono',monospace; font-size:0.7rem;
      padding:0.6rem 1.4rem; border-radius:3px; z-index:200;
      box-shadow:0 0 20px rgba(0,100,255,0.2);
      animation: fadeInUp 0.3s ease;
    `;
    t.textContent = '⬡ ' + msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }

  // ---- INITIALIZATION ----
  async function init() {
    // Parallel load overview tab data
    await Promise.allSettled([
      WeatherModule.loadEarthWidget(),
      WeatherModule.loadMarsWidget(),
      (async () => { StocksModule.renderOverviewWidget(); })(),
      NewsModule.renderOverviewWidget(),
    ]);

    // Build charts after data loads
    ChartsModule.initChartControls();
    ChartsModule.buildStockChart('RKLB');
    ChartsModule.buildTempChart();
  }

  init();

})();
