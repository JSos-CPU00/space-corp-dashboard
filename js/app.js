// js/app.js — Main application controller v2

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
  const fab      = document.getElementById('customizeBtn');
  const modal    = document.getElementById('customizeModal');
  const closeBtn = document.getElementById('closeModal');
  const saveBtn  = document.getElementById('saveSettings');
  const locInput = document.getElementById('locationInput');

  fab.addEventListener('click', () => {
    modal.removeAttribute('hidden');
    const saved = localStorage.getItem('sc_location');
    if (saved) {
      try { locInput.value = JSON.parse(saved).name || ''; } catch(e) {}
    }
    locInput.focus();
  });

  closeBtn.addEventListener('click', () => closeModal());
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

  function closeModal() {
    modal.setAttribute('hidden', '');
    clearSuggestions();
  }

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

  // ---- LOCATION AUTOCOMPLETE ----
  let suggestionData = [];
  let searchTimer    = null;

  // Create dropdown container
  const suggestBox = document.createElement('div');
  suggestBox.id = 'locationSuggestions';
  suggestBox.style.cssText = [
    'position:absolute','left:0','right:0','top:100%',
    'background:#0b1220','border:1px solid #1e4a8a',
    'border-top:none','border-radius:0 0 3px 3px',
    'z-index:300','max-height:200px','overflow-y:auto','display:none'
  ].join(';');

  // Wrap input in relative container
  const wrapper = document.createElement('div');
  wrapper.style.position = 'relative';
  locInput.parentNode.insertBefore(wrapper, locInput);
  wrapper.appendChild(locInput);
  wrapper.appendChild(suggestBox);

  locInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    const q = locInput.value.trim();
    if (q.length < 2) { clearSuggestions(); return; }
    searchTimer = setTimeout(() => fetchSuggestions(q), 350);
  });

  locInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestionData.length > 0) selectLocation(suggestionData[0]);
      else saveBtn.click();
    }
    if (e.key === 'Escape') closeModal();
  });

  async function fetchSuggestions(query) {
    try {
      const url  = 'https://geocoding-api.open-meteo.com/v1/search?name=' +
                   encodeURIComponent(query) + '&count=6&language=en&format=json';
      const res  = await fetch(url);
      const data = await res.json();
      suggestionData = data.results || [];
      renderSuggestions(suggestionData);
    } catch(e) {
      clearSuggestions();
    }
  }

  function renderSuggestions(results) {
    if (!results.length) { suggestBox.style.display = 'none'; return; }
    suggestBox.innerHTML = results.map((r, i) => {
      const label = [r.name, r.admin1, r.country].filter(Boolean).join(', ');
      return '<div class="loc-sug" data-i="' + i + '" style="' +
        'padding:0.5rem 0.8rem;cursor:pointer;font-size:0.72rem;' +
        'font-family:Share Tech Mono,monospace;color:#d0e8ff;' +
        'border-bottom:1px solid #1a2a44;">' + label + '</div>';
    }).join('');
    suggestBox.style.display = 'block';

    suggestBox.querySelectorAll('.loc-sug').forEach(el => {
      el.addEventListener('mouseenter', () => el.style.background = 'rgba(0,170,255,0.12)');
      el.addEventListener('mouseleave', () => el.style.background = '');
      el.addEventListener('mousedown', e => {
        e.preventDefault(); // prevent blur before click fires
        selectLocation(suggestionData[parseInt(el.dataset.i)]);
      });
    });
  }

  function clearSuggestions() {
    suggestBox.style.display = 'none';
    suggestBox.innerHTML     = '';
    suggestionData           = [];
  }

  async function selectLocation(r) {
    const name = [r.name, r.admin1, r.country_code || r.country].filter(Boolean).join(', ');
    localStorage.setItem('sc_location', JSON.stringify({
      lat:  r.latitude,
      lon:  r.longitude,
      name: name,
    }));
    locInput.value = name;
    clearSuggestions();
    closeModal();
    showToast('Location set to ' + r.name);

    await WeatherModule.loadEarthWidget();
    await ChartsModule.buildTempChart();

    if (weatherTabLoaded) {
      weatherTabLoaded = false;
      await WeatherModule.loadWeatherTab();
      weatherTabLoaded = true;
    }
  }

  saveBtn.addEventListener('click', async () => {
    const raw = locInput.value.trim();
    if (!raw) { closeModal(); return; }

    if (suggestionData.length > 0) {
      await selectLocation(suggestionData[0]);
      return;
    }

    showToast('Searching…');
    try {
      const url  = 'https://geocoding-api.open-meteo.com/v1/search?name=' +
                   encodeURIComponent(raw) + '&count=1&language=en&format=json';
      const res  = await fetch(url);
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        await selectLocation(data.results[0]);
      } else {
        showToast('Location not found — try "City, State" or "City, Country"');
      }
    } catch(e) {
      showToast('Network error — check connection');
    }
  });

  // ---- NEWS REFRESH ----
  document.getElementById('refreshNews')?.addEventListener('click', async () => {
    newsTabLoaded = false;
    await NewsModule.renderFullGrid();
    newsTabLoaded = true;
  });

  // ---- TOAST ----
  function showToast(msg) {
    document.querySelectorAll('.sc-toast').forEach(t => t.remove());
    const t = document.createElement('div');
    t.className = 'sc-toast';
    t.style.cssText = [
      'position:fixed','bottom:5rem','left:50%','transform:translateX(-50%)',
      'background:#0b1220','border:1px solid #1e4a8a','color:#d0e8ff',
      'font-family:Share Tech Mono,monospace','font-size:0.7rem',
      'padding:0.6rem 1.4rem','border-radius:3px','z-index:500',
      'box-shadow:0 0 20px rgba(0,100,255,0.3)','white-space:nowrap'
    ].join(';');
    t.textContent = '⬡ ' + msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3500);
  }

  // ---- INIT ----
  async function init() {
    await Promise.allSettled([
      WeatherModule.loadEarthWidget(),
      WeatherModule.loadMarsWidget(),
      (async () => { StocksModule.renderOverviewWidget(); })(),
      NewsModule.renderOverviewWidget(),
    ]);
    ChartsModule.initChartControls();
    ChartsModule.buildStockChart('RKLB');
    ChartsModule.buildTempChart();
  }

  init();

})();