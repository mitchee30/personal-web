/* Wenbo Zhi — shared site script
   - language switch (EN / 中文), remembered per visitor
   - tells assets/scenes.js which painted scene to show
   - background music that keeps playing between pages
   - in-place page switching so the music never restarts            */
(function () {
  "use strict";

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

  /* ---------------- painted background (assets/scenes.js) ---------------- */
  function showSky(name) {
    document.body.dataset.sky = name;
    if (window.Scenes) window.Scenes.show(name);
  }

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
  showSky(first);
  markNav(location.pathname);
})();
