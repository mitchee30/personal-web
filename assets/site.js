/* Wenbo Zhi — shared site script
   - language switch (EN / 中文), remembered per visitor
   - painted sky: five times of day that cross-fade between pages
   - stars, comet and shooting stars on a canvas
   - lakeside scene drawn once in SVG
   - background music that keeps playing between pages
   - in-place page switching so the music never restarts            */
(function () {
  "use strict";

  const SKIES = ["dusk", "day", "sunset", "night", "dawn"];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    sget(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    sset(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
  };

  /* ---------------- language ---------------- */
  function pickLang() {
    const q = new URLSearchParams(location.search).get("lang");
    if (q === "zh" || q === "en") return q;
    const saved = store.get("lang");
    if (saved === "zh" || saved === "en") return saved;
    return (navigator.language || "").toLowerCase().startsWith("zh") ? "zh" : "en";
  }
  function setLang(lang) {
    const html = document.documentElement;
    html.dataset.lang = lang;
    html.lang = lang === "zh" ? "zh-CN" : "en";
    store.set("lang", lang);
    const btn = document.getElementById("langBtn");
    if (btn) {
      btn.textContent = lang === "zh" ? "EN" : "中文";
      btn.setAttribute("aria-label", lang === "zh" ? "Switch to English" : "切换到中文");
    }
    const t = document.querySelector("title");
    if (t && t.dataset[lang]) document.title = t.dataset[lang];
  }
  setLang(pickLang());

  /* ---------------- sky layers ---------------- */
  const sky = document.getElementById("sky");
  SKIES.forEach(function (name) {
    const d = document.createElement("div");
    d.className = "sky-layer";
    d.dataset.sky = name;
    sky.appendChild(d);
  });
  function showSky(name) {
    sky.querySelectorAll(".sky-layer").forEach(function (l) {
      l.classList.toggle("on", l.dataset.sky === name);
    });
    document.body.dataset.sky = name;
    starfield.target(name);
  }

  /* ---------------- clouds ---------------- */
  (function buildClouds() {
    const wrap = document.getElementById("clouds");
    const shapes = [
      // [left%, top%, width px, duration s, delay s]
      [4, 14, 260, 95, -20], [58, 8, 340, 120, -60], [30, 30, 210, 80, -35],
      [76, 34, 240, 105, -10], [-6, 46, 300, 130, -80]
    ];
    shapes.forEach(function (s) {
      const el = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      el.setAttribute("viewBox", "0 0 300 110");
      el.setAttribute("class", "cloud");
      el.setAttribute("aria-hidden", "true");
      el.style.left = s[0] + "%";
      el.style.top = s[1] + "%";
      el.style.width = Math.round(s[2] * (innerWidth < 620 ? 0.6 : 1)) + "px";
      el.style.animationDuration = s[3] + "s";
      el.style.animationDelay = s[4] + "s";
      el.style.animationDirection = "alternate";
      // a soft cumulus: lit underside first, bright top on top of it
      const puff = "M26 84 Q12 84 16 72 Q20 60 36 62 Q40 44 60 46 Q72 24 100 30 Q118 10 146 22 Q170 8 194 26 Q222 22 228 46 Q256 44 264 64 Q284 68 278 80 Q274 88 258 88 Q200 92 150 88 Q90 92 26 84 Z";
      // lit underside peeks out below the bright top, like painted anime clouds
      el.innerHTML =
        '<path class="c-under" transform="translate(0 9)" d="' + puff + '"/>' +
        '<path class="c-top" d="' + puff + '"/>' +
        '<path class="c-shine" d="M70 52 Q96 34 124 42" />';
      wrap.appendChild(el);
    });
  })();

  /* ---------------- lakeside scene ---------------- */
  (function buildScene() {
    const W = 1440, BASE = 190; // shoreline y inside a 1440 x 260 box
    function palm(x, h, lean, scale) {
      const tx = x + lean, ty = BASE - h;
      let d = "";
      // fronds
      const angles = [-170, -140, -110, -70, -40, -10, 15, 165];
      angles.forEach(function (deg, i) {
        const a = deg * Math.PI / 180;
        const L = (52 + (i % 3) * 10) * scale;
        const ex = tx + Math.cos(a) * L;
        const ey = ty + Math.sin(a) * L * 0.55 + 18 * scale;
        const mx = tx + Math.cos(a) * L * 0.5;
        const my = ty + Math.sin(a) * L * 0.5 - 8 * scale;
        const w = 6 * scale;
        d += "M" + tx + " " + ty +
             " Q" + (mx) + " " + (my - w) + " " + ex + " " + ey +
             " Q" + (mx) + " " + (my + w) + " " + tx + " " + ty + " Z ";
      });
      const trunk = '<path d="M' + x + ' ' + (BASE + 2) + ' Q' + (x + lean * 0.2) + ' ' + (BASE - h * 0.55) + ' ' + tx + ' ' + ty +
        '" stroke="var(--land)" stroke-width="' + (7 * scale) + '" stroke-linecap="round" fill="none" class="trunk"/>';
      return trunk + '<path d="' + d + '"/>';
    }
    // shoreline: low hills on the right, a peninsula with a pavilion on the left
    const ground =
      '<path d="M0 ' + (BASE - 18) + ' Q90 ' + (BASE - 26) + ' 180 ' + (BASE - 16) + ' Q300 ' + (BASE - 10) + ' 420 ' + (BASE - 6) +
      ' L540 ' + (BASE - 2) + ' L560 ' + BASE + ' L0 ' + BASE + ' Z"/>' +
      '<path d="M900 ' + BASE + ' Q980 ' + (BASE - 30) + ' 1080 ' + (BASE - 26) + ' Q1180 ' + (BASE - 52) + ' 1290 ' + (BASE - 34) +
      ' Q1370 ' + (BASE - 40) + ' 1440 ' + (BASE - 22) + ' L1440 ' + BASE + ' Z"/>';
    // pavilion with a pointed roof and warm windows
    const px = 250;
    const pavilion =
      '<path d="M' + (px - 70) + ' ' + (BASE - 52) + ' L' + px + ' ' + (BASE - 120) + ' L' + (px + 70) + ' ' + (BASE - 52) + ' Z"/>' +
      '<rect x="' + (px - 52) + '" y="' + (BASE - 54) + '" width="104" height="40"/>';
    const windows =
      '<rect class="lit" x="' + (px - 40) + '" y="' + (BASE - 44) + '" width="16" height="18" rx="3"/>' +
      '<rect class="lit" x="' + (px - 8) + '" y="' + (BASE - 44) + '" width="16" height="18" rx="3"/>' +
      '<rect class="lit" x="' + (px + 24) + '" y="' + (BASE - 44) + '" width="16" height="18" rx="3"/>';
    const lamps =
      '<circle class="lamp-glow" cx="' + (px - 90) + '" cy="' + (BASE - 30) + '" r="22"/>' +
      '<circle class="lit" cx="' + (px - 90) + '" cy="' + (BASE - 30) + '" r="4"/>' +
      '<circle class="lamp-glow" cx="' + (px + 100) + '" cy="' + (BASE - 26) + '" r="22"/>' +
      '<circle class="lit" cx="' + (px + 100) + '" cy="' + (BASE - 26) + '" r="4"/>' +
      '<circle class="lamp-glow" cx="1190" cy="' + (BASE - 46) + '" r="18"/>' +
      '<circle class="lit" cx="1190" cy="' + (BASE - 46) + '" r="3"/>';
    const palms =
      palm(70, 120, 18, 1.1) + palm(130, 95, -14, 0.9) + palm(395, 130, 26, 1.15) +
      palm(470, 88, 12, 0.85) + palm(1010, 92, -10, 0.85) + palm(1340, 118, -22, 1.05);
    const landGroup = ground + pavilion + palms;

    let shimmer = "";
    const lines = [[180, 204, 60], [250, 214, 90], [330, 226, 40], [700, 208, 50], [760, 232, 70],
                   [1100, 212, 60], [1190, 222, 80], [1250, 240, 40], [520, 246, 60]];
    lines.forEach(function (l, i) {
      shimmer += '<line class="shimmer" x1="' + l[0] + '" y1="' + l[1] + '" x2="' + (l[0] + l[2]) + '" y2="' + l[1] +
        '" stroke-width="2" style="animation-delay:' + (-i * 0.7) + 's"/>';
    });

    document.getElementById("scene").innerHTML =
      '<svg viewBox="0 0 ' + W + ' 260" preserveAspectRatio="xMidYMax slice" aria-hidden="true">' +
      '<defs><radialGradient id="lampGlow"><stop offset="0" stop-color="#ffd27a" stop-opacity=".75"/>' +
      '<stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>' +
      '<clipPath id="water"><rect x="0" y="' + BASE + '" width="' + W + '" height="80"/></clipPath></defs>' +
      '<g class="reflect" clip-path="url(#water)" transform="translate(0 ' + (BASE * 2) + ') scale(1 -1)">' + landGroup + '</g>' +
      '<g clip-path="url(#water)" opacity=".45" transform="translate(0 ' + (BASE * 2) + ') scale(1 -1)">' + windows + '</g>' +
      shimmer +
      '<g class="land">' + landGroup + '</g>' + windows + lamps +
      '</svg>';
  })();

  /* ---------------- stars, comet, shooting stars ---------------- */
  const starfield = (function () {
    const cv = document.getElementById("stars");
    const ctx = cv.getContext("2d");
    let W = 0, H = 0, DPR = 1;
    const CONF = {
      dusk:   { stars: 0.45, comet: 1, shoot: 0 },
      day:    { stars: 0,    comet: 0, shoot: 0 },
      sunset: { stars: 0.12, comet: 0, shoot: 0 },
      night:  { stars: 1,    comet: 1, shoot: 1 },
      dawn:   { stars: 0.18, comet: 0.35, shoot: 0 }
    };
    const stars = [];
    for (let i = 0; i < 320; i++) {
      stars.push({ x: Math.random(), y: Math.pow(Math.random(), 1.4) * 0.72,
                   r: Math.random() < 0.08 ? 1.6 : 0.5 + Math.random() * 0.9,
                   tw: Math.random() * Math.PI * 2, sp: 0.6 + Math.random() * 1.6 });
    }
    let cur = { stars: 0, comet: 0, shoot: 0 }, goal = cur;
    let shooting = null, nextShoot = 2;

    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = innerWidth; H = innerHeight;
      cv.width = W * DPR; cv.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      if (reduceMotion) draw(0);
    }

    function comet(alpha, t) {
      if (alpha < 0.01) return;
      const drift = Math.sin(t * 0.05) * 6;
      const hx = W * 0.64 + drift, hy = H * 0.24 + drift * 0.4;
      const tx = W * 0.98, ty = -H * 0.02;
      ctx.save();
      ctx.globalAlpha = alpha;
      // two tails: blue core and a rosy veil
      [["rgba(180,220,255,", 1, 0], ["rgba(255,170,215,", 0.7, 26]].forEach(function (c) {
        const g = ctx.createLinearGradient(hx, hy, tx, ty);
        g.addColorStop(0, c[0] + (0.85 * c[1]) + ")");
        g.addColorStop(1, c[0] + "0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(hx, hy - 2);
        ctx.quadraticCurveTo((hx + tx) / 2 + c[2], (hy + ty) / 2 - 30 - c[2], tx + c[2] * 2, ty - 10);
        ctx.lineTo(tx + 60 + c[2] * 2, ty + 40);
        ctx.quadraticCurveTo((hx + tx) / 2 + 30 + c[2], (hy + ty) / 2 + 10, hx + 2, hy + 2);
        ctx.closePath();
        ctx.fill();
      });
      const glow = ctx.createRadialGradient(hx, hy, 0, hx, hy, 26);
      glow.addColorStop(0, "rgba(255,255,255,1)");
      glow.addColorStop(0.25, "rgba(200,230,255,.8)");
      glow.addColorStop(1, "rgba(200,230,255,0)");
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(hx, hy, 26, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    function draw(t) {
      ctx.clearRect(0, 0, W, H);
      const n = Math.round(stars.length * cur.stars);
      for (let i = 0; i < n; i++) {
        const s = stars[i];
        const a = (0.55 + 0.45 * Math.sin(s.tw + t * s.sp)) * (1 - s.y * 0.9) * Math.min(1, cur.stars * 2.2);
        ctx.fillStyle = "rgba(255,250,240," + a.toFixed(3) + ")";
        ctx.beginPath(); ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2); ctx.fill();
        if (s.r > 1.4) { // a few sparkle crosses, the cute kind
          ctx.strokeStyle = "rgba(255,250,240," + (a * 0.6).toFixed(3) + ")";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(s.x * W - 5, s.y * H); ctx.lineTo(s.x * W + 5, s.y * H);
          ctx.moveTo(s.x * W, s.y * H - 5); ctx.lineTo(s.x * W, s.y * H + 5);
          ctx.stroke();
        }
      }
      comet(cur.comet, t);
      if (shooting) {
        const p = shooting, k = p.life;
        const x = p.x + p.vx * k, y = p.y + p.vy * k;
        const g = ctx.createLinearGradient(x, y, x - p.vx * 0.25, y - p.vy * 0.25);
        g.addColorStop(0, "rgba(255,255,255," + (cur.shoot * (1 - k)).toFixed(3) + ")");
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.strokeStyle = g; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - p.vx * 0.25, y - p.vy * 0.25); ctx.stroke();
      }
    }

    let last = 0;
    function loop(ms) {
      const t = ms / 1000, dt = Math.min(0.05, t - last); last = t;
      ["stars", "comet", "shoot"].forEach(function (k) { cur[k] += (goal[k] - cur[k]) * Math.min(1, dt * 1.6); });
      if (cur.shoot > 0.5) {
        nextShoot -= dt;
        if (!shooting && nextShoot <= 0) {
          shooting = { x: W * (0.2 + Math.random() * 0.6), y: H * (0.05 + Math.random() * 0.2),
                       vx: -(220 + Math.random() * 160), vy: 120 + Math.random() * 60, life: 0 };
          nextShoot = 4 + Math.random() * 6;
        }
      }
      if (shooting) { shooting.life += dt * 1.4; if (shooting.life >= 1) shooting = null; }
      draw(t);
      requestAnimationFrame(loop);
    }

    window.addEventListener("resize", resize);
    resize();
    if (!reduceMotion) requestAnimationFrame(loop);

    return {
      target: function (name) {
        goal = Object.assign({}, CONF[name] || CONF.dusk);
        if (reduceMotion) { cur = Object.assign({}, goal); draw(0); }
      },
      jump: function (name) { cur = Object.assign({}, CONF[name] || CONF.dusk); goal = Object.assign({}, cur); }
    };
  })();

  /* ---------------- music ---------------- */
  const audio = new Audio();
  audio.src = "assets/music/am.m4a";
  audio.loop = true;
  audio.preload = "none";
  audio.volume = 0;
  let audioMissing = false;
  audio.addEventListener("error", function () { audioMissing = true; showHint(true); setPlaying(false); });

  function setPlaying(on) {
    document.querySelectorAll("[data-music-toggle]").forEach(function (b) {
      b.classList.toggle("playing", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    store.sset("music", on ? "on" : "off");
  }
  function fadeTo(v, done) {
    const start = audio.volume, t0 = performance.now(), dur = 900;
    (function step(now) {
      const k = Math.min(1, (now - t0) / dur);
      audio.volume = Math.max(0, Math.min(1, start + (v - start) * k));
      if (k < 1) requestAnimationFrame(step); else if (done) done();
    })(t0);
  }
  function showHint(on) {
    const h = document.getElementById("musicHint");
    if (h) h.classList.toggle("show", on);
  }
  function play() {
    if (audioMissing) { showHint(true); return; }
    const p = audio.play();
    setPlaying(true);
    fadeTo(0.4);
    if (p && p.catch) p.catch(function () { setPlaying(false); });
  }
  function pause() { fadeTo(0, function () { audio.pause(); }); setPlaying(false); }
  document.addEventListener("click", function (e) {
    const b = e.target.closest("[data-music-toggle]");
    if (!b) return;
    if (audio.paused || audio.volume === 0) play(); else pause();
  });
  // remember where the song was if someone opens a page directly
  setInterval(function () { if (!audio.paused) store.sset("musicTime", String(audio.currentTime)); }, 2000);
  const savedTime = parseFloat(store.sget("musicTime") || "0");
  if (savedTime) audio.addEventListener("loadedmetadata", function () { audio.currentTime = savedTime; }, { once: true });
  if (store.sget("music") === "on") { // browsers may block this until the first click
    const p = audio.play();
    if (p && p.then) p.then(function () { setPlaying(true); fadeTo(0.4); }).catch(function () { setPlaying(false); });
  }

  /* ---------------- language button ---------------- */
  document.addEventListener("click", function (e) {
    if (e.target.closest("#langBtn")) setLang(document.documentElement.dataset.lang === "zh" ? "en" : "zh");
  });

  /* ---------------- page switching without reloading ---------------- */
  function markNav(path) {
    const file = (path.split("/").pop() || "index.html");
    document.querySelectorAll(".nav a").forEach(function (a) {
      const f = a.getAttribute("href");
      if (f === file || (file === "" && f === "index.html")) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  }
  async function go(url, push) {
    const main = document.querySelector("main");
    let html;
    try {
      const r = await fetch(url, { headers: { "X-Requested-With": "fetch" } });
      if (!r.ok) throw new Error(r.status);
      html = await r.text();
    } catch (err) { location.href = url; return; } // e.g. opened as a local file
    const doc = new DOMParser().parseFromString(html, "text/html");
    const next = doc.querySelector("main");
    if (!next) { location.href = url; return; }
    main.classList.add("leaving");
    await new Promise(function (r) { setTimeout(r, reduceMotion ? 0 : 320); });
    main.innerHTML = next.innerHTML;
    const t = doc.querySelector("title");
    const mine = document.querySelector("title");
    if (t && mine) { mine.dataset.en = t.dataset.en || t.textContent; mine.dataset.zh = t.dataset.zh || t.textContent; }
    setLang(document.documentElement.dataset.lang);
    if (push) history.pushState({}, "", url);
    markNav(new URL(url, location.href).pathname);
    showSky(doc.body.dataset.sky || "dusk");
    window.scrollTo(0, 0);
    main.classList.remove("leaving");
    const h = main.querySelector("h1");
    if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
  }
  document.addEventListener("click", function (e) {
    const a = e.target.closest("a[href]");
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || a.target === "_blank") return;
    const url = new URL(a.getAttribute("href"), location.href);
    if (url.origin !== location.origin || !/\.html$|\/$/.test(url.pathname) || url.hash) return;
    if (location.protocol === "file:") return;
    e.preventDefault();
    if (url.href !== location.href) go(url.href, true);
  });
  window.addEventListener("popstate", function () { go(location.href, false); });

  /* ---------------- start ---------------- */
  const first = document.body.dataset.sky || "dusk";
  starfield.jump(first);
  showSky(first);
  markNav(location.pathname);
})();
