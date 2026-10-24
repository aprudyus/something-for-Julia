// ---------- Flow ----------
const $ = (id) => document.getElementById(id);
const screens = ["q1", "q2", "intro", "nf", "love"];

const WRONG_LINK = "Sorry, you hit the wrong link.";
const WRONG_SURNAME = "Sorry, I love only one Julia, and you're not the one.";

function show(name, msg = WRONG_LINK) {
  $("nfmsg").textContent = msg;
  screens.forEach((s) => $(s).classList.toggle("hidden", s !== name));
  if (name === "nf") document.title = "404 Not Found";
  if (name === "love") { document.title = "For Julia"; startGarden(); }
  if (name === "q2") $("surname").focus();
}

$("yes1").onclick = () => show("q2");
$("intro").onclick = () => show("love");
$("no1").onclick = () => show("nf");
$("form").onsubmit = (e) => {
  e.preventDefault();
  const v = $("surname").value.trim().toLowerCase();
  if (v === "petrusiak" || v === "петрусяк") show("intro");
  else show("nf", WRONG_SURNAME);
};

// ---------- Flower garden ----------
const cv = $("cv");
const ctx = cv.getContext("2d");
let W = 0, H = 0, DPR = 1;

const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const easeBack = (t) => { const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const q = (a, b, c, t) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * b + t * t * c;
const HUES = [335, 350, 12, 280, 265, 45, 200, 320];

let grass = [], stars = [];
let flowers = [], petals = [], motes = [];
let now = 0, last = 0, nextAuto = 0, raf = 0;

const groundY = () => H - 14;

function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth; H = window.innerHeight;
  cv.width = W * DPR; cv.height = H * DPR;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  grass = [];
  for (let x = -10; x < W + 10; x += 5) grass.push({ x, h: rand(18, 60), p: rand(0, 6), s: rand(0.6, 1.4), l: rand(18, 34) });
  stars = [];
  for (let i = 0; i < 90; i++) stars.push({ x: rand(0, W), y: rand(0, H * 0.6), r: rand(0.4, 1.5), p: rand(0, 6) });
}

function spawn(x, y) {
  flowers.push({
    x, topY: clamp(y, H * 0.18, H - 90), born: now,
    hue: HUES[Math.floor(Math.random() * HUES.length)] + rand(-8, 8),
    n: Math.floor(rand(7, 13)), layers: Math.floor(rand(2, 4)),
    size: rand(26, 50), lean: rand(-50, 50), phase: rand(0, 6), life: rand(26, 40),
  });
  if (flowers.length > 45) shed(flowers.shift());
}
function shed(f) {
  for (let i = 0; i < 14; i++) addPetal(f.hx ?? f.x, f.hy ?? f.topY, f.hue, f.size * 0.5);
}
function addPetal(x, y, hue, size) {
  petals.push({
    x, y, vx: rand(-0.3, 0.3), vy: rand(0.2, 0.6), rot: rand(0, 6), vr: rand(-0.03, 0.03),
    size: size * rand(0.35, 0.6), hue: hue + rand(-10, 10), ph: rand(0, 6), a: 1,
  });
}

function drawFlower(f) {
  const age = now - f.born;
  const fade = 1 - clamp((age - f.life) / 3);
  if (fade <= 0) { f.dead = true; shed(f); return; }
  const g = easeOut(clamp(age / 1.8));
  const b = clamp((age - 1.5) / 2.2);
  const sway = Math.sin(now * 0.9 + f.phase) * 14 + Math.sin(now * 0.37 + f.phase * 2) * 8;
  const x0 = f.x, y0 = groundY();
  const cx = f.x + f.lean * 0.5 + sway * 0.3, cy = (y0 + f.topY) / 2;
  const x1 = f.x + f.lean + sway, y1 = f.topY;

  ctx.globalAlpha = fade;
  ctx.strokeStyle = "hsl(130,40%,28%)"; ctx.lineWidth = 3.2; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(x0, y0);
  const steps = 22;
  for (let i = 1; i <= steps; i++) {
    const s = (i / steps) * g;
    ctx.lineTo(q(x0, cx, x1, s), q(y0, cy, y1, s));
  }
  ctx.stroke();

  for (const [s, side] of [[0.32, -1], [0.55, 1], [0.72, -1]]) {
    const lg = clamp((g - s) / 0.3);
    if (lg <= 0) continue;
    ctx.save();
    ctx.translate(q(x0, cx, x1, s), q(y0, cy, y1, s));
    ctx.rotate(side * (1.0 + Math.sin(now + f.phase) * 0.08));
    const L = 34 * easeOut(lg);
    ctx.fillStyle = "hsl(135,45%,32%)";
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.bezierCurveTo(L * 0.4, -L * 0.35, L * 0.9, -L * 0.2, L, 0);
    ctx.bezierCurveTo(L * 0.9, L * 0.2, L * 0.4, L * 0.35, 0, 0);
    ctx.fill(); ctx.restore();
  }

  const hx = q(x0, cx, x1, g), hy = q(y0, cy, y1, g);
  f.hx = hx; f.hy = hy;
  if (b > 0) {
    const size = f.size * easeBack(b);
    const rot = Math.sin(now * 0.5 + f.phase) * 0.15 + now * 0.05;
    ctx.save(); ctx.translate(hx, hy);
    const gl = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 1.9);
    gl.addColorStop(0, `hsla(${f.hue},90%,70%,.28)`); gl.addColorStop(1, `hsla(${f.hue},90%,70%,0)`);
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0, 0, size * 1.9, 0, 7); ctx.fill();

    for (let l = 0; l < f.layers; l++) {
      const len = size * (1 - l * 0.24), w = len * 0.38;
      const light = 62 + l * 8;
      for (let i = 0; i < f.n; i++) {
        ctx.save();
        ctx.rotate(rot + (i / f.n) * Math.PI * 2 + (l * Math.PI) / f.n);
        const gr = ctx.createLinearGradient(0, 0, 0, -len);
        gr.addColorStop(0, `hsl(${f.hue + 15},85%,${light - 14}%)`);
        gr.addColorStop(1, `hsl(${f.hue},85%,${light + 14}%)`);
        ctx.fillStyle = gr;
        ctx.beginPath(); ctx.moveTo(0, 0);
        ctx.bezierCurveTo(w * 1.2, -len * 0.25, w, -len * 0.95, 0, -len);
        ctx.bezierCurveTo(-w, -len * 0.95, -w * 1.2, -len * 0.25, 0, 0);
        ctx.fill(); ctx.restore();
      }
    }
    const r = size * 0.2;
    const cg = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    cg.addColorStop(0, "#fff3a8"); cg.addColorStop(1, "#f0a020");
    ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill();
    ctx.fillStyle = "rgba(120,60,0,.5)";
    for (let i = 0; i < 10; i++) {
      const a = i * 2.4, d = r * 0.6 * Math.sqrt(i / 10);
      ctx.beginPath(); ctx.arc(Math.cos(a) * d, Math.sin(a) * d, 1.1, 0, 7); ctx.fill();
    }
    ctx.restore();
    if (b >= 1 && Math.random() < 0.004) addPetal(hx, hy, f.hue, f.size);
  }
  ctx.globalAlpha = 1;
}

function drawBackground() {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#120826"); g.addColorStop(0.55, "#3a1456"); g.addColorStop(1, "#b0457a");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  for (const s of stars) {
    ctx.fillStyle = `rgba(255,255,255,${0.35 + 0.35 * Math.sin(now * 1.5 + s.p)})`;
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 7); ctx.fill();
  }
  const mg = ctx.createRadialGradient(W * 0.82, H * 0.16, 0, W * 0.82, H * 0.16, 90);
  mg.addColorStop(0, "rgba(255,245,230,.95)"); mg.addColorStop(0.3, "rgba(255,230,230,.5)"); mg.addColorStop(1, "rgba(255,200,230,0)");
  ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(W * 0.82, H * 0.16, 90, 0, 7); ctx.fill();
}

function drawGrass(front) {
  for (const b of grass) {
    if ((b.s > 1) !== front) continue;
    const sw = Math.sin(now * 1.2 + b.p + b.x * 0.01) * 7 * b.s;
    ctx.strokeStyle = `hsl(140,45%,${b.l - (front ? 0 : 8)}%)`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(b.x, H);
    ctx.quadraticCurveTo(b.x + sw * 0.4, H - b.h * 0.6, b.x + sw, H - b.h * (front ? 1 : 0.8)); ctx.stroke();
  }
}

function drawPetals() {
  for (let i = petals.length - 1; i >= 0; i--) {
    const p = petals[i];
    p.ph += 0.04; p.x += p.vx + Math.sin(p.ph) * 0.6; p.y += p.vy; p.rot += p.vr;
    if (p.y > H - 8) { p.a -= 0.02; p.vy = 0; }
    if (p.a <= 0) { petals.splice(i, 1); continue; }
    ctx.save(); ctx.globalAlpha = p.a; ctx.translate(p.x, p.y); ctx.rotate(p.rot);
    ctx.scale(1, 0.6 + 0.4 * Math.sin(p.ph));
    ctx.fillStyle = `hsl(${p.hue},85%,70%)`;
    const s = p.size;
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.bezierCurveTo(s * 0.5, -s * 0.3, s * 0.4, -s * 0.9, 0, -s);
    ctx.bezierCurveTo(-s * 0.4, -s * 0.9, -s * 0.5, -s * 0.3, 0, 0); ctx.fill();
    ctx.restore();
  }
}

function drawMotes() {
  while (motes.length < 40) motes.push({ x: rand(0, W), y: rand(H * 0.3, H), p: rand(0, 6), s: rand(0.2, 0.6) });
  for (const m of motes) {
    m.p += 0.01; m.x += Math.sin(m.p) * 0.4; m.y -= m.s * 0.3;
    if (m.y < 0) { m.y = H; m.x = rand(0, W); }
    const a = 0.35 + 0.35 * Math.sin(now * 2 + m.p * 5);
    const g = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, 7);
    g.addColorStop(0, `rgba(255,240,170,${a})`); g.addColorStop(1, "rgba(255,240,170,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(m.x, m.y, 7, 0, 7); ctx.fill();
  }
}

function frame(ts) {
  now += Math.min((ts - last) / 1000, 0.05); last = ts;
  if (now > nextAuto) { spawn(rand(30, W - 30), rand(H * 0.25, H * 0.7)); nextAuto = now + rand(0.9, 1.8); }
  drawBackground();
  drawGrass(false);
  flowers.sort((a, b) => a.topY - b.topY);
  for (const f of flowers) drawFlower(f);
  flowers = flowers.filter((f) => !f.dead);
  drawGrass(true);
  drawMotes();
  drawPetals();
  raf = requestAnimationFrame(frame);
}

cv.addEventListener("pointerdown", (e) => {
  spawn(e.clientX, e.clientY);
  $("hint").style.opacity = 0;
});

function startGarden() {
  cancelAnimationFrame(raf);
  resize();
  flowers = []; petals = []; motes = []; now = 0; nextAuto = 0;
  for (let i = 0; i < 7; i++) spawn(rand(60, W - 60), rand(H * 0.3, H * 0.7));
  raf = requestAnimationFrame((ts) => { last = ts; frame(ts); });
}
window.addEventListener("resize", () => { if (!$("love").classList.contains("hidden")) resize(); });
