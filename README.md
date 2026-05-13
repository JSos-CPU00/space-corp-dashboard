# Space Corp Mission Dashboard

A retro-futuristic, real-time space exploration data dashboard for scientists, researchers, and mission stakeholders.

## Features

- 🌍 **Live Earth Weather** — powered by [Open-Meteo](https://open-meteo.com/) (free, no API key needed)
- 🔴 **Planetary Conditions** — Mars, Moon, and Venus data (NASA model-based simulation)
- 📈 **Space Sector Stocks** — RKLB, SPCE, BA, LMT, NOC, RTX, MAXR with 30-day trend charts
- 📡 **News Feed** — Space exploration headlines (RSS via rss2json, with curated fallback)
- 📊 **Interactive Charts** — Stock trends and 7-day Earth temperature forecast
- ⚙️ **Customizable** — Toggle widgets, change weather location

## Project Structure

```
space-corp-dashboard/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── app.js          # Main controller, tabs, modal
│   ├── starfield.js    # Animated star background
│   ├── clock.js        # Mission elapsed time clock
│   ├── weather.js      # Earth (Open-Meteo) + planetary data
│   ├── stocks.js       # Stock data and rendering
│   ├── news.js         # RSS news feed
│   └── charts.js       # Chart.js visualizations
└── .github/
    └── workflows/
        └── deploy.yml  # GitHub Pages auto-deploy
```

## Local Development

No build step needed — pure HTML/CSS/JS.

```bash
git clone https://github.com/YOUR_USERNAME/space-corp-dashboard.git
cd space-corp-dashboard

# Option 1: Python
python3 -m http.server 8080

# Option 2: Node
npx serve .

# Open http://localhost:8080
```

## Deploy to GitHub Pages

### Method 1: Automated (GitHub Actions)

1. Push this repo to GitHub
2. Go to **Settings → Pages**
3. Under **Source**, select **GitHub Actions**
4. Push any commit to `main` — it deploys automatically
5. Your site will be at `https://YOUR_USERNAME.github.io/space-corp-dashboard/`

### Method 2: Manual

1. Go to **Settings → Pages**
2. Source: **Deploy from a branch**
3. Branch: `main`, folder: `/ (root)`
4. Save — deploys in ~60 seconds

## Live Data APIs Used

| Data | Provider | Key Required |
|------|----------|-------------|
| Earth Weather | [Open-Meteo](https://open-meteo.com/) | ❌ Free |
| Geocoding | [Open-Meteo Geocoding](https://open-meteo.com/en/docs/geocoding-api) | ❌ Free |
| Space News | [RSS2JSON](https://rss2json.com/) + NASA RSS | ❌ Free |
| Stock Prices | Simulated (realistic) | N/A |

### Upgrading to Live Stocks

Replace `StocksModule.generateStockData()` in `js/stocks.js` with calls to:
- [Alpha Vantage](https://www.alphavantage.co/) (free tier: 25 req/day)
- [Polygon.io](https://polygon.io/) (free tier available)
- [Yahoo Finance proxy](https://github.com/ranaroussi/yfinance)

## Customization

- **Location**: Click ⚙ → enter your city → saves to localStorage
- **Widgets**: Toggle individual panels on/off
- **Color theme**: Edit CSS variables in `css/style.css` (`:root` block)

## Tech Stack

- Vanilla HTML5 / CSS3 / JavaScript (ES2020)
- [Chart.js](https://www.chartjs.org/) — data visualization
- [Open-Meteo](https://open-meteo.com/) — weather API
- [Google Fonts](https://fonts.google.com/) — Orbitron, Share Tech Mono
- GitHub Actions + GitHub Pages — hosting & CI/CD
