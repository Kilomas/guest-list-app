/**
 * particles.js
 * ─ Ambient canvas particle field for the landing background
 * ─ DOM-based click burst at cursor position
 * ─ CSS ripple on interactive buttons
 */

let canvas, ctx, particles = [], raf, running = false;

function r(min, max) { return Math.random() * (max - min) + min; }

function mkParticle(w, h) {
  const palettes = [
    [260, 90, 75],  // violet
    [162, 80, 65],  // emerald
    [280, 85, 78],  // purple
    [200, 70, 72],  // sky
  ];
  const [hue, sat, lit] = palettes[Math.floor(Math.random() * palettes.length)];
  return {
    x: r(0, w), y: r(0, h),
    vx: r(-0.15, 0.15), vy: r(-0.15, 0.15),
    radius: r(0.6, 2.4),
    alpha: r(0.06, 0.38),
    pa: r(0.004, 0.013),   // pulse amplitude rate
    pd: 1,                 // pulse direction
    hue, sat, lit,
    burst: false
  };
}

export function initParticles() {
  canvas = document.getElementById("particle-canvas");
  if (!canvas) return;
  ctx = canvas.getContext("2d");
  _resize();
  _spawn();
  window.addEventListener("resize", () => { _resize(); particles = particles.filter(p => p.burst); _spawn(); });
  if (!running) { running = true; _loop(); }
}

export function stopParticles() {
  running = false;
  if (raf) cancelAnimationFrame(raf);
}

function _resize() {
  if (!canvas) return;
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}

function _spawn() {
  const density = Math.min(Math.floor((canvas.width * canvas.height) / 12000), 100);
  for (let i = 0; i < density; i++) particles.push(mkParticle(canvas.width, canvas.height));
}

function _loop() {
  if (!running || !ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const w = canvas.width, h = canvas.height;
  particles = particles.filter(p => {
    if (p.burst) {
      // Burst particle physics
      p.x  += p.vx; p.y  += p.vy;
      p.vy += 0.045;             // gravity
      p.vx *= 0.94; p.vy *= 0.94;
      p.alpha -= 0.028;
      if (p.alpha <= 0.01) return false;
    } else {
      // Ambient float + pulse
      p.alpha += p.pa * p.pd;
      if (p.alpha > 0.42 || p.alpha < 0.05) p.pd *= -1;
      p.x += p.vx; p.y += p.vy;
      if (p.x < -5) p.x = w + 5; else if (p.x > w + 5) p.x = -5;
      if (p.y < -5) p.y = h + 5; else if (p.y > h + 5) p.y = -5;
    }

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${p.hue},${p.sat}%,${p.lit}%,${Math.max(0, p.alpha)})`;
    ctx.fill();
    return true;
  });

  raf = requestAnimationFrame(_loop);
}

// ── Click burst ──────────────────────────────
function _burst(cx, cy) {
  // Canvas burst particles
  if (ctx) {
    const count = 14;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = r(2, 5);
      const hue   = Math.random() > 0.5 ? 260 : 162;
      particles.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: r(1.5, 3.5),
        alpha: 0.85,
        pa: 0, pd: 0,
        hue, sat: 90, lit: 76,
        burst: true
      });
    }
  }

  // DOM micro-dots (visible even outside canvas)
  const count2 = 10;
  for (let i = 0; i < count2; i++) {
    const dot = document.createElement("div");
    dot.className = "click-particle";
    const angle = (i / count2) * 360;
    const dist  = r(28, 72);
    const hue   = Math.random() > 0.55 ? 260 : 162;
    dot.style.cssText = `left:${cx}px;top:${cy}px;--pa:${angle}deg;--pd:${dist}px;--hue:${hue}`;
    document.body.appendChild(dot);
    dot.addEventListener("animationend", () => dot.remove(), { once: true });
  }
}

// ── Ripple ───────────────────────────────────
function _ripple(el, e) {
  const rect = el.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const span = document.createElement("span");
  span.className = "ripple-ring";
  span.style.cssText = `left:${x}px;top:${y}px`;
  el.appendChild(span);
  span.addEventListener("animationend", () => span.remove(), { once: true });
}

/**
 * Attach burst + ripple to one or more elements.
 * @param {...(string|HTMLElement)} targets  CSS selectors or elements
 */
export function attachInteraction(...targets) {
  targets.forEach(t => {
    const els = typeof t === "string"
      ? [...document.querySelectorAll(t)]
      : t instanceof HTMLElement ? [t] : [];

    els.forEach(el => {
      el.style.position = el.style.position || "relative";
      el.style.overflow = "hidden";
      el.addEventListener("click", e => {
        _ripple(el, e);
        _burst(e.clientX, e.clientY);
      });
    });
  });
}
