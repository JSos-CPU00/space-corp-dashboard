// js/stocks.js — Space sector stock simulation
// NOTE: For live data, replace generateStockData with a real API call
// (e.g., Alpha Vantage, Polygon.io, Yahoo Finance proxy)

const StocksModule = (function () {

  const STOCKS = [
    { ticker: 'RKLB',  name: 'Rocket Lab USA',        base: 8.50  },
    { ticker: 'SPCE',  name: 'Virgin Galactic',        base: 1.80  },
    { ticker: 'ASTR',  name: 'Astra Space',            base: 0.55  },
    { ticker: 'BA',    name: 'Boeing Co.',             base: 175.0 },
    { ticker: 'LMT',   name: 'Lockheed Martin',        base: 470.0 },
    { ticker: 'NOC',   name: 'Northrop Grumman',       base: 480.0 },
    { ticker: 'RTX',   name: 'RTX Corp (Raytheon)',    base: 120.0 },
    { ticker: 'MAXR',  name: 'Maxar Technologies',     base: 17.0  },
  ];

  // Seed-based pseudo-random so values are consistent per session
  let _seed = Date.now() % 99991;
  function seededRand() {
    _seed = (_seed * 16807 + 0) % 2147483647;
    return (_seed - 1) / 2147483646;
  }

  function generateStockData(stock) {
    const changePct  = (seededRand() - 0.48) * 6; // -3% to +3%
    const price      = stock.base * (1 + changePct / 100);
    const changeAmt  = price - stock.base;
    return {
      ticker:    stock.ticker,
      name:      stock.name,
      price:     price.toFixed(2),
      change:    changeAmt.toFixed(2),
      changePct: changePct.toFixed(2),
      up:        changePct >= 0,
      base:      stock.base,
    };
  }

  function generate30DayHistory(basePrice) {
    const prices = [];
    let p = basePrice * (0.9 + seededRand() * 0.2);
    for (let i = 0; i < 30; i++) {
      p = p * (1 + (seededRand() - 0.5) * 0.04);
      prices.push(parseFloat(p.toFixed(2)));
    }
    return prices;
  }

  function getAllStocks() {
    return STOCKS.map(generateStockData);
  }

  function renderOverviewWidget() {
    const el     = document.getElementById('stocksOverview');
    const stocks = getAllStocks().slice(0, 5);
    el.innerHTML = stocks.map(s => `
      <div class="stock-row">
        <span class="stock-ticker">${s.ticker}</span>
        <span class="stock-name">${s.name}</span>
        <span class="stock-price">$${s.price}</span>
        <span class="stock-change ${s.up ? 'up' : 'down'}">${s.up ? '▲' : '▼'} ${Math.abs(s.changePct)}%</span>
      </div>
    `).join('');
  }

  function renderFullGrid() {
    const el     = document.getElementById('fullStocksGrid');
    const stocks = getAllStocks();
    el.innerHTML = stocks.map((s, i) => {
      const barPct = Math.min(100, Math.abs(s.changePct) * 20);
      return `
        <div class="stock-card" style="animation-delay:${i * 0.05}s">
          <div class="sc-ticker">${s.ticker}</div>
          <div class="sc-company">${s.name}</div>
          <div class="sc-price">$${s.price}</div>
          <div class="sc-change ${s.up ? 'up' : 'down'}">${s.up ? '▲ +' : '▼ '}${s.changePct}% (${s.up ? '+' : ''}$${s.change})</div>
          <div class="sc-bar"><div class="sc-bar-fill ${s.up ? 'up' : 'down'}" style="width:${barPct}%"></div></div>
        </div>
      `;
    }).join('');
  }

  function getHistoryForTicker(ticker) {
    const stock = STOCKS.find(s => s.ticker === ticker);
    if (!stock) return [];
    return generate30DayHistory(stock.base);
  }

  function getAllHistory() {
    const result = {};
    STOCKS.slice(0, 5).forEach(s => {
      result[s.ticker] = generate30DayHistory(s.base);
    });
    return result;
  }

  return { renderOverviewWidget, renderFullGrid, getHistoryForTicker, getAllHistory, getAllStocks };
})();
