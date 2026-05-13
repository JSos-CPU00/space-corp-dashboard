// js/app.js — Main application controller v3

(async function () {

  // ---- TAB SWITCHING ----
  const tabs   = document.querySelectorAll('.nav-tab');
  const panels = document.querySelectorAll('.tab-panel');

  const tabLoaded = {};

  tabs.forEach(tab => {
    tab.addEventListener('click', async () => {
      tabs.forEach(t   => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const name = tab.dataset.tab;
      document.getElementById('tab-' + name).classList.add('active');

      if (tabLoaded[name]) return;
      tabLoaded[name] = true;

      if (name === 'weather')      await WeatherModule.loadWeatherTab();
      if (name === 'markets')      { StocksModule.renderFullGrid(); ChartsModule.buildMultiStockChart(); }
      if (name === 'news')         await NewsModule.renderFullGrid();
      if (name === 'rovers')       await RoversModule.render();
      if (name === 'neo')          await NeoModule.render();
      if (name === 'spaceweather') await SpaceWeatherModule.render();
      if (name === 'satellites')   await SatelliteModule.render();
    });
  });

  // Stop satellite refresh when leaving that tab
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      if (tab.dataset.tab !== 'satellites') SatelliteModule.stopRefresh();
    });
  });

  // ---- REFRESH BUTTONS ----
  document.getElementById('refreshNews')?.addEventListener('click', async () => {
    tabLoaded['news'] = false; await NewsModule.renderFullGrid(); tabLoaded['news'] = true;
  });
  document.getElementById('refreshRovers')?.addEventListener('click', async () => {
    tabLoaded['rovers'] = false; await RoversModule.render(); tabLoaded['rovers'] = true;
  });
  document.getElementById('refreshNeo')?.addEventListener('click', async () => {
    tabLoaded['neo'] = false; await NeoModule.render(); tabLoaded['neo'] = true;
  });
  document.getElementById('refreshSW')?.addEventListener('click', async () => {
    tabLoaded['spaceweather'] = false; await SpaceWeatherModule.render(); tabLoaded['spaceweather'] = true;
  });
  document.getElementById('refreshSats')?.addEventListener('click', async () => {
    tabLoaded['satellites'] = false; await SatelliteModule.render(); tabLoaded['satellites'] = true;
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
    if (saved) { try { locInput.value = JSON.parse(saved).name || ''; } catch(e) {} }
    locInput.focus();
  });

  closeBtn.addEventListener('click', () => closeModal());
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

  function closeModal() { modal.setAttribute('hidden', ''); clearSuggestions(); }

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
  let suggestionData = [], searchTimer = null;

  const suggestBox = document.createElement('div');
  suggestBox.id = 'locationSuggestions';
  suggestBox.style.cssText = 'position:absolute;left:0;right:0;top:100%;background:#0b1220;border:1px solid #1e4a8a;border-top:none;border-radius:0 0 3px 3px;z-index:300;max-height:200px;overflow-y:auto;display:none';

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
    if (e.key === 'Enter') { e.preventDefault(); if (suggestionData.length > 0) selectLocation(suggestionData[0]); else saveBtn.click(); }
    if (e.key === 'Escape') closeModal();
  });

  async function fetchSuggestions(query) {
    try {
      const res  = await fetch('https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(query) + '&count=6&language=en&format=json');
      const data = await res.json();
      suggestionData = data.results || [];
      renderSuggestions(suggestionData);
    } catch(e) { clearSuggestions(); }
  }

  function renderSuggestions(results) {
    if (!results.length) { suggestBox.style.display = 'none'; return; }
    suggestBox.innerHTML = results.map((r, i) => {
      const label = [r.name, r.admin1, r.country].filter(Boolean).join(', ');
      return '<div class="loc-sug" data-i="' + i + '" style="padding:0.5rem 0.8rem;cursor:pointer;font-size:0.72rem;font-family:Share Tech Mono,monospace;color:#d0e8ff;border-bottom:1px solid #1a2a44;">' + label + '</div>';
    }).join('');
    suggestBox.style.display = 'block';
    suggestBox.querySelectorAll('.loc-sug').forEach(el => {
      el.addEventListener('mouseenter', () => el.style.background = 'rgba(0,170,255,0.12)');
      el.addEventListener('mouseleave', () => el.style.background = '');
      el.addEventListener('mousedown', e => { e.preventDefault(); selectLocation(suggestionData[parseInt(el.dataset.i)]); });
    });
  }

  function clearSuggestions() { suggestBox.style.display = 'none'; suggestBox.innerHTML = ''; suggestionData = []; }

  async function selectLocation(r) {
    const name = [r.name, r.admin1, r.country_code || r.country].filter(Boolean).join(', ');
    localStorage.setItem('sc_location', JSON.stringify({ lat: r.latitude, lon: r.longitude, name }));
    locInput.value = name;
    clearSuggestions();
    closeModal();
    showToast('Location set to ' + r.name);
    await WeatherModule.loadEarthWidget();
    await ChartsModule.buildTempChart();
    if (tabLoaded['weather']) { tabLoaded['weather'] = false; await WeatherModule.loadWeatherTab(); tabLoaded['weather'] = true; }
  }

  saveBtn.addEventListener('click', async () => {
    const raw = locInput.value.trim();
    if (!raw) { closeModal(); return; }
    if (suggestionData.length > 0) { await selectLocation(suggestionData[0]); return; }
    showToast('Searching…');
    try {
      const res  = await fetch('https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(raw) + '&count=1&language=en&format=json');
      const data = await res.json();
      if (data.results?.length > 0) await selectLocation(data.results[0]);
      else showToast('Location not found — try "City, State"');
    } catch(e) { showToast('Network error — check connection'); }
  });

  // ---- TOAST ----
  function showToast(msg) {
    document.querySelectorAll('.sc-toast').forEach(t => t.remove());
    const t = document.createElement('div');
    t.className = 'sc-toast';
    t.style.cssText = 'position:fixed;bottom:5rem;left:50%;transform:translateX(-50%);background:#0b1220;border:1px solid #1e4a8a;color:#d0e8ff;font-family:Share Tech Mono,monospace;font-size:0.7rem;padding:0.6rem 1.4rem;border-radius:3px;z-index:500;box-shadow:0 0 20px rgba(0,100,255,0.3);white-space:nowrap';
    t.textContent = '⬡ ' + msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3500);
  }

  // ---- INIT ----
  await Promise.allSettled([
    WeatherModule.loadEarthWidget(),
    WeatherModule.loadMarsWidget(),
    (async () => StocksModule.renderOverviewWidget())(),
    NewsModule.renderOverviewWidget(),
  ]);
  ChartsModule.initChartControls();
  ChartsModule.buildStockChart('RKLB');
  ChartsModule.buildTempChart();

})();
