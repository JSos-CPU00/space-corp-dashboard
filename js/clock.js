// js/clock.js — Mission elapsed time clock
(function () {
  const start = Date.now();
  const el    = document.getElementById('missionClock');

  function pad(n) { return String(n).padStart(2, '0'); }

  function tick() {
    const elapsed = Math.floor((Date.now() - start) / 1000);
    const h = Math.floor(elapsed / 3600);
    const m = Math.floor((elapsed % 3600) / 60);
    const s = elapsed % 60;
    el.textContent = `T+${pad(h)}:${pad(m)}:${pad(s)}`;
  }

  setInterval(tick, 1000);
  tick();
})();
