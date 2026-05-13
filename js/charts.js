// js/charts.js — Chart.js visualizations

const ChartsModule = (function () {

  const CHART_DEFAULTS = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#6a90b8',
          font: { family: "'Share Tech Mono', monospace", size: 10 },
        },
      },
      tooltip: {
        backgroundColor: '#0b1220',
        borderColor: '#1a2a44',
        borderWidth: 1,
        titleColor: '#00aaff',
        bodyColor: '#d0e8ff',
        titleFont: { family: "'Orbitron', sans-serif", size: 10 },
        bodyFont:  { family: "'Share Tech Mono', monospace", size: 11 },
      },
    },
    scales: {
      x: {
        ticks: { color: '#334466', font: { family: "'Share Tech Mono'", size: 9 } },
        grid:  { color: 'rgba(26,42,68,0.6)' },
      },
      y: {
        ticks: { color: '#334466', font: { family: "'Share Tech Mono'", size: 9 } },
        grid:  { color: 'rgba(26,42,68,0.6)' },
      },
    },
  };

  let stockChartInstance     = null;
  let multiChartInstance     = null;
  let tempChartInstance      = null;

  function getLast30DayLabels() {
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      return `${d.getMonth()+1}/${d.getDate()}`;
    });
  }

  function get7DayLabels() {
    const days = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      return days[d.getDay()];
    });
  }

  function buildStockChart(ticker) {
    const ctx    = document.getElementById('stockChart');
    if (!ctx) return;
    const prices = StocksModule.getHistoryForTicker(ticker);
    const labels = getLast30DayLabels();
    const up     = prices[prices.length - 1] >= prices[0];
    const color  = up ? '#00ff88' : '#ff2244';

    if (stockChartInstance) stockChartInstance.destroy();

    stockChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: ticker + ' (30-day)',
          data:  prices,
          borderColor:     color,
          backgroundColor: color.replace(')', ',0.08)').replace('rgb', 'rgba'),
          borderWidth:  2,
          pointRadius:  0,
          pointHoverRadius: 4,
          fill: true,
          tension: 0.4,
        }],
      },
      options: {
        ...CHART_DEFAULTS,
        plugins: {
          ...CHART_DEFAULTS.plugins,
          legend: { display: false },
        },
        scales: {
          ...CHART_DEFAULTS.scales,
          y: {
            ...CHART_DEFAULTS.scales.y,
            ticks: {
              ...CHART_DEFAULTS.scales.y.ticks,
              callback: v => '$' + v.toFixed(2),
            },
          },
        },
      },
    });
  }

  async function buildTempChart() {
    const ctx = document.getElementById('tempChart');
    if (!ctx) return;

    let highs, lows, labels;
    try {
      const loc  = WeatherModule.getUserLocation();
      const data = await WeatherModule.fetchForecast(loc.lat, loc.lon);
      highs  = data.temperature_2m_max;
      lows   = data.temperature_2m_min;
      labels = data.time.map(d => {
        const dt = new Date(d + 'T12:00:00');
        return ['SUN','MON','TUE','WED','THU','FRI','SAT'][dt.getDay()];
      });
    } catch(e) {
      // Fallback simulated forecast
      highs  = [85,88,82,79,91,87,84];
      lows   = [62,65,60,58,68,64,61];
      labels = get7DayLabels();
    }

    if (tempChartInstance) tempChartInstance.destroy();

    tempChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'High °F',
            data:  highs,
            borderColor:     '#ff6600',
            backgroundColor: 'rgba(255,102,0,0.08)',
            borderWidth: 2,
            pointRadius: 4,
            pointBackgroundColor: '#ff6600',
            fill: false,
            tension: 0.4,
          },
          {
            label: 'Low °F',
            data:  lows,
            borderColor:     '#00aaff',
            backgroundColor: 'rgba(0,170,255,0.08)',
            borderWidth: 2,
            pointRadius: 4,
            pointBackgroundColor: '#00aaff',
            fill: false,
            tension: 0.4,
          },
        ],
      },
      options: {
        ...CHART_DEFAULTS,
        scales: {
          ...CHART_DEFAULTS.scales,
          y: {
            ...CHART_DEFAULTS.scales.y,
            ticks: {
              ...CHART_DEFAULTS.scales.y.ticks,
              callback: v => v + '°F',
            },
          },
        },
      },
    });
  }

  function buildMultiStockChart() {
    const ctx = document.getElementById('multiStockChart');
    if (!ctx) return;

    const allHistory = StocksModule.getAllHistory();
    const labels     = getLast30DayLabels();
    const COLORS     = ['#00ffee','#00aaff','#ff6600','#00ff88','#ffcc00'];
    const tickers    = Object.keys(allHistory);

    if (multiChartInstance) multiChartInstance.destroy();

    multiChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: tickers.map((ticker, i) => ({
          label: ticker,
          data:  allHistory[ticker],
          borderColor:     COLORS[i % COLORS.length],
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          pointRadius: 0,
          tension: 0.4,
        })),
      },
      options: {
        ...CHART_DEFAULTS,
        scales: {
          ...CHART_DEFAULTS.scales,
          y: {
            ...CHART_DEFAULTS.scales.y,
            ticks: {
              ...CHART_DEFAULTS.scales.y.ticks,
              callback: v => '$' + v.toFixed(2),
            },
          },
        },
      },
    });
  }

  // Stock chart ticker selector
  function initChartControls() {
    const sel = document.getElementById('chartStockSelect');
    if (sel) {
      sel.addEventListener('change', () => buildStockChart(sel.value));
    }
  }

  return { buildStockChart, buildTempChart, buildMultiStockChart, initChartControls };
})();
