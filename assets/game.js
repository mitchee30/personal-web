/* Wenbo Zhi — hidden secrets
   One small thing to find in each painted scene. Progress is kept in this
   browser only. Loaded by assets/scenes.js, which calls Game.draw() every
   frame and Game.click() on every click in the scenery.
     dusk    catch 3 fish jumping out of the lake
     day     shoo the 3 birds off the power line
     sunset  click the hot-air balloon drifting over the clouds
     night   catch 5 golden wishing stars
     dawn    collect 8 golden petals                                       */
(function () {
  "use strict";

  const SECRETS = [
    { id: "dusk", goal: 3, name: ["Gone fishing", "钓鱼高手"], hint: ["Something keeps jumping in the lake at dusk.", "黄昏的湖里，好像有什么在跳。"], unit: ["fish", "条鱼"] },
    { id: "day", goal: 3, name: ["Bird whisperer", "惊飞小鸟"], hint: ["The birds on the power line are a little shy.", "电线上的小鸟有点怕生。"], unit: ["birds", "只鸟"] },
    { id: "sunset", goal: 1, name: ["Balloon mail", "热气球来信"], hint: ["Something floats above the sea of clouds.", "云海上飘着什么东西。"], unit: ["", ""] },
    { id: "night", goal: 5, name: ["Wish upon a star", "流星许愿"], hint: ["Some falling stars are golden. Catch them.", "有些流星是金色的，试着接住它。"], unit: ["stars", "颗星"] },
    { id: "dawn", goal: 8, name: ["Petal collector", "花瓣收集者"], hint: ["A few petals in the wind are golden.", "风里有几片金色的花瓣。"], unit: ["petals", "片花瓣"] }
  ];
  const KEY = "wz-secrets";
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(found)); } catch (e) {} }
  let found = load();
  const count = {}; // progress within the current visit

  function t2(en, zh) { return '<span class="en">' + en + '</span><span class="zh">' + zh + "</span>"; }
  function total() { return SECRETS.filter(function (s) { return found[s.id]; }).length; }

  /* ---------------- styles ---------------- */
  const css = document.createElement("style");
  css.textContent = [
    ".secret-btn{font-variant-numeric:tabular-nums;}",
    ".secret-btn.all{background:linear-gradient(135deg,#fff3c4,#ffd1e4);}",
    ".secret-pop{position:absolute; top:62px; right:clamp(16px,4vw,40px); width:min(320px,calc(100vw - 32px)); padding:1rem 1.1rem;",
    " border-radius:20px; background:var(--paper-solid); color:var(--ink); box-shadow:var(--shadow); display:none; font-size:.92rem; line-height:1.5;}",
    ".secret-pop.show{display:block;}",
    ".secret-pop h3{font-size:1rem; margin-bottom:.15rem;}",
    ".secret-pop ul{list-style:none; margin:.7rem 0 .4rem; display:flex; flex-direction:column; gap:.55rem;}",
    ".secret-pop li{display:flex; gap:.6rem; align-items:flex-start;}",
    ".secret-pop .mark{flex:none; width:22px; height:22px; border-radius:50%; display:grid; place-items:center; font-size:.75rem; background:#f1ecfb; color:#8b80b8;}",
    ".secret-pop li.got .mark{background:#ffe08a; color:#7a4b00;}",
    ".secret-pop li .nm{font-weight:700;}",
    ".secret-pop li .hn{color:var(--ink-soft);}",
    ".secret-pop .reset{border:0; background:none; color:var(--violet); font:inherit; font-size:.82rem; cursor:pointer; padding:0; text-decoration:underline;}",
    ".toast-wrap{position:fixed; left:50%; bottom:22px; transform:translateX(-50%); z-index:60; display:flex; flex-direction:column; gap:.5rem; align-items:center; pointer-events:none;}",
    ".toast{padding:.6rem 1.1rem; border-radius:999px; background:rgba(255,250,253,.95); color:var(--ink); font-weight:700; font-size:.92rem;",
    " box-shadow:0 10px 30px -10px rgba(40,20,90,.6); animation:toastIn .35s ease-out; white-space:nowrap;}",
    ".toast.big{background:linear-gradient(135deg,#fff3c4,#ffd1e4);}",
    "@keyframes toastIn{from{opacity:0; transform:translateY(12px) scale(.96);} to{opacity:1; transform:none;}}",
    ".finale{position:fixed; inset:0; z-index:70; display:grid; place-items:center; background:rgba(30,16,70,.45); padding:16px;}",
    ".finale .card{max-width:420px; padding:2rem 1.8rem; border-radius:28px; text-align:center; background:var(--paper-solid); box-shadow:var(--shadow); animation:toastIn .45s ease-out;}",
    ".finale .big-star{font-size:2.6rem; line-height:1;}",
    ".finale h2{font-family:var(--display-en); font-weight:600; font-size:1.6rem; margin:.6rem 0 .5rem;}",
    "html[data-lang='zh'] .finale h2{font-family:var(--display-zh); font-weight:400; letter-spacing:1px;}",
    ".finale p{color:var(--ink-soft);}",
    ".finale .row{display:flex; gap:.6rem; justify-content:center; margin-top:1.3rem; flex-wrap:wrap;}",
    ".finale .btn.ghost{background:#f3eefe; color:var(--ink); backdrop-filter:none;}",
    "@media (max-width:860px){.secret-pop{top:104px;}}"
  ].join("\n");
  document.head.appendChild(css);

  /* ---------------- badge, list, toasts ---------------- */
  const tools = document.querySelector(".tools");
  const btn = document.createElement("button");
  btn.type = "button"; btn.className = "pill secret-btn";
  btn.setAttribute("aria-expanded", "false");
  const pop = document.createElement("div");
  pop.className = "secret-pop"; pop.setAttribute("role", "dialog");
  const toasts = document.createElement("div");
  toasts.className = "toast-wrap"; toasts.setAttribute("role", "status"); toasts.setAttribute("aria-live", "polite");
  document.body.appendChild(toasts);
  if (tools) { tools.insertBefore(btn, tools.firstChild); tools.parentNode.appendChild(pop); }

  function renderBadge() {
    const n = total();
    btn.innerHTML = "✦ " + n + "/" + SECRETS.length;
    btn.classList.toggle("all", n === SECRETS.length);
    btn.setAttribute("aria-label", "Secrets found: " + n + " of " + SECRETS.length);
  }
  function renderList() {
    pop.innerHTML =
      "<h3>" + t2("Hidden secrets", "隐藏彩蛋") + "</h3>" +
      '<div class="hn" style="color:var(--ink-soft)">' + t2("Each page's scenery hides one. Click around.", "每个页面的风景里都藏着一个，四处点点看。") + "</div>" +
      "<ul>" + SECRETS.map(function (s) {
        const got = !!found[s.id];
        return '<li class="' + (got ? "got" : "") + '"><span class="mark">' + (got ? "✦" : "?") + "</span><span>" +
          '<span class="nm">' + (got ? t2(s.name[0], s.name[1]) : "???") + "</span><br>" +
          '<span class="hn">' + t2(s.hint[0], s.hint[1]) + "</span></span></li>";
      }).join("") + "</ul>" +
      '<button class="reset" type="button">' + t2("Start over", "重新开始") + "</button>";
  }
  btn.addEventListener("click", function () {
    const open = !pop.classList.contains("show");
    if (open) renderList();
    pop.classList.toggle("show", open);
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  });
  pop.addEventListener("click", function (e) {
    if (e.target.closest(".reset")) { found = {}; save(); renderBadge(); renderList(); }
  });
  document.addEventListener("click", function (e) {
    if (pop.classList.contains("show") && !e.target.closest(".secret-pop, .secret-btn")) {
      pop.classList.remove("show"); btn.setAttribute("aria-expanded", "false");
    }
  });
  function toast(html, big) {
    const el = document.createElement("div");
    el.className = "toast" + (big ? " big" : "");
    el.innerHTML = html;
    toasts.appendChild(el);
    setTimeout(function () { el.remove(); }, big ? 4200 : 2200);
  }

  function progress(id) {
    const s = SECRETS.find(function (q) { return q.id === id; });
    count[id] = (count[id] || 0) + 1;
    if (found[id]) { toast("✦ " + count[id]); return; }
    if (count[id] < s.goal) { toast(count[id] + " / " + s.goal + " " + t2(s.unit[0], s.unit[1])); return; }
    found[id] = true; save(); renderBadge();
    toast("✦ " + t2("Secret found: ", "发现彩蛋：") + t2(s.name[0], s.name[1]) + " (" + total() + "/" + SECRETS.length + ")", true);
    if (total() === SECRETS.length) setTimeout(finale, 1200);
  }

  function finale() {
    const wrap = document.createElement("div");
    wrap.className = "finale";
    wrap.innerHTML = '<div class="card" role="dialog" aria-modal="true">' +
      '<div class="big-star">✦</div>' +
      "<h2>" + t2("You found every secret!", "五个彩蛋全部找到！") + "</h2>" +
      "<p>" + t2("Thanks for exploring my little world. If you liked poking around here, you'll probably like working with me too.",
                 "谢谢你把这个小世界逛了个遍。喜欢这里的话，和我一起做项目应该也会喜欢。") + "</p>" +
      '<div class="row"><a class="btn" href="contact.html">' + t2("Say hi", "联系我") + "</a>" +
      '<button class="btn ghost" type="button">' + t2("Keep exploring", "继续逛逛") + "</button></div></div>";
    document.body.appendChild(wrap);
    wrap.addEventListener("click", function (e) {
      if (e.target === wrap || e.target.closest("button, a")) wrap.remove();
    });
  }

  /* ---------------- things to find ----------------
     Drawn on their own layer above the page content so they are never hidden
     behind a card. On wide screens they stay in the open scenery beside the
     content column; on narrow screens they use the whole width. */
  const M = 70;
  const layerEl = document.createElement("canvas");
  layerEl.setAttribute("aria-hidden", "true");
  layerEl.style.cssText = "position:fixed;inset:0;width:100%;height:100%;z-index:15;pointer-events:none;";
  document.body.appendChild(layerEl);
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const lctx = layerEl.getContext("2d");
  let LW = 0, LH = 0;
  function sizeLayer(W, H) {
    if (W === LW && H === LH) return;
    LW = W; LH = H;
    layerEl.width = Math.ceil(W * DPR); layerEl.height = Math.ceil(H * DPR);
    lctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    zone = null;
  }
  // the open strip of scenery beside the content column: [lo, hi] in px
  let zone = null;
  function freeZone(W) {
    if (zone) return zone;
    const m = document.querySelector("main");
    let lo = W * 0.08, hi = W * 0.92;
    if (m) {
      const r = m.getBoundingClientRect(), pad = parseFloat(getComputedStyle(m).paddingLeft) || 16;
      const right = [r.right - pad + 18, W - 18], left = [18, r.left + pad - 18];
      if (right[1] - right[0] >= 90) { lo = right[0]; hi = right[1]; }
      else if (left[1] - left[0] >= 90) { lo = left[0]; hi = left[1]; }
    }
    zone = { lo: lo, hi: hi, w: hi - lo };
    return zone;
  }
  window.addEventListener("resize", function () { zone = null; S.day.birds = null; });

  const S = {
    dusk: { fish: null, next: 2 },
    day: { birds: null },
    sunset: { gone: false, lift: 0 },
    night: { stars: [], next: 2 },
    dawn: { petals: [] }
  };
  let targets = [];

  function glow(ctx, x, y, r, rgb, a) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(" + rgb + "," + a + ")"); g.addColorStop(1, "rgba(" + rgb + ",0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  function rand(a, b) { return a + Math.random() * (b - a); }
  // true when nothing clickable sits at this point of the screen
  function clear(x, y) {
    const el = document.elementFromPoint(x, y);
    return !el || !el.closest("a, button, input, textarea, .secret-pop");
  }

  const draw = {
    dusk: function (ctx, t, dt, P, W, H) {
      const st = S.dusk, hz = H * 0.66, z = freeZone(W);
      if (!st.fish) {
        st.next -= dt;
        if (st.next <= 0) {
          const lo = z.lo, hi = Math.max(z.lo + 1, z.hi - 70);
          // pick a spot where the whole jump stays clear of links and buttons
          for (let k = 0; k < 14 && !st.fish; k++) {
            const x = rand(lo, hi), y0 = rand(hz + 26, Math.min(H * 0.92, hz + H * 0.24));
            if (clear(x, y0) && clear(x + 35, y0 - 95) && clear(x + 70, y0)) st.fish = { x: x, y0: y0, t: 0, dur: 1.6 };
          }
          st.next = rand(2, 4.5);
        }
        return [];
      }
      const f = st.fish;
      f.t += dt;
      const p = f.t / f.dur;
      if (p >= 1) { st.fish = null; return []; }
      const x = f.x + p * 70, y = f.y0 - Math.sin(Math.PI * p) * 95;
      const ang = Math.atan2(-Math.cos(Math.PI * p) * 95 * Math.PI, 70);
      if (p < 0.1 || p > 0.9) { ctx.strokeStyle = "rgba(255,225,240,.75)"; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(f.x + (p > 0.5 ? 70 : 0), f.y0, 16, 4, 0, 0, Math.PI * 2); ctx.stroke(); }
      for (let i = 1; i < 4; i++) { const q = Math.max(0, p - i * 0.04); ctx.fillStyle = "rgba(255,230,240," + (0.5 - i * 0.12) + ")"; ctx.beginPath(); ctx.arc(f.x + q * 70, f.y0 - Math.sin(Math.PI * q) * 95, 1.6, 0, Math.PI * 2); ctx.fill(); }
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
      ctx.fillStyle = "#2b1d5e";
      ctx.beginPath(); ctx.ellipse(0, 0, 15, 6.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(-22, -7); ctx.lineTo(-22, 7); ctx.fill();
      ctx.fillStyle = "rgba(255,200,170,.85)"; ctx.beginPath(); ctx.ellipse(2, -3, 8, 1.6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(9, -1.5, 1.6, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      return [{ x: x, y: y, r: 36, hit: function () { st.fish = null; progress("dusk"); } }];
    },

    day: function (ctx, t, dt, P, W, H) {
      const st = S.day, z = freeZone(W);
      // the top wire from assets/scenes.js, in screen space (a straight-line
      // quadratic in x, so its height at any x is easy to find)
      const ox = -P.ex * 1.15 * M * 0.85, oy = -P.ey * 1.15 * M * 0.45;
      const x0 = W * 0.1 - 40, x1 = W + M, y0 = H * 0.42 + 16, yc = y0 + 120, y1 = y0 + 10;
      function wireY(x) { const u = Math.max(0, Math.min(1, (x - x0) / (x1 - x0))); return (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * yc + u * u * y1; }
      if (!st.birds) {
        const span = Math.min(z.w - 20, 90), start = z.lo + (z.w - span) / 2;
        st.birds = [0, 1, 2].map(function (i) {
          const x = start + (span * i) / 2;
          return { x: x, y: wireY(x), fly: false, fx: 0, fy: 0, vx: 0, vy: 0, ph: Math.random() * 6 };
        });
      }
      const out = [];
      ctx.fillStyle = "#1a2846"; ctx.strokeStyle = "#1a2846"; ctx.lineWidth = 2; ctx.lineCap = "round";
      st.birds.forEach(function (b) {
        if (!b.fly) {
          const x = b.x + ox, y = b.y + oy, hop = Math.sin(t * 2 + b.ph * 3) > 0.97 ? -2 : 0;
          ctx.beginPath(); ctx.ellipse(x, y - 5 + hop, 6, 4.5, 0, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(x + 5, y - 10 + hop, 3.4, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.moveTo(x + 8, y - 10 + hop); ctx.lineTo(x + 11, y - 9 + hop); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x - 5, y - 4 + hop); ctx.lineTo(x - 10, y - 2 + hop); ctx.stroke();
          out.push({ x: x, y: y - 7, r: 22, hit: function () { b.fly = true; b.fx = x; b.fy = y - 7; b.vx = rand(150, 230); b.vy = rand(-200, -140); progress("day"); } });
        } else if (b.fy > -40 && b.fx < W + 40) {
          b.fx += b.vx * dt; b.fy += b.vy * dt; b.vy -= 20 * dt;
          const flap = Math.sin(t * 22 + b.ph) * 7;
          ctx.beginPath(); ctx.moveTo(b.fx - 9, b.fy - flap); ctx.quadraticCurveTo(b.fx - 3, b.fy - 2, b.fx, b.fy);
          ctx.quadraticCurveTo(b.fx + 3, b.fy - 2, b.fx + 9, b.fy - flap); ctx.stroke();
        }
      });
      return out;
    },

    sunset: function (ctx, t, dt, P, W, H) {
      const st = S.sunset, z = freeZone(W);
      if (st.gone) { st.lift += dt * 70; if (st.lift > H) { st.gone = false; st.lift = 0; } }
      const x = z.lo + z.w / 2 + Math.sin(t * 0.25) * Math.max(0, z.w / 2 - 34);
      const y = H * 0.3 + Math.sin(t * 0.6) * 14 - st.lift;
      if (y < -70) return [];
      const r = 22;
      ctx.save(); ctx.translate(x, y);
      const g = ctx.createRadialGradient(-7, -8, 2, 0, 0, r * 1.3);
      g.addColorStop(0, "#fff4e4"); g.addColorStop(1, "#f08aac");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(0, r * 1.25); ctx.bezierCurveTo(-r * 1.3, r * 0.2, -r * 1.05, -r * 1.15, 0, -r * 1.15);
      ctx.bezierCurveTo(r * 1.05, -r * 1.15, r * 1.3, r * 0.2, 0, r * 1.25); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.75)"; ctx.lineWidth = 1.5;
      [-0.45, 0, 0.45].forEach(function (k) { ctx.beginPath(); ctx.moveTo(0, -r * 1.15); ctx.quadraticCurveTo(k * r * 1.6, 0, 0, r * 1.2); ctx.stroke(); });
      ctx.strokeStyle = "#5a3c6e"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-6, r * 1.1); ctx.lineTo(-5, r * 1.65); ctx.moveTo(6, r * 1.1); ctx.lineTo(5, r * 1.65); ctx.stroke();
      ctx.fillStyle = "#7a4a3a"; ctx.fillRect(-7, r * 1.65, 14, 9);
      if (!st.gone) { ctx.fillStyle = "#fff"; ctx.fillRect(-3, r * 1.65 - 6, 7, 5); } // a letter peeking out
      ctx.restore();
      if (st.gone) return [];
      return [{ x: x, y: y + 6, r: 38, hit: function () {
        st.gone = true; st.lift = 0; progress("sunset");
        toast("✉ " + t2("“Thanks for reading this far. Hope we work together soon!”", "「谢谢你看到这里，希望很快能一起共事！」"));
      } }];
    },

    night: function (ctx, t, dt, P, W, H) {
      const st = S.night, z = freeZone(W);
      st.next -= dt;
      if (st.next <= 0 && st.stars.length < 2) {
        st.stars.push({ x: rand(z.lo + 20, z.hi), y: -20, vx: rand(-14, -6), vy: rand(80, 110), ph: Math.random() * 6 });
        st.next = rand(2, 4);
      }
      const out = [];
      for (let i = st.stars.length - 1; i >= 0; i--) {
        const s = st.stars[i];
        s.x += s.vx * dt; s.y += s.vy * dt;
        if (s.y > H * 0.9) { st.stars.splice(i, 1); continue; }
        const g = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * 0.8, s.y - s.vy * 0.8);
        g.addColorStop(0, "rgba(255,214,110,.85)"); g.addColorStop(1, "rgba(255,214,110,0)");
        ctx.strokeStyle = g; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - s.vx * 0.8, s.y - s.vy * 0.8); ctx.stroke();
        glow(ctx, s.x, s.y, 26, "255,214,110", 0.55);
        const rr = 9 + Math.sin(t * 6 + s.ph) * 1.5;
        ctx.fillStyle = "#fff3c4";
        ctx.beginPath(); ctx.moveTo(s.x, s.y - rr); ctx.quadraticCurveTo(s.x, s.y, s.x + rr, s.y); ctx.quadraticCurveTo(s.x, s.y, s.x, s.y + rr);
        ctx.quadraticCurveTo(s.x, s.y, s.x - rr, s.y); ctx.quadraticCurveTo(s.x, s.y, s.x, s.y - rr); ctx.fill();
        out.push({ x: s.x, y: s.y, r: 34, hit: function () { const k = st.stars.indexOf(s); if (k >= 0) st.stars.splice(k, 1); progress("night"); } });
      }
      return out;
    },

    dawn: function (ctx, t, dt, P, W, H) {
      const st = S.dawn, z = freeZone(W);
      function fresh(top) { return { x: rand(z.lo + 10, z.hi), y: top ? -20 : rand(-H * 0.5, -20), vx: rand(-10, -4), vy: rand(32, 48), r: Math.random() * 6, ph: Math.random() * 6 }; }
      while (st.petals.length < 3) st.petals.push(fresh(false));
      const out = [];
      st.petals.forEach(function (p, i) {
        p.x += (p.vx + Math.sin(t * 1.2 + p.ph) * 18) * dt; p.y += p.vy * dt; p.r += dt * 1.4;
        if (p.y > H + 20) { st.petals[i] = fresh(true); return; }
        glow(ctx, p.x, p.y, 20, "255,214,110", 0.45);
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.scale(1, 0.6 + 0.4 * Math.sin(t * 2 + p.ph));
        ctx.fillStyle = "#ffd36e"; ctx.beginPath(); ctx.ellipse(0, 0, 9, 6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#fff6d8"; ctx.beginPath(); ctx.ellipse(-2.5, -1.5, 4, 2.4, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        out.push({ x: p.x, y: p.y, r: 26, hit: function () { const k = st.petals.indexOf(p); if (k >= 0) st.petals.splice(k, 1); progress("dawn"); } });
      });
      return out;
    }
  };

  function nearest(x, y) {
    let best = null, bd = Infinity;
    targets.forEach(function (q) { const d = Math.hypot(x - q.x, y - q.y); if (d < q.r && d < bd) { bd = d; best = q; } });
    return best;
  }

  window.Game = {
    // called by scenes.js once per frame for the visible scene
    draw: function (ctx, name, t, dt, P, W, H) {
      sizeLayer(W, H);
      lctx.clearRect(0, 0, W, H);
      targets = draw[name] ? draw[name](lctx, t, dt, P, W, H) : [];
      const want = P.inside && nearest(P.x, P.y) ? "pointer" : "";
      if (document.documentElement.style.cursor !== want) document.documentElement.style.cursor = want;
    },
    // called by scenes.js on a click; true if it caught something
    click: function (x, y) {
      const q = nearest(x, y);
      if (!q) return false;
      targets.splice(targets.indexOf(q), 1);
      q.hit();
      return true;
    },
    // where the findable things are right now (handy for testing)
    peek: function () { return targets.map(function (q) { return { x: q.x, y: q.y }; }); }
  };
  renderBadge();
})();
