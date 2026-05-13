// js/news.js — Space exploration news feed
// Uses rss2json.com (free tier) to convert NASA and SpaceNews RSS to JSON
// Falls back to curated sample articles if API is unavailable

const NewsModule = (function () {

  const FEEDS = [
    'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.nasa.gov%2Frss%2Fdyn%2FBreaking_News.rss',
    'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fspacenews.com%2Ffeed%2F',
  ];

  const SAMPLE_ARTICLES = [
    {
      title:       'NASA Artemis IV Crew Announced for Lunar Gateway Mission',
      description: 'NASA has selected four astronauts for the Artemis IV mission, which will use the lunar Gateway station for the first time in a long-duration mission to the lunar south pole region.',
      pubDate:     new Date(Date.now() - 3600000).toISOString(),
      link:        'https://nasa.gov',
      author:      'NASA HQ',
    },
    {
      title:       'SpaceX Starship Completes Third Integrated Flight Test Successfully',
      description: 'SpaceX\'s Starship vehicle achieved orbit and successful splashdown in the latest test, marking a major milestone for deep space exploration capabilities.',
      pubDate:     new Date(Date.now() - 7200000).toISOString(),
      link:        'https://spacex.com',
      author:      'SpaceX',
    },
    {
      title:       'Rocket Lab Captures Booster Mid-Air in Historic Recovery Attempt',
      description: 'Rocket Lab successfully caught an Electron rocket booster mid-air using a helicopter for the first time, reducing launch costs significantly.',
      pubDate:     new Date(Date.now() - 10800000).toISOString(),
      link:        'https://rocketlabusa.com',
      author:      'Rocket Lab',
    },
    {
      title:       'ESA Mars Express Reveals New Underground Ice Deposits',
      description: 'The European Space Agency\'s Mars Express orbiter has detected large subsurface ice deposits near the Martian equator, raising hopes for future human missions.',
      pubDate:     new Date(Date.now() - 14400000).toISOString(),
      link:        'https://esa.int',
      author:      'ESA',
    },
    {
      title:       'James Webb Telescope Captures Deepest Infrared Image Yet',
      description: 'NASA\'s James Webb Space Telescope has delivered the deepest and sharpest infrared image of the distant universe, revealing galaxies from over 13 billion years ago.',
      pubDate:     new Date(Date.now() - 18000000).toISOString(),
      link:        'https://nasa.gov',
      author:      'NASA / STScI',
    },
    {
      title:       'Blue Origin New Glenn Completes Second Orbital Mission',
      description: 'Blue Origin\'s New Glenn heavy-lift rocket successfully completed its second orbital mission, deploying commercial satellites and returning the first stage to landing.',
      pubDate:     new Date(Date.now() - 21600000).toISOString(),
      link:        'https://blueorigin.com',
      author:      'Blue Origin',
    },
    {
      title:       'ISRO Successfully Launches Chandrayaan-4 Lunar Sample Return Mission',
      description: 'India\'s space agency launched Chandrayaan-4, targeting the lunar south pole for a robotic sample return mission expected to take 90 days.',
      pubDate:     new Date(Date.now() - 86400000).toISOString(),
      link:        'https://isro.gov.in',
      author:      'ISRO',
    },
    {
      title:       'Congress Passes Space Infrastructure Investment Act',
      description: 'Bipartisan legislation authorizing $4.2B for domestic launch infrastructure and commercial space station development passed the Senate 87-12.',
      pubDate:     new Date(Date.now() - 172800000).toISOString(),
      link:        'https://spacenews.com',
      author:      'SpaceNews',
    },
  ];

  function timeAgo(dateStr) {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60)    return diff + 's ago';
    if (diff < 3600)  return Math.floor(diff/60) + 'm ago';
    if (diff < 86400) return Math.floor(diff/3600) + 'h ago';
    return Math.floor(diff/86400) + 'd ago';
  }

  async function fetchFeed(url) {
    const res  = await fetch(url);
    const data = await res.json();
    if (data.status !== 'ok') throw new Error('Feed error');
    return data.items.slice(0, 6).map(item => ({
      title:       item.title,
      description: item.description?.replace(/<[^>]+>/g, '').trim().slice(0, 200) + '…',
      pubDate:     item.pubDate,
      link:        item.link,
      author:      item.author || new URL(url.match(/rss_url=([^&]+)/)[1]).hostname,
    }));
  }

  async function loadAllNews() {
    let articles = [];
    for (const feed of FEEDS) {
      try {
        const items = await fetchFeed(feed);
        articles    = articles.concat(items);
      } catch(e) {
        // silent fail, use sample below
      }
    }
    if (articles.length < 4) {
      articles = SAMPLE_ARTICLES;
    }
    return articles.sort((a,b) => new Date(b.pubDate) - new Date(a.pubDate));
  }

  function articleCard(a, i) {
    return `
      <a class="news-card" href="${a.link}" target="_blank" rel="noopener" style="animation-delay:${i*0.06}s">
        <div class="nc-source">⬡ ${a.author || 'TRANSMISSION'}</div>
        <div class="nc-title">${a.title}</div>
        <div class="nc-desc">${a.description || ''}</div>
        <div class="nc-time">${timeAgo(a.pubDate)}</div>
      </a>
    `;
  }

  function articleSnippet(a) {
    return `
      <div class="news-item" onclick="window.open('${a.link}','_blank')">
        <div class="news-source">⬡ ${a.author || 'FEED'}</div>
        <div class="news-title">${a.title}</div>
        <div class="news-time">${timeAgo(a.pubDate)}</div>
      </div>
    `;
  }

  async function renderOverviewWidget() {
    const el       = document.getElementById('newsOverview');
    const articles = await loadAllNews();
    el.innerHTML   = articles.slice(0, 4).map(articleSnippet).join('');
  }

  async function renderFullGrid() {
    const el       = document.getElementById('fullNewsGrid');
    el.innerHTML   = '<div class="news-loading">Acquiring signal…</div>';
    const articles = await loadAllNews();
    el.innerHTML   = articles.map(articleCard).join('');
  }

  return { renderOverviewWidget, renderFullGrid, loadAllNews };
})();
