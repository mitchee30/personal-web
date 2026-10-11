/* Wenbo Zhi — page extras
   - click-to-play live demos (iframes load only when asked)
   - DeployGuard terminal: replays output trimmed from a real run
   - a short opening moment on the first visit of a session
   - "Wenbo's desk" live reading from a Raspberry Pi Pico W (hidden until set up)
   - résumé button and photo, each shown only once the file exists
   Re-runs whenever the page content is swapped in place.                    */
(function () {
  "use strict";

  /* Set this to the Adafruit IO "last value" URL of the desk sensor feed,
     e.g. "https://io.adafruit.com/api/v2/YOUR_USERNAME/feeds/desk-temp/data/last".
     See hardware/desk-sensor/README.md. Empty = the widget stays hidden. */
  const SENSOR_URL = "";

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function t2(en, zh) { return '<span class="en">' + en + '</span><span class="zh">' + zh + "</span>"; }

  /* ---------------- opening moment (once per session) ---------------- */
  (function intro() {
    let seen = false;
    try { seen = sessionStorage.getItem("wz-intro") === "1"; sessionStorage.setItem("wz-intro", "1"); } catch (e) { seen = true; }
    if (seen || reduce) return;
    const el = document.createElement("div");
    el.className = "intro";
    el.setAttribute("aria-hidden", "true");
    el.innerHTML = '<div class="intro-name">Wenbo Zhi</div><div class="intro-sub">' + t2("painting the sky", "正在画天空") + "</div>";
    document.body.appendChild(el);
    document.body.classList.add("intro-on");
    setTimeout(function () { el.classList.add("out"); document.body.classList.remove("intro-on"); }, 1500);
    setTimeout(function () { el.remove(); }, 2400);
  })();

  /* ---------------- live demos ---------------- */
  function initDemos(root) {
    root.querySelectorAll(".demo").forEach(function (box) {
      const btn = box.querySelector(".demo-play");
      if (!btn || btn.dataset.ready) return;
      btn.dataset.ready = "1";
      btn.addEventListener("click", function () {
        const f = document.createElement("iframe");
        f.src = box.dataset.src;
        f.title = box.dataset.title || "Live demo";
        f.loading = "lazy";
        f.setAttribute("allow", "autoplay");
        box.querySelector(".demo-stage").replaceChildren(f);
        box.classList.add("playing");
      });
    });
  }

  /* ---------------- DeployGuard terminal replay ---------------- */
  const RUN = [
    ["cmd", "$ ./build/deploy-cli --config deploy.yaml", 500],
    ["info", "[INFO]    Successfully loaded configuration from deploy.yaml", 350],
    ["info", "[INFO]    Initiating deployment state machine for target: ./test_app_target", 450],
    ["out", "[deploy.sh] 🚀 Starting deployment to target: ./test_app_target", 350],
    ["out", "[deploy.sh] 📦 Creating persistent backup of v1.0", 450],
    ["out", "[deploy.sh] ⚙️ Overwriting installation with new v2.0 files...", 600],
    ["out", "[deploy.sh] 🔍 Initiating post-deployment health checks...", 700],
    ["bad", "[v2.0] ❌ FATAL ERROR: Database schema mismatch! (Column 'avatar_url' is missing in table 'users')", 500],
    ["bad", "[deploy.sh] ❌ Post-deployment health check failed with exit code 1!", 450],
    ["err", "[ERROR]   Deployment script exited with non-zero status: 1", 400],
    ["warn", "[WARN]    Halting deployment and triggering automatic rollback...", 600],
    ["out", "[rollback.sh] ♻️ Restoring backup files...", 600],
    ["out", "[rollback.sh] 🔍 Verifying restored application...", 500],
    ["good", "   🟢 MyWebservice App - Version 1.0   Status: Running stable   Port: 8080", 500],
    ["out", "[rollback.sh] ✅ Rollback successfully completed. Version 1.0 is active and healthy.", 450],
    ["ok", "[SUCCESS] System successfully rolled back to a stable state.", 0]
  ];
  function initTerminals(root) {
    root.querySelectorAll(".term").forEach(function (term) {
      if (term.dataset.ready) return;
      term.dataset.ready = "1";
      const body = term.querySelector(".term-body");
      const again = term.querySelector(".term-replay");
      let timer = 0, run = 0;
      function play() {
        const id = ++run;
        clearTimeout(timer);
        body.textContent = "";
        if (again) again.hidden = true;
        let i = 0;
        (function next() {
          if (id !== run) return;
          if (i >= RUN.length) { if (again) again.hidden = false; return; }
          const line = document.createElement("div");
          line.className = "tl " + RUN[i][0];
          line.textContent = RUN[i][1];
          body.appendChild(line);
          body.scrollTop = body.scrollHeight;
          timer = setTimeout(next, reduce ? 0 : RUN[i][2]);
          i++;
        })();
      }
      if (again) again.addEventListener("click", play);
      if ("IntersectionObserver" in window) {
        const io = new IntersectionObserver(function (es) {
          if (es.some(function (e) { return e.isIntersecting; })) { io.disconnect(); play(); }
        }, { threshold: 0.4 });
        io.observe(term);
      } else play();
    });
  }

  /* ---------------- files that may not be uploaded yet ---------------- */
  const exists = {};
  function fileExists(url) {
    if (!(url in exists)) {
      exists[url] = fetch(url, { method: "HEAD", cache: "no-store" }).then(function (r) { return r.ok; }).catch(function () { return false; });
    }
    return exists[url];
  }
  function initFiles(root) {
    root.querySelectorAll("[data-needs-file]").forEach(function (el) {
      fileExists(el.getAttribute("data-needs-file")).then(function (ok) { el.hidden = !ok; });
    });
  }

  /* ---------------- Wenbo's desk, live from a Pico W ---------------- */
  function ago(ms) {
    const m = Math.round(ms / 60000);
    if (m < 1) return t2("just now", "刚刚");
    if (m < 60) return t2(m + " min ago", m + " 分钟前");
    const h = Math.round(m / 60);
    if (h < 48) return t2(h + " h ago", h + " 小时前");
    return t2(Math.round(h / 24) + " days ago", Math.round(h / 24) + " 天前");
  }
  function initDesk(root) {
    const el = root.querySelector("#desk");
    if (!el) return;
    if (!SENSOR_URL) { el.hidden = true; return; }
    fetch(SENSOR_URL, { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (!d || d.value == null) { el.hidden = true; return; }
      const age = Date.now() - new Date(d.created_at).getTime();
      const temp = parseFloat(d.value).toFixed(1);
      el.innerHTML = age < 30 * 60000
        ? '<span class="dot live"></span>' + t2("Wenbo's desk right now: ", "Wenbo 的书桌此刻：") + "<b>" + temp + "°C</b> · " + ago(age)
        : '<span class="dot"></span>' + t2("Wenbo's desk sensor is asleep. Last reading ", "书桌传感器在睡觉，最后一次读数 ") + "<b>" + temp + "°C</b>, " + ago(age);
      el.title = "Live from a Raspberry Pi Pico W on my desk";
      el.hidden = false;
    }).catch(function () { el.hidden = true; });
  }

  function init(root) { initDemos(root); initTerminals(root); initFiles(root); initDesk(root); }
  init(document);

  // site.js swaps the <main> content in place when you change pages
  const main = document.querySelector("main");
  if (main && "MutationObserver" in window) {
    new MutationObserver(function () { init(main); }).observe(main, { childList: true });
  }
})();
