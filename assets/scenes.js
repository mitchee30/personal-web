/* Wenbo Zhi — painted backgrounds
   Five original scenes, one per page, all drawn in code:
     dusk    home        a lake at magic hour; ripples follow the cursor
     day     about       towering summer clouds over a city; the sun follows the cursor
     sunset  experience  a sea of clouds at sunset; light rays and birds follow the cursor
     night   projects    the Milky Way; stars link up around the cursor, click for a meteor
     dawn    contact     a cherry-blossom hill; the cursor blows the petals around
   Every scene is split into layers that shift with the mouse (parallax).
   Exposes window.Scenes.show(name).                                        */
(function () {
  "use strict";

  const host = document.getElementById("bg");
  if (!host) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  let S = Math.min(window.devicePixelRatio || 1, 1.5);   // render scale (lowered on slow machines)
  const M = 70;                                            // parallax margin (px)
  let W = innerWidth, H = innerHeight;

  /* ---------------- helpers ---------------- */
  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function canvas(w, h) {
    const c = document.createElement("canvas");
    c.width = Math.ceil(w * S); c.height = Math.ceil(h * S);
    const x = c.getContext("2d");
    x.setTransform(S, 0, 0, S, 0, 0);
    return [c, x];
  }
  // a full-size layer with the parallax margin on every side; draw() gets
  // (ctx, w, h, o) where o is the margin offset so (o, o) is the screen's top-left
  function layer(depth, draw) {
    const [c, x] = canvas(W + 2 * M, H + 2 * M);
    draw(x, W, H, M);
    return { c: c, depth: depth };
  }
  function lin(ctx, x0, y0, x1, y1, stops) {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    stops.forEach(function (s) { g.addColorStop(s[0], s[1]); });
    return g;
  }
  function rgba(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
  }
  function glow(ctx, x, y, r, color, a) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba(color, a));
    g.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }

  /* An anime-style cumulus. The puffs are merged into one silhouette, then the
     whole mass is shaded: a broad gradient from the lit side to the shadow side,
     soft highlights on each puff's lit face, a little occlusion where puffs
     overlap, and a bright rim along the edge that faces the light. */
  function cloud(ctx, R, cx, cy, w, h, pal, opt) {
    opt = opt || {};
    const lx = opt.lx == null ? -0.4 : opt.lx;
    const ly = opt.ly == null ? -0.7 : opt.ly;
    const n = opt.n || Math.max(14, Math.round((w / h) * 22));
    const puffs = [];
    for (let i = 0; i < n; i++) {
      const u = R() * 2 - 1;
      const dome = Math.max(0, 1 - u * u);
      const px = cx + (u * w) / 2;
      const py = cy - Math.pow(R(), 0.7) * h * dome * 0.78;
      const r = h * (0.06 + 0.13 * R()) * (0.5 + 0.9 * dome);
      puffs.push([px, py, r]);
    }
    puffs.sort(function (a, b) { return b[1] - a[1]; });
    const shape = new Path2D();
    if (!opt.noBase) shape.ellipse(cx, cy - h * 0.04, w * 0.47, h * 0.1, 0, 0, Math.PI * 2);
    puffs.forEach(function (p) { shape.moveTo(p[0] + p[2], p[1]); shape.arc(p[0], p[1], p[2], 0, Math.PI * 2); });
    const top = cy - h, L = Math.hypot(lx, ly) || 1, ux = lx / L, uy = ly / L;
    ctx.save();
    ctx.fillStyle = pal.mid;
    ctx.fill(shape);
    ctx.clip(shape);
    // broad light-to-shadow gradient across the whole cloud
    const gx0 = cx + ux * w * 0.5, gy0 = cy - h * 0.5 + uy * h * 0.6;
    const gx1 = cx - ux * w * 0.5, gy1 = cy - h * 0.5 - uy * h * 0.6;
    ctx.fillStyle = lin(ctx, gx0, gy0, gx1, gy1, [[0, pal.light], [0.45, rgba(pal.lightHex || "#ffffff", 0)], [1, pal.shadow]]);
    ctx.globalAlpha = 0.85;
    ctx.fillRect(cx - w, top - h * 0.2, w * 2, h * 1.5);
    ctx.globalAlpha = 1;
    // per-puff: a soft shadow where the puff sits on the one behind it, then its lit face
    puffs.forEach(function (p) {
      const so = ctx.createRadialGradient(p[0] - ux * p[2] * 0.2, p[1] - uy * p[2] * 0.2, p[2] * 0.7, p[0], p[1], p[2] * 1.18);
      so.addColorStop(0, rgba(pal.shadowHex, 0));
      so.addColorStop(0.6, rgba(pal.shadowHex, 0.13));
      so.addColorStop(1, rgba(pal.shadowHex, 0));
      ctx.fillStyle = so;
      ctx.beginPath(); ctx.arc(p[0], p[1], p[2] * 1.18, 0, Math.PI * 2); ctx.fill();
      const hi = ctx.createRadialGradient(p[0] + ux * p[2] * 0.35, p[1] + uy * p[2] * 0.35, 0, p[0] + ux * p[2] * 0.2, p[1] + uy * p[2] * 0.2, p[2] * 0.95);
      hi.addColorStop(0, rgba(pal.lightHex, 0.95));
      hi.addColorStop(0.55, rgba(pal.lightHex, 0.35));
      hi.addColorStop(1, rgba(pal.lightHex, 0));
      ctx.fillStyle = hi;
      ctx.beginPath(); ctx.arc(p[0], p[1], p[2], 0, Math.PI * 2); ctx.fill();
    });
    // darker underside
    ctx.fillStyle = lin(ctx, 0, cy - h * 0.35, 0, cy + h * 0.06, [[0, rgba(pal.shadowHex, 0)], [1, rgba(pal.shadowHex, uy < 0 ? 0.55 : 0.1)]]);
    ctx.fillRect(cx - w, cy - h * 0.35, w * 2, h * 0.5);
    ctx.restore();
    // rim light along the silhouette on the lit side
    if (pal.rim) {
      ctx.save();
      ctx.strokeStyle = pal.rim; ctx.lineWidth = 2;
      ctx.globalAlpha = 0.9;
      const a0 = Math.atan2(uy, ux);
      puffs.forEach(function (p) {
        // only arcs on the outer, lit edge: skip puffs buried inside the mass
        const ex = p[0] + Math.cos(a0) * p[2], ey = p[1] + Math.sin(a0) * p[2];
        let covered = false;
        for (let j = 0; j < puffs.length && !covered; j++) {
          const q = puffs[j];
          if (q !== p && Math.hypot(ex + ux * 3 - q[0], ey + uy * 3 - q[1]) < q[2] * 0.98) covered = true;
        }
        if (covered) return;
        ctx.beginPath(); ctx.arc(p[0], p[1], p[2] - 1, a0 - 0.55, a0 + 0.55); ctx.stroke();
      });
      ctx.restore();
    }
  }
  function P_(light, mid, shadow, rim) {
    return { light: light, mid: mid, shadow: shadow, lightHex: light, shadowHex: shadow, rim: rim };
  }
  /* A long, thin cloud streak: a scalloped edge on the side facing the light,
     a smoother edge on the other, tapered ends, shaded across its thickness. */
  function band(ctx, R, cx, cy, w, h, pal, opt) {
    opt = opt || {};
    const fromBelow = (opt.ly || -1) > 0;
    const th = h * 0.28;                     // thickness at the middle
    const x0 = cx - w / 2, x1 = cx + w / 2;
    const path = new Path2D();
    const bumps = [];
    // scalloped edge (top, or bottom when lit from below)
    let x = x0;
    path.moveTo(x0, cy);
    while (x < x1) {
      const f = (x - x0) / w, taper = Math.sin(Math.PI * f);
      const r = th * (0.35 + R() * 0.55) * (0.35 + taper * 0.75) + 2;
      const yy = cy - (fromBelow ? -1 : 1) * th * 0.25 * taper;
      if (fromBelow) path.arc(x + r, yy, r, Math.PI, 0, true); else path.arc(x + r, yy, r, Math.PI, 0);
      bumps.push([x + r, yy, r]);
      x += r * (1.4 + R() * 0.5);
    }
    // smooth edge back
    for (let i = 20; i >= 0; i--) {
      const f = i / 20, taper = Math.sin(Math.PI * f);
      path.lineTo(x0 + f * w, cy + (fromBelow ? -1 : 1) * th * 0.55 * taper + (R() - 0.5) * 2);
    }
    path.closePath();
    ctx.save();
    if ("filter" in ctx) ctx.filter = "blur(0.5px)";
    ctx.fillStyle = pal.mid; ctx.fill(path);
    ctx.filter = "none";
    ctx.clip(path);
    const g = fromBelow
      ? lin(ctx, 0, cy - th, 0, cy + th, [[0, rgba(pal.shadowHex, 0.85)], [0.55, rgba(pal.shadowHex, 0)], [1, rgba(pal.lightHex, 0.9)]])
      : lin(ctx, 0, cy - th, 0, cy + th, [[0, rgba(pal.lightHex, 0.95)], [0.45, rgba(pal.lightHex, 0)], [1, rgba(pal.shadowHex, 0.8)]]);
    ctx.fillStyle = g; ctx.fillRect(x0 - 10, cy - th * 2, w + 20, th * 4);
    bumps.forEach(function (b) {
      const hy = b[1] + (fromBelow ? b[2] * 0.35 : -b[2] * 0.35);
      const hi = ctx.createRadialGradient(b[0], hy, 0, b[0], hy, b[2] * 1.1);
      hi.addColorStop(0, rgba(pal.lightHex, 0.7)); hi.addColorStop(1, rgba(pal.lightHex, 0));
      ctx.fillStyle = hi; ctx.beginPath(); ctx.arc(b[0], hy, b[2] * 1.1, 0, Math.PI * 2); ctx.fill();
    });
    ctx.restore();
    if (pal.rim) {
      ctx.save(); ctx.strokeStyle = pal.rim; ctx.lineWidth = 1.4; ctx.globalAlpha = 0.8;
      bumps.forEach(function (b) {
        ctx.beginPath();
        if (fromBelow) ctx.arc(b[0], b[1], b[2] - 0.8, 0.35, Math.PI - 0.35); else ctx.arc(b[0], b[1], b[2] - 0.8, Math.PI + 0.35, -0.35);
        ctx.stroke();
      });
      ctx.restore();
    }
  }

  /* A sea of clouds seen from above: one continuous surface whose top edge is a
     row of rounded billows, lit on top and fading to shadow below. */
  function cloudSea(ctx, R, y, w, rMin, rMax, pal, sunX, bottom) {
    const path = new Path2D();
    const bumps = [];
    let x = -rMax;
    path.moveTo(x, bottom);
    path.lineTo(x, y);
    while (x < w + rMax) {
      const r = rMin + R() * (rMax - rMin);
      const yy = y + (R() - 0.5) * rMin * 0.9;
      path.arc(x + r, yy, r, Math.PI, 0);
      bumps.push([x + r, yy, r]);
      x += r * (1.5 + R() * 0.4);
    }
    path.lineTo(x, bottom); path.closePath();
    ctx.save();
    ctx.fillStyle = pal.mid; ctx.fill(path);
    ctx.clip(path);
    ctx.fillStyle = lin(ctx, 0, y - rMax, 0, y + rMax * 2.2, [[0, rgba(pal.lightHex, 0.9)], [0.35, rgba(pal.lightHex, 0)], [1, rgba(pal.shadowHex, 0.95)]]);
    ctx.fillRect(-rMax, y - rMax * 2, w + 2 * rMax, bottom - y + rMax * 2);
    bumps.forEach(function (b) {
      const lean = Math.max(-0.6, Math.min(0.6, (sunX - b[0]) / (w * 0.5)));
      // shadow tucked under each billow, then its lit crown
      const sh = ctx.createRadialGradient(b[0], b[1] + b[2] * 0.9, 0, b[0], b[1] + b[2] * 0.9, b[2] * 1.2);
      sh.addColorStop(0, rgba(pal.shadowHex, 0.35)); sh.addColorStop(1, rgba(pal.shadowHex, 0));
      ctx.fillStyle = sh; ctx.beginPath(); ctx.arc(b[0], b[1] + b[2] * 0.9, b[2] * 1.2, 0, Math.PI * 2); ctx.fill();
      const hx = b[0] + lean * b[2] * 0.6, hy = b[1] - b[2] * 0.45;
      const hi = ctx.createRadialGradient(hx, hy, 0, hx, hy, b[2] * 0.95);
      hi.addColorStop(0, rgba(pal.lightHex, 0.9)); hi.addColorStop(1, rgba(pal.lightHex, 0));
      ctx.fillStyle = hi; ctx.beginPath(); ctx.arc(hx, hy, b[2] * 0.95, 0, Math.PI * 2); ctx.fill();
    });
    ctx.restore();
    if (pal.rim) {
      ctx.save(); ctx.strokeStyle = pal.rim; ctx.lineWidth = 1.6;
      bumps.forEach(function (b) {
        const lean = (sunX - b[0]) > 0 ? 0.35 : -0.35;
        ctx.beginPath(); ctx.arc(b[0], b[1], b[2] - 1, -Math.PI / 2 + lean - 0.6, -Math.PI / 2 + lean + 0.6); ctx.stroke();
      });
      ctx.restore();
    }
  }
  function ridge(ctx, R, w, base, amp, step, color, fillTo) {
    const p1 = R() * 6, p2 = R() * 6, p3 = R() * 6;
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(0, fillTo);
    for (let x = 0; x <= w + step; x += step) {
      const y = base - amp * (0.55 * Math.sin((x / w) * 3.1 + p1) + 0.3 * Math.sin((x / w) * 7.3 + p2) + 0.15 * Math.sin((x / w) * 19 + p3)) - R() * amp * 0.12;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w + step, fillTo); ctx.closePath(); ctx.fill();
  }
  function pine(ctx, x, base, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x - h * 0.03, base - h * 0.15, h * 0.06, h * 0.2);
    for (let i = 0; i < 4; i++) {
      const top = base - h + i * h * 0.2, wide = h * (0.16 + i * 0.07);
      ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x - wide, top + h * 0.38); ctx.lineTo(x + wide, top + h * 0.38); ctx.closePath(); ctx.fill();
    }
  }
  function skyline(ctx, R, x0, x1, base, minH, maxH, color, win, winP) {
    let x = x0;
    while (x < x1) {
      const bw = 18 + R() * 46;
      let bh = minH + Math.pow(R(), 1.6) * (maxH - minH);
      if (R() < 0.08) bh *= 1.5;
      ctx.fillStyle = color;
      ctx.fillRect(x, base - bh, bw - 2, bh + 4);
      if (R() < 0.25) ctx.fillRect(x + bw * 0.45, base - bh - 14, 2, 14);      // antenna
      if (R() < 0.2) ctx.fillRect(x + bw * 0.2, base - bh - 7, bw * 0.3, 7);   // water tank
      if (win) {
        ctx.fillStyle = win;
        for (let wy = base - bh + 8; wy < base - 6; wy += 9) {
          for (let wx = x + 4; wx < x + bw - 8; wx += 7) {
            if (R() < winP) ctx.fillRect(wx, wy, 3, 4);
          }
        }
      }
      x += bw;
    }
  }
  function palm(ctx, x, base, h, lean, s, color) {
    const tx = x + lean, ty = base - h;
    ctx.strokeStyle = color; ctx.lineWidth = 6 * s; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(x, base + 2); ctx.quadraticCurveTo(x + lean * 0.2, base - h * 0.55, tx, ty); ctx.stroke();
    ctx.fillStyle = color;
    [-170, -140, -112, -72, -42, -12, 14, 164].forEach(function (deg, i) {
      const a = (deg * Math.PI) / 180, L = (50 + (i % 3) * 10) * s;
      const ex = tx + Math.cos(a) * L, ey = ty + Math.sin(a) * L * 0.55 + 18 * s;
      const mx = tx + Math.cos(a) * L * 0.5, my = ty + Math.sin(a) * L * 0.5 - 8 * s, w = 6 * s;
      ctx.beginPath(); ctx.moveTo(tx, ty);
      ctx.quadraticCurveTo(mx, my - w, ex, ey); ctx.quadraticCurveTo(mx, my + w, tx, ty); ctx.fill();
    });
  }
  function sparkleStar(ctx, x, y, r, a, color) {
    ctx.fillStyle = rgba(color, a);
    ctx.beginPath();
    ctx.moveTo(x, y - r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.quadraticCurveTo(x, y, x, y + r);
    ctx.quadraticCurveTo(x, y, x - r, y); ctx.quadraticCurveTo(x, y, x, y - r); ctx.fill();
  }

  /* ---------------- pointer ---------------- */
  const P = { x: W / 2, y: H / 2, nx: 0, ny: 0, ex: 0, ey: 0, vx: 0, vy: 0, moved: 0, inside: false };
  window.addEventListener("pointermove", function (e) {
    P.vx = e.clientX - P.x; P.vy = e.clientY - P.y;
    P.x = e.clientX; P.y = e.clientY; P.inside = true;
    P.nx = (P.x / W) * 2 - 1; P.ny = (P.y / H) * 2 - 1;
    P.moved = performance.now();
    if (current) current.onMove && current.onMove(P);
    trail(P.x, P.y);
  }, { passive: true });
  document.addEventListener("pointerleave", function () { P.inside = false; });
  window.addEventListener("pointerdown", function (e) {
    if (e.target.closest("a, button, input, textarea, .secret-pop, .finale")) return;
    // hidden secrets (assets/game.js) float above the content, so they can be caught anywhere
    if (window.Game && window.Game.click(e.clientX, e.clientY)) { burst(e.clientX, e.clientY); return; }
    if (e.target.closest(".panel, .ticket")) return;
    burst(e.clientX, e.clientY);
    if (current && current.onClick) current.onClick(e.clientX, e.clientY);
  });

  /* sparkle trail behind the cursor, on every page */
  const sparks = [];
  let lastSpark = 0;
  function trail(x, y) {
    const now = performance.now();
    if (coarse || reduce || now - lastSpark < 28) return;
    lastSpark = now;
    sparks.push({ x: x + (Math.random() - 0.5) * 8, y: y + (Math.random() - 0.5) * 8, vx: (Math.random() - 0.5) * 0.4, vy: 0.3 + Math.random() * 0.5, life: 1, r: 3 + Math.random() * 4 });
    if (sparks.length > 60) sparks.shift();
  }
  function burst(x, y) {
    if (reduce) return;
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      sparks.push({ x: x, y: y, vx: Math.cos(a) * 2.4, vy: Math.sin(a) * 2.4, life: 1, r: 4 + Math.random() * 3 });
    }
  }
  function drawSparks(ctx, color, dt) {
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.x += s.vx * dt * 60; s.y += s.vy * dt * 60; s.vx *= 0.96; s.vy *= 0.96;
      s.life -= dt * 1.4;
      if (s.life <= 0) { sparks.splice(i, 1); continue; }
      glow(ctx, s.x, s.y, s.r * 3, color, 0.25 * s.life);
      sparkleStar(ctx, s.x, s.y, s.r * s.life + 1, 0.9 * s.life, "#ffffff");
    }
  }

  /* draw the prerendered layers with parallax */
  function drawLayers(ctx, layers, ex, ey) {
    layers.forEach(function (L) {
      ctx.drawImage(L.c, -M - ex * L.depth * M * 0.85, -M - ey * L.depth * M * 0.45, W + 2 * M, H + 2 * M);
    });
  }

  /* ======================================================================
     SCENES
     ====================================================================== */
  const SCENES = {};

  /* ---------- dusk: a lake at magic hour ---------- */
  SCENES.dusk = function () {
    const R = rng(11);
    const hz = H * 0.66;             // horizon
    const sunX = W * 0.62;
    const sky = layer(0.05, function (c, w, h, o) {
      c.fillStyle = lin(c, 0, o, 0, o + hz, [[0, "#191c58"], [0.32, "#463a98"], [0.6, "#b766a8"], [0.82, "#ff9c8c"], [1, "#ffd9a2"]]);
      c.fillRect(0, 0, w + 2 * o, o + hz + 2);
      glow(c, o + sunX, o + hz, Math.max(w, h) * 0.55, "#ffb38a", 0.55);
      glow(c, o + sunX, o + hz - 4, 90, "#fff1d0", 0.9);
      c.fillStyle = "#fff6e2"; c.beginPath(); c.arc(o + sunX, o + hz - 4, 22, Math.PI, 0); c.fill();
    });
    const pal = P_("#ffe3c2", "#f39cb2", "#5d4596", "rgba(255,240,220,.7)");
    const high = layer(0.18, function (c, w, h, o) {
      [[0.22, 0.09, 0.42], [0.74, 0.16, 0.5], [0.38, 0.26, 0.36], [0.86, 0.33, 0.3], [0.12, 0.38, 0.26]].forEach(function (q) {
        const cx = o + w * q[0];
        band(c, R, cx, o + h * q[1], w * q[2], 60 + R() * 40, pal, { lx: (sunX - cx + o) > 0 ? 0.5 : -0.5, ly: 0.75 });
      });
    });
    const low = layer(0.32, function (c, w, h, o) {
      const p2 = P_("#ffd6a2", "#ef8fa6", "#47387f", "rgba(255,230,190,.8)");
      cloud(c, R, o + w * 0.16, o + hz - 18, w * 0.36, h * 0.24, p2, { lx: 0.7, ly: 0.2 });
      cloud(c, R, o + w * 0.9, o + hz - 12, w * 0.3, h * 0.2, p2, { lx: -0.7, ly: 0.2 });
    });
    const far = layer(0.45, function (c, w, h, o) {
      ridge(c, R, w + 2 * o, o + hz + 4, 26, 12, "#3a2c6e", o + hz + 6);
    });
    // water: the sky and clouds mirrored below the horizon, darkened
    const water = layer(0.45, function (c, w, h, o) {
      c.save();
      c.beginPath(); c.rect(0, o + hz, w + 2 * o, h + o); c.clip();
      c.translate(0, (o + hz) * 2); c.scale(1, -1);
      c.globalAlpha = 0.75;
      c.drawImage(sky.c, 0, 0, w + 2 * o, h + 2 * o);
      c.drawImage(high.c, 0, 0, w + 2 * o, h + 2 * o);
      c.drawImage(low.c, 0, 0, w + 2 * o, h + 2 * o);
      c.restore();
      c.fillStyle = lin(c, 0, o + hz, 0, o + h, [[0, "rgba(40,24,90,.25)"], [1, "rgba(18,12,52,.8)"]]);
      c.fillRect(0, o + hz, w + 2 * o, h + o);
    });
    const shore = layer(1, function (c, w, h, o) {
      const col = "#150e33", y = o + hz + h * 0.06;
      c.fillStyle = col;
      c.beginPath(); c.moveTo(0, o + h + o);
      c.lineTo(0, y - 30); c.quadraticCurveTo(o + w * 0.2, y - 42, o + w * 0.36, y - 8);
      c.quadraticCurveTo(o + w * 0.44, y + 6, o + w * 0.4, y + h * 0.12);
      c.quadraticCurveTo(o + w * 0.34, o + h * 0.95, o + w * 0.5, o + h + o); c.lineTo(0, o + h + o); c.fill();
      palm(c, o + w * 0.05, y - 26, 130, 18, 1.1, col);
      palm(c, o + w * 0.11, y - 30, 100, -14, 0.9, col);
      palm(c, o + w * 0.33, y - 10, 140, 26, 1.15, col);
      // a little pavilion with warm windows
      const px = o + w * 0.21, py = y - 34;
      c.beginPath(); c.moveTo(px - 66, py - 46); c.lineTo(px, py - 108); c.lineTo(px + 66, py - 46); c.fill();
      c.fillRect(px - 48, py - 48, 96, 50);
      c.fillStyle = "#ffd27a";
      [-36, -8, 20].forEach(function (dx) { c.fillRect(px + dx, py - 38, 14, 16); });
      glow(c, px - 84, py - 20, 22, "#ffd27a", 0.7); glow(c, px + 90, py - 14, 22, "#ffd27a", 0.7);
      // reeds on the right
      c.strokeStyle = col; c.lineWidth = 2;
      for (let i = 0; i < 60; i++) {
        const rx = o + w * (0.78 + R() * 0.24), rh = 30 + R() * 70;
        c.beginPath(); c.moveTo(rx, o + h + 10); c.quadraticCurveTo(rx + 6, o + h - rh * 0.5, rx + (R() - 0.3) * 18, o + h - rh); c.stroke();
      }
    });
    const layers = [sky, high, low, water, far, shore];

    const ripples = [];
    let lastRipple = 0;
    const flies = [];
    for (let i = 0; i < 28; i++) flies.push({ x: R() * W, y: hz + 20 + R() * (H - hz - 20), p: R() * 6, s: 0.5 + R() });

    return {
      tint: "#ffd2e4",
      onMove: function (p) {
        const now = performance.now();
        if (p.y > hz + 8 && now - lastRipple > 110) { lastRipple = now; ripples.push({ x: p.x, y: p.y, r: 4, a: 0.7 }); }
      },
      onClick: function (x, y) { if (y > hz) for (let i = 0; i < 3; i++) ripples.push({ x: x, y: y, r: 4 + i * 16, a: 0.9 }); },
      frame: function (ctx, t, dt) {
        drawLayers(ctx, layers, P.ex, P.ey);
        // the sun's path glittering on the water
        const sx = sunX - P.ex * 0.45 * M * 0.85;
        for (let i = 0; i < 26; i++) {
          const yy = hz + 6 + i * i * 0.55;
          if (yy > H) break;
          const wv = (14 + i * 5) * (0.6 + 0.4 * Math.sin(t * 2 + i));
          ctx.fillStyle = "rgba(255,226,180," + (0.55 - i * 0.018).toFixed(3) + ")";
          ctx.fillRect(sx - wv / 2 + Math.sin(t * 1.3 + i * 2) * 6, yy, wv, 1.6);
        }
        ctx.lineWidth = 1.4;
        for (let i = ripples.length - 1; i >= 0; i--) {
          const r = ripples[i]; r.r += dt * 60; r.a -= dt * 0.55;
          if (r.a <= 0) { ripples.splice(i, 1); continue; }
          ctx.strokeStyle = "rgba(255,225,240," + r.a.toFixed(3) + ")";
          ctx.beginPath(); ctx.ellipse(r.x, r.y, r.r, r.r * 0.26, 0, 0, Math.PI * 2); ctx.stroke();
        }
        flies.forEach(function (f) {
          f.x += Math.sin(t * f.s + f.p) * 0.4; f.y += Math.cos(t * f.s * 0.8 + f.p) * 0.25;
          if (P.inside) { const dx = P.x - f.x, dy = P.y - f.y, d = Math.hypot(dx, dy); if (d < 220) { f.x += (dx / d) * 0.6; f.y += (dy / d) * 0.6; } }
          const a = 0.4 + 0.4 * Math.sin(t * 3 + f.p * 5);
          glow(ctx, f.x, f.y, 9, "#ffe08a", a * 0.6);
          ctx.fillStyle = "rgba(255,246,200," + a.toFixed(3) + ")"; ctx.fillRect(f.x - 1, f.y - 1, 2, 2);
        });
      }
    };
  };

  /* ---------- day: summer clouds over a city ---------- */
  SCENES.day = function () {
    const R = rng(23);
    const sky = layer(0.03, function (c, w, h, o) {
      c.fillStyle = lin(c, 0, 0, 0, h + 2 * o, [[0, "#1b56be"], [0.45, "#4f98e6"], [0.8, "#a8d5ff"], [1, "#e9f6ff"]]);
      c.fillRect(0, 0, w + 2 * o, h + 2 * o);
    });
    const pal = P_("#ffffff", "#eef3fd", "#97aedb", "rgba(255,255,255,.9)");
    const towers = layer(0.3, function (c, w, h, o) {
      cloud(c, R, o + w * 0.3, o + h * 0.74, w * 0.6, h * 0.66, pal, { lx: 0.55, ly: -0.7, n: 90 });
      cloud(c, R, o + w * 0.86, o + h * 0.66, w * 0.34, h * 0.36, pal, { lx: 0.3, ly: -0.8, n: 50 });
    });
    const smalls = layer(0.5, function (c, w, h, o) {
      for (let i = 0; i < 7; i++) {
        cloud(c, R, o + w * (0.6 + R() * 0.38), o + h * (0.12 + R() * 0.2), 80 + R() * 120, 30 + R() * 26, pal, { lx: 0.5, ly: -0.7 });
      }
    });
    const farCity = layer(0.45, function (c, w, h, o) {
      skyline(c, R, 0, w + 2 * o, o + h * 0.86, 30, 150, "#8aa6d3", "#b5cbec", 0.12);
    });
    const nearCity = layer(0.75, function (c, w, h, o) {
      skyline(c, R, 0, w + 2 * o, o + h + 20, 60, 230, "#2e4878", "#d6e6ff", 0.08);
    });
    const wires = layer(1.15, function (c, w, h, o) {
      const px = o + w * 0.1, top = o + h * 0.42;
      c.fillStyle = "#1a2846"; c.fillRect(px - 5, top, 10, h);
      c.fillRect(px - 46, top + 14, 92, 6); c.fillRect(px - 34, top + 44, 68, 5);
      c.strokeStyle = "#1a2846"; c.lineWidth = 1.6;
      [[top + 16, 120], [top + 18, 160], [top + 46, 110], [top + 47, 190]].forEach(function (l, i) {
        const x0 = px + (i % 2 ? 40 : -40);
        c.beginPath(); c.moveTo(x0, l[0]); c.quadraticCurveTo((x0 + w + 2 * o) / 2, l[0] + l[1], w + 2 * o, l[0] + 10); c.stroke();
      });
      // the birds on the wire are drawn live by assets/game.js
    });
    const layers = [sky, towers, smalls, farCity, nearCity, wires];
    return {
      tint: "#ffffff",
      frame: function (ctx, t) {
        ctx.drawImage(sky.c, -M, -M, W + 2 * M, H + 2 * M);
        // the sun drifts toward the cursor
        const sx = W * 0.8 + P.ex * 110, sy = H * 0.15 + P.ey * 60;
        glow(ctx, sx, sy, Math.max(W, H) * 0.45, "#ffffff", 0.55);
        ctx.save(); ctx.translate(sx, sy); ctx.rotate(t * 0.03);
        for (let i = 0; i < 14; i++) {
          ctx.rotate((Math.PI * 2) / 14);
          ctx.fillStyle = "rgba(255,255,255,0.08)";
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-10, -Math.max(W, H) * 0.6); ctx.lineTo(10, -Math.max(W, H) * 0.6); ctx.fill();
        }
        ctx.restore();
        glow(ctx, sx, sy, 60, "#ffffff", 1);
        drawLayers(ctx, layers.slice(1), P.ex, P.ey);
        // lens flare along the line from the sun through the centre
        const cx = W / 2, cy = H / 2;
        [[0.35, 26, "#bff3ff", 0.18], [0.55, 12, "#ffe0f5", 0.22], [0.8, 48, "#c8ffd8", 0.1], [1.2, 18, "#d9d2ff", 0.18], [1.45, 70, "#bfe6ff", 0.08]].forEach(function (f) {
          const fx = sx + (cx - sx) * f[0] * 2, fy = sy + (cy - sy) * f[0] * 2;
          glow(ctx, fx, fy, f[1], f[2], f[3] * 2);
        });
      }
    };
  };

  /* ---------- sunset: above a sea of clouds ---------- */
  SCENES.sunset = function () {
    const R = rng(37);
    const hz = H * 0.5, sunX = W * 0.56;
    const sky = layer(0.04, function (c, w, h, o) {
      c.fillStyle = lin(c, 0, o, 0, o + hz, [[0, "#232d6c"], [0.35, "#5a4a9c"], [0.68, "#d06f94"], [0.88, "#ff9d6c"], [1, "#ffd884"]]);
      c.fillRect(0, 0, w + 2 * o, h + 2 * o);
      glow(c, o + sunX, o + hz, Math.max(w, h) * 0.6, "#ffb072", 0.6);
      glow(c, o + sunX, o + hz, 120, "#fff0c4", 0.95);
      c.fillStyle = "#fff8e6"; c.beginPath(); c.arc(o + sunX, o + hz, 34, 0, Math.PI * 2); c.fill();
      // high cirrus streaks
      for (let i = 0; i < 14; i++) {
        const y = o + h * (0.05 + R() * 0.3), x = o + R() * w, len = 120 + R() * 320;
        c.save(); c.translate(x, y); c.rotate(-0.08 + R() * 0.06);
        c.fillStyle = lin(c, -len / 2, 0, len / 2, 0, [[0, "rgba(255,170,190,0)"], [0.5, "rgba(255,190,200,.35)"], [1, "rgba(255,170,190,0)"]]);
        c.beginPath(); c.ellipse(0, 0, len / 2, 2 + R() * 3, 0, 0, Math.PI * 2); c.fill();
        c.restore();
      }
    });
    const peaks = layer(0.25, function (c, w, h, o) {
      [[0.17, 170, 190], [0.31, 100, 120], [0.83, 140, 170]].forEach(function (p) {
        const x = o + w * p[0], b = o + hz + 40, ht = p[1], wd = p[2];
        const pts = [[x - wd * 1.5, b]];
        for (let i = 1; i < 8; i++) { const f = i / 8, peak = 1 - Math.abs(f - 0.5) * 2; pts.push([x - wd * 1.5 + f * wd * 3, b - ht * Math.pow(peak, 1.4) * (0.85 + R() * 0.3)]); }
        pts.push([x + wd * 1.5, b]);
        c.fillStyle = "#3b2d6c";
        c.beginPath(); pts.forEach(function (q, i) { i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); }); c.fill();
        // sunlit faces and snow on the side toward the sun
        const toSun = (o + sunX) > x ? 1 : -1;
        c.fillStyle = "rgba(255,160,150,.5)";
        c.beginPath(); c.moveTo(pts[4][0], pts[4][1]);
        for (let i = 4; i >= 0 && i < pts.length; i += toSun) c.lineTo(pts[i][0], pts[i][1]);
        c.lineTo(pts[4][0] + toSun * wd * 0.2, b); c.fill();
        c.fillStyle = "rgba(255,236,226,.75)";
        c.beginPath(); c.moveTo(pts[4][0], pts[4][1]); c.lineTo(pts[4][0] + toSun * wd * 0.25, pts[4][1] + ht * 0.22); c.lineTo(pts[4][0] - toSun * wd * 0.06, pts[4][1] + ht * 0.14); c.fill();
      });
    });
    function row(depth, i) {
      return layer(depth, function (c, w, h, o) {
        const y = o + hz + 26 + i * H * 0.115;
        const pal = i < 2 ? P_("#ffe4b6", "#e99aa6", "#5a4893", "rgba(255,238,205,.8)")
                          : P_("#ffcfae", "#b8739c", "#352a6c", "rgba(255,226,200,.6)");
        cloudSea(c, R, y, w + 2 * o, 18 + i * 14, 40 + i * 30, pal, o + sunX, h + 2 * o);
      });
    }
    const layers = [sky, peaks, row(0.4, 0), row(0.6, 1), row(0.82, 2), row(1.05, 3)];
    const birds = [];
    for (let i = 0; i < 9; i++) birds.push({ x: W * 0.3 + R() * 80, y: H * 0.3 + R() * 60, o: R() * 6, k: 0.6 + R() * 0.4 });
    let bx = W * 0.3, by = H * 0.3;
    return {
      tint: "#ffe0b0",
      frame: function (ctx, t, dt) {
        ctx.drawImage(sky.c, -M - P.ex * 0.04 * M, -M, W + 2 * M, H + 2 * M);
        // god rays fanning out from the sun, leaning toward the cursor
        ctx.save(); ctx.translate(sunX, hz); ctx.globalCompositeOperation = "lighter";
        for (let i = 0; i < 13; i++) {
          const a = -Math.PI / 2 + (i - 6) * 0.16 + P.ex * 0.25 + Math.sin(t * 0.3 + i) * 0.02;
          const L = Math.max(W, H);
          const g = ctx.createLinearGradient(0, 0, Math.cos(a) * L, Math.sin(a) * L);
          g.addColorStop(0, "rgba(255,220,160,.09)"); g.addColorStop(1, "rgba(255,220,160,0)");
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(a - 0.035) * L, Math.sin(a - 0.035) * L); ctx.lineTo(Math.cos(a + 0.035) * L, Math.sin(a + 0.035) * L); ctx.fill();
        }
        ctx.restore();
        drawLayers(ctx, layers.slice(1), P.ex, P.ey);
        // a small flock gliding toward the cursor
        const tx = P.inside ? P.x : W * 0.3 + Math.sin(t * 0.2) * W * 0.1;
        const ty = P.inside ? Math.min(P.y, hz - 30) : H * 0.28;
        bx += (tx - bx) * dt * 0.35; by += (ty - by) * dt * 0.35;
        ctx.strokeStyle = "rgba(50,30,80,.85)"; ctx.lineWidth = 1.6; ctx.lineCap = "round";
        birds.forEach(function (b, i) {
          const x = bx + Math.cos(i * 1.7 + t * 0.4) * 40 * b.k + (i - 4) * 14, y = by + Math.sin(i * 2.3 + t * 0.5) * 20 * b.k + Math.abs(i - 4) * 8;
          const f = Math.sin(t * 8 + b.o) * 4, s = 6 * b.k + 3;
          ctx.beginPath(); ctx.moveTo(x - s, y - f); ctx.quadraticCurveTo(x - s * 0.4, y - 2, x, y); ctx.quadraticCurveTo(x + s * 0.4, y - 2, x + s, y - f); ctx.stroke();
        });
      }
    };
  };

  /* ---------- night: the Milky Way and a meteor shower ---------- */
  SCENES.night = function () {
    const R = rng(51);
    const sky = layer(0.06, function (c, w, h, o) {
      c.fillStyle = lin(c, 0, 0, 0, h + 2 * o, [[0, "#04071a"], [0.5, "#0c1342"], [0.85, "#232f70"], [1, "#3d3f84"]]);
      c.fillRect(0, 0, w + 2 * o, h + 2 * o);
      // Milky Way: a diagonal band of soft colour and dense tiny stars
      const ax = o + w * 0.05, ay = o + h * 0.95, bx2 = o + w * 0.95, by2 = o + h * 0.02;
      const dx = bx2 - ax, dy = by2 - ay, len = Math.hypot(dx, dy), nx = -dy / len, ny = dx / len;
      c.globalCompositeOperation = "lighter";
      const cols = ["#6a4fc8", "#3f6fd8", "#c45fa8", "#2fa0c8"];
      for (let i = 0; i < 46; i++) {
        const t = R(), off = (R() - 0.5) * 160;
        glow(c, ax + dx * t + nx * off, ay + dy * t + ny * off, 60 + R() * 120, cols[i % 4], 0.12);
      }
      for (let i = 0; i < 2600; i++) {
        const t = R(), g = (R() + R() + R() - 1.5) * 150;
        const x = ax + dx * t + nx * g, y = ay + dy * t + ny * g;
        c.fillStyle = "rgba(255,255,255," + (0.15 + R() * 0.6).toFixed(2) + ")";
        c.fillRect(x, y, R() < 0.1 ? 1.6 : 1, R() < 0.1 ? 1.6 : 1);
      }
      c.globalCompositeOperation = "source-over";
      for (let i = 0; i < 14; i++) { // dark dust lanes
        const t = 0.2 + R() * 0.6, off = (R() - 0.5) * 40;
        glow(c, ax + dx * t + nx * off, ay + dy * t + ny * off, 40 + R() * 60, "#050818", 0.35);
      }
      for (let i = 0; i < 500; i++) {
        c.fillStyle = "rgba(255,255,255," + (0.1 + R() * 0.5).toFixed(2) + ")";
        c.fillRect(R() * (w + 2 * o), R() * (h + 2 * o) * 0.8, 1, 1);
      }
    });
    const hills = layer(0.4, function (c, w, h, o) {
      ridge(c, R, w + 2 * o, o + h * 0.8, 50, 14, "#10173f", h + 2 * o);
    });
    const forest = layer(0.75, function (c, w, h, o) {
      const base = o + h * 0.9;
      ridge(c, R, w + 2 * o, base, 26, 16, "#070b24", h + 2 * o);
      for (let x = -20; x < w + 2 * o; x += 14 + R() * 18) pine(c, x, base + 8 - R() * 20, 50 + R() * 70, "#070b24");
    });
    const hill = layer(1.05, function (c, w, h, o) {
      const col = "#03051a";
      c.fillStyle = col;
      c.beginPath(); c.moveTo(o + w * 0.55, o + h + o); c.quadraticCurveTo(o + w * 0.78, o + h * 0.82, o + w + o, o + h * 0.84); c.lineTo(o + w + o, o + h + o); c.fill();
      // a small telescope on a tripod
      const tx = o + w * 0.82, ty = o + h * 0.86;
      c.strokeStyle = col; c.lineWidth = 3;
      c.beginPath(); c.moveTo(tx, ty - 34); c.lineTo(tx - 16, ty); c.moveTo(tx, ty - 34); c.lineTo(tx + 14, ty); c.moveTo(tx, ty - 34); c.lineTo(tx + 2, ty + 2); c.stroke();
      c.save(); c.translate(tx, ty - 38); c.rotate(-0.6); c.fillRect(-26, -6, 56, 12); c.fillRect(28, -8, 8, 16); c.restore();
      // a cabin with a warm window
      const hx = o + w * 0.93, hy = o + h * 0.86;
      c.beginPath(); c.moveTo(hx - 34, hy - 30); c.lineTo(hx, hy - 58); c.lineTo(hx + 34, hy - 30); c.fill();
      c.fillRect(hx - 26, hy - 32, 52, 34);
      c.fillStyle = "#ffcf73"; c.fillRect(hx - 8, hy - 22, 14, 12);
      glow(c, hx - 1, hy - 16, 30, "#ffcf73", 0.45);
    });
    const layers = [sky, hills, forest, hill];
    const stars = [];
    for (let i = 0; i < 220; i++) stars.push({ x: R() * W, y: R() * H * 0.78, r: 0.6 + Math.pow(R(), 3) * 2.2, p: R() * 6, s: 0.5 + R() * 2 });
    const meteors = [];
    let nextMeteor = 1;
    function meteor(x, y) {
      const a = Math.PI * (0.72 + Math.random() * 0.08);
      meteors.push({ x: x, y: y, vx: Math.cos(a) * 900, vy: Math.sin(a) * -900 * -1, life: 1 });
    }
    return {
      tint: "#bcd4ff",
      onClick: function (x, y) { meteor(x + 120, y - 80); },
      frame: function (ctx, t, dt) {
        drawLayers(ctx, [sky], P.ex, P.ey);
        const ox = -P.ex * 0.1 * M, oy = -P.ey * 0.05 * M;
        const near = [];
        stars.forEach(function (s) {
          const x = s.x + ox, y = s.y + oy;
          let a = 0.45 + 0.55 * Math.sin(t * s.s + s.p);
          let r = s.r;
          if (P.inside) {
            const d = Math.hypot(P.x - x, P.y - y);
            if (d < 170) { near.push([x, y, d]); a = 1; r = s.r + 1.2 * (1 - d / 170); }
          }
          ctx.fillStyle = "rgba(255,252,240," + a.toFixed(3) + ")";
          ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
          if (s.r > 1.8) sparkleStar(ctx, x, y, r * 3, a * 0.5, "#ffffff");
        });
        // constellation lines around the cursor
        if (near.length) {
          near.sort(function (a, b) { return a[2] - b[2]; });
          ctx.lineWidth = 1;
          near.slice(0, 7).forEach(function (s, i, arr) {
            ctx.strokeStyle = "rgba(190,215,255," + (0.5 * (1 - s[2] / 170)).toFixed(3) + ")";
            ctx.beginPath(); ctx.moveTo(P.x, P.y); ctx.lineTo(s[0], s[1]); ctx.stroke();
            if (i > 0) { ctx.strokeStyle = "rgba(190,215,255,.3)"; ctx.beginPath(); ctx.moveTo(arr[i - 1][0], arr[i - 1][1]); ctx.lineTo(s[0], s[1]); ctx.stroke(); }
          });
        }
        nextMeteor -= dt;
        if (nextMeteor <= 0) { meteor(W * (0.3 + Math.random() * 0.7), H * Math.random() * 0.3); nextMeteor = 1.4 + Math.random() * 2.6; }
        for (let i = meteors.length - 1; i >= 0; i--) {
          const m = meteors[i];
          m.x += m.vx * dt; m.y += m.vy * dt; m.life -= dt * 1.1;
          if (m.life <= 0) { meteors.splice(i, 1); continue; }
          const tx = m.x - m.vx * 0.16, ty = m.y - m.vy * 0.16;
          const g = ctx.createLinearGradient(m.x, m.y, tx, ty);
          g.addColorStop(0, "rgba(255,255,255," + m.life.toFixed(3) + ")"); g.addColorStop(1, "rgba(150,190,255,0)");
          ctx.strokeStyle = g; ctx.lineWidth = 2.2;
          ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(tx, ty); ctx.stroke();
          glow(ctx, m.x, m.y, 10, "#dfe9ff", m.life * 0.8);
        }
        drawLayers(ctx, layers.slice(1), P.ex, P.ey);
      }
    };
  };

  /* ---------- dawn: a cherry-blossom hill ---------- */
  SCENES.dawn = function () {
    const R = rng(67);
    const sky = layer(0.05, function (c, w, h, o) {
      c.fillStyle = lin(c, 0, 0, 0, h + 2 * o, [[0, "#7f98d8"], [0.38, "#c3b2e6"], [0.68, "#ffcbd8"], [1, "#fff0db"]]);
      c.fillRect(0, 0, w + 2 * o, h + 2 * o);
      glow(c, o + w * 0.16, o + h * 0.66, Math.max(w, h) * 0.5, "#ffe6c8", 0.7);
      glow(c, o + w * 0.16, o + h * 0.66, 60, "#ffffff", 0.9);
    });
    const pal = P_("#fff6ee", "#f8d1df", "#a597d4", "rgba(255,255,255,.8)");
    const clouds = layer(0.2, function (c, w, h, o) {
      for (let i = 0; i < 6; i++) {
        const cx = o + R() * w;
        band(c, R, cx, o + h * (0.12 + i * 0.08), w * (0.25 + R() * 0.35), 60 + R() * 40, pal, { lx: cx < o + w * 0.16 ? 0.6 : -0.6, ly: 0.4 });
      }
    });
    const town = layer(0.45, function (c, w, h, o) {
      ridge(c, R, w + 2 * o, o + h * 0.78, 30, 14, "#b4a6d8", h + 2 * o);
      let x = 0;
      while (x < w + 2 * o) { // little houses with pitched roofs
        const hw = 14 + R() * 18, hh = 10 + R() * 12, y = o + h * 0.8 + R() * 30;
        c.fillStyle = "#a395cc"; c.fillRect(x, y - hh, hw, hh + 40);
        c.fillStyle = "#8f80bd"; c.beginPath(); c.moveTo(x - 3, y - hh); c.lineTo(x + hw / 2, y - hh - 9); c.lineTo(x + hw + 3, y - hh); c.fill();
        if (R() < 0.3) { c.fillStyle = "#ffe7b0"; c.fillRect(x + hw * 0.35, y - hh * 0.6, 4, 4); }
        x += hw + 4 + R() * 26;
      }
    });
    const hill = layer(0.85, function (c, w, h, o) {
      c.fillStyle = "#6c5a98";
      c.beginPath(); c.moveTo(o + w * 0.42, o + h + o); c.quadraticCurveTo(o + w * 0.7, o + h * 0.72, o + w + o, o + h * 0.7); c.lineTo(o + w + o, o + h + o); c.fill();
      // trunk and branches
      const tx = o + w * 0.8, ty = o + h * 0.76;
      c.strokeStyle = "#4b3c6c"; c.lineCap = "round";
      c.lineWidth = 16; c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo(tx - 10, ty - 80, tx - 30, ty - 150); c.stroke();
      c.lineWidth = 8;
      [[-120, -190], [40, -200], [-200, -130], [90, -140]].forEach(function (b) {
        c.beginPath(); c.moveTo(tx - 20, ty - 110); c.quadraticCurveTo(tx + b[0] * 0.4, ty + b[1] * 0.8, tx + b[0], ty + b[1]); c.stroke();
      });
      const blossom = P_("#fff0f5", "#f7b3c9", "#b56c9c", "rgba(255,255,255,.7)");
      [[-120, -190, 190, 120], [40, -200, 190, 120], [-200, -130, 150, 95], [90, -140, 150, 95], [-40, -235, 210, 120]].forEach(function (b) {
        cloud(c, R, tx + b[0], ty + b[1] + b[3] * 0.45, b[2], b[3], blossom, { lx: -0.6, ly: -0.6, n: 34, noBase: true });
      });
    });
    const grass = layer(1.15, function (c, w, h, o) {
      c.fillStyle = "#4b3f78";
      c.beginPath(); c.moveTo(0, o + h + o); c.lineTo(0, o + h * 0.93); c.quadraticCurveTo(o + w * 0.25, o + h * 0.88, o + w * 0.5, o + h + 10); c.fill();
      for (let i = 0; i < 40; i++) { c.fillStyle = R() < 0.5 ? "#ffd3e2" : "#fff3c4"; c.beginPath(); c.arc(o + R() * w * 0.4, o + h * (0.93 + R() * 0.07), 1.8, 0, Math.PI * 2); c.fill(); }
    });
    const layers = [sky, clouds, town, hill, grass];
    const petals = [];
    for (let i = 0; i < 110; i++) petals.push(newPetal(true));
    function newPetal(anywhere) {
      return { x: Math.random() * W * 1.2, y: anywhere ? Math.random() * H : -20, vx: -0.3 - Math.random() * 0.5, vy: 0.4 + Math.random() * 0.6, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.08, s: 3 + Math.random() * 4, p: Math.random() * 6 };
    }
    return {
      tint: "#ffd0e0",
      frame: function (ctx, t, dt) {
        drawLayers(ctx, layers, P.ex, P.ey);
        const k = dt * 60;
        petals.forEach(function (p, i) {
          if (P.inside) {
            const dx = p.x - P.x, dy = p.y - P.y, d = Math.hypot(dx, dy);
            if (d < 160 && d > 0.1) {
              const f = (1 - d / 160) * 0.9;
              p.vx += (dx / d) * f + P.vx * 0.02 * f; p.vy += (dy / d) * f + P.vy * 0.02 * f;
            }
          }
          p.vx += (-0.35 - p.vx) * 0.02 * k; p.vy += (0.6 - p.vy) * 0.02 * k;
          p.x += (p.vx + Math.sin(t + p.p) * 0.3) * k; p.y += p.vy * k; p.r += p.vr * k;
          if (p.y > H + 20 || p.x < -30 || p.x > W + 60) petals[i] = newPetal(false);
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.scale(1, 0.55 + 0.45 * Math.sin(t * 2 + p.p));
          ctx.fillStyle = "#ffc2d6"; ctx.beginPath(); ctx.ellipse(0, 0, p.s, p.s * 0.62, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = "#fff0f5"; ctx.beginPath(); ctx.ellipse(-p.s * 0.25, -p.s * 0.1, p.s * 0.45, p.s * 0.28, 0, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
        });
      }
    };
  };

  /* ======================================================================
     running scenes and switching between them
     ====================================================================== */
  let current = null;       // the live scene object
  const live = [];          // {name, el, ctx, scene, fading}

  function makeCanvas() {
    const el = document.createElement("canvas");
    el.width = Math.ceil(W * S); el.height = Math.ceil(H * S);
    host.appendChild(el);
    const ctx = el.getContext("2d");
    ctx.setTransform(S, 0, 0, S, 0, 0);
    return { el: el, ctx: ctx };
  }
  function show(name) {
    if (!SCENES[name]) name = "dusk";
    const top = live[live.length - 1];
    if (top && top.name === name && !top.fading) return;
    const v = makeCanvas();
    const scene = SCENES[name]();
    const entry = { name: name, el: v.el, ctx: v.ctx, scene: scene, fading: false };
    live.forEach(function (e) {
      if (e.fading) return;
      e.fading = true;
      e.el.classList.remove("on");
      setTimeout(function () { const i = live.indexOf(e); if (i >= 0) live.splice(i, 1); e.el.remove(); }, 1500);
    });
    live.push(entry);
    current = scene;
    renderOnce(entry, 0, 0.016);
    requestAnimationFrame(function () { v.el.classList.add("on"); });
  }
  function renderOnce(e, t, dt) {
    e.ctx.clearRect(0, 0, W, H);
    e.scene.frame(e.ctx, t, dt);
    if (e.scene !== current) return;
    if (window.Game) window.Game.draw(e.ctx, e.name, t, dt, P, W, H);
    drawSparks(e.ctx, e.scene.tint || "#ffffff", dt);
  }

  let last = performance.now(), t0 = last;
  // low-power mode: if the first seconds run slowly, render smaller and every other frame
  let perfN = 0, perfT = 0, low = false, skip = false, held = 0;
  function loop(now) {
    let dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!low && !document.hidden && now - t0 > 2500 && perfN >= 0) {
      perfN++; perfT += dt;
      if (perfN === 90) { if (perfT / perfN > 0.042) { low = true; S = 0.75; rebuild(); } else perfN = -1; }
    }
    if (low) {
      skip = !skip; held += dt;
      if (skip) { requestAnimationFrame(loop); return; }
      dt = Math.min(0.1, held); held = 0;
    }
    // ease the parallax toward the pointer; on touch screens, drift slowly
    let tx = P.nx, ty = P.ny;
    if (coarse || !P.moved) { tx = Math.sin((now - t0) / 4000) * 0.5; ty = Math.cos((now - t0) / 5000) * 0.3; }
    P.ex += (tx - P.ex) * Math.min(1, dt * 3); P.ey += (ty - P.ey) * Math.min(1, dt * 3);
    if (!document.hidden) live.forEach(function (e) { renderOnce(e, (now - t0) / 1000, dt); });
    requestAnimationFrame(loop);
  }

  function rebuild() {
    W = innerWidth; H = innerHeight;
    const top = live[live.length - 1];
    if (!top) return;
    live.splice(0).forEach(function (e) { e.el.remove(); });
    show(top.name);
  }
  let resizeTimer = 0;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(rebuild, 250);
  });

  if (!reduce) requestAnimationFrame(loop);
  window.Scenes = { show: show };

  // hidden secrets in each scene (assets/game.js)
  const g = document.createElement("script");
  g.src = "assets/game.js";
  document.head.appendChild(g);
})();
