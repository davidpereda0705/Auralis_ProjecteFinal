'use strict';
/* =========================================================
   COMBATE — motor por turnos, escena 3D y efectos
   ========================================================= */
function calc(m) {
  const s = SPECIES[m.id], L = m.lv;
  m.maxhp = Math.floor(2 * s.b[0] * L / 100) + L + 10;
  m.atk = Math.floor(2 * s.b[1] * L / 100) + 5; m.def = Math.floor(2 * s.b[2] * L / 100) + 5; m.spd = Math.floor(2 * s.b[3] * L / 100) + 5;
}
function makeMon(id, lv) {
  const s = SPECIES[id], m = { id, n: s.n, lv, exp: lv ** 3, moves: [], status: null };
  calc(m); m.hp = m.maxhp;
  [...new Set(s.learn.filter(([l]) => l <= lv).map(a => a[1]))].slice(-4).forEach(mid => m.moves.push({ id: mid, pp: MOVES[mid].pp }));
  return m;
}
const xpFrac = m => clamp((m.exp - m.lv ** 3) / ((m.lv + 1) ** 3 - m.lv ** 3), 0, 1);
function healAll() { for (const m of [...G.party, ...G.pc]) { m.hp = m.maxhp; m.status = null; m.moves.forEach(v => v.pp = MOVES[v.id].pp); } }
function markSeen(id) { G.seen = G.seen || {}; G.seen[id] = 1; }
function markCaught(id) { markSeen(id); G.caught = G.caught || {}; G.caught[id] = 1; }

/* ---------------- ESCENA ---------------- */
const BS = { scene: new THREE.Scene(), cam: new THREE.PerspectiveCamera(36, 1, .1, 150), arenas: {}, kind: null, fx: [], aura: [] };
cameras.push(BS.cam);
const FOE_POS = new THREE.Vector3(2.7, .2, -4.4), ME_POS = new THREE.Vector3(-2.5, .2, .9);
(function initBattleScene() {
  const S = BS.scene;
  BS.hemi = new THREE.HemisphereLight(0xffffff, 0x557744, .85); S.add(BS.hemi);
  BS.sun = new THREE.DirectionalLight(0xffffff, .6); BS.sun.position.set(-5, 9, 6); BS.sun.castShadow = true; BS.sun.shadow.mapSize.set(1024, 1024);
  Object.assign(BS.sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8 }); S.add(BS.sun);
  BS.ground = new THREE.Mesh(new THREE.CircleGeometry(80, 48), lambert(0x86c95a)); BS.ground.rotation.x = -PI / 2; BS.ground.receiveShadow = true; S.add(BS.ground);
  BS.plats = [ME_POS, FOE_POS].map(p => {
    const g = new THREE.Group();
    const top = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 1.9, .2, 40), lambert(0xb8e08a)); top.position.y = .1; top.receiveShadow = true;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(1.8, .05, 6, 48), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .5 })); rim.rotation.x = PI / 2; rim.position.y = .21;
    g.add(top, rim); g.position.set(p.x, 0, p.z); S.add(g); return { g, top, rim };
  });
  BS.rigs = [mkRig(2.8, ME_POS), mkRig(2.7, FOE_POS)];
  BS.tr = mkRig(2.7, FOE_POS); BS.tr.m.scale.x = .69;
  BS.ball = makeAuraball(1); BS.ball.visible = false; S.add(BS.ball);
})();
function mkRig(size, pos) {
  const g = new THREE.Group(), bob = new THREE.Group(), geo = new THREE.PlaneGeometry(size, size); geo.translate(0, size / 2, 0);
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ transparent: true, alphaTest: .3, depthWrite: true })); bob.add(m); g.add(bob);
  const sh = new THREE.Mesh(new THREE.CircleGeometry(size * .28, 24), new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: .28, depthWrite: false })); sh.rotation.x = -PI / 2; sh.position.y = .22; g.add(sh);
  const shield = new THREE.Mesh(new THREE.SphereGeometry(size * .48, 20, 14), new THREE.MeshPhongMaterial({ color: 0x9ad8ff, transparent: true, opacity: .25, shininess: 100, depthWrite: false })); shield.position.y = size * .45; shield.visible = false; g.add(shield);
  const auraGeo = new THREE.BufferGeometry(), ap = new Float32Array(30 * 3); auraGeo.setAttribute('position', new THREE.BufferAttribute(ap, 3));
  const aura = new THREE.Points(auraGeo, new THREE.PointsMaterial({ size: .22, map: dotTexture('dot'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xffffff })); aura.visible = false; g.add(aura);
  g.position.copy(pos); g.visible = false; BS.scene.add(g);
  return { g, bob, m, sh, shield, aura, pos, size };
}
function arenaKind() {
  const id = WD.map ? WD.map.id : 'veloria';
  return { veloria: 'town', bosque: 'forest', lago: 'lake', crater: 'crater', cumbre: 'storm', domo: 'domo' }[id] || 'indoor';
}
const ARENA = {
  town:   { sky: ['#7ec8ff', '#e8f6ff'], ground: 0x86c95a, plat: 0xc8e89a, hemi: .85, sun: .6 },
  forest: { sky: ['#6ab07a', '#d8f0c8'], ground: 0x5a9e44, plat: 0x8ac868, hemi: .75, sun: .55 },
  lake:   { sky: ['#6abfff', '#e8f8ff'], ground: 0x8ad06a, plat: 0xecd9a0, hemi: .9, sun: .6 },
  crater: { sky: ['#2a0a08', '#c8502a'], ground: 0x4a3a36, plat: 0x7a5a4a, hemi: .6, sun: .7, sunC: 0xffa060 },
  storm:  { sky: ['#232838', '#5a6478'], ground: 0x7a828a, plat: 0x9aa2aa, hemi: .55, sun: .4 },
  domo:   { sky: ['#0c0a18', '#2a2048'], ground: 0x3a3456, plat: 0x6a5aa8, hemi: .7, sun: .5, sunC: 0xd0c0ff },
  indoor: { sky: ['#e8eef4', '#ffffff'], ground: 0xdfe3ea, plat: 0xc8d0dc, hemi: 1, sun: .4 },
};
function buildArenaDecor(kind) {
  const g = new THREE.Group(), r = mulberry(kind.length * 31);
  const tree = (x, z, s, col) => { const t = new THREE.Mesh(new THREE.ConeGeometry(.9 * s, 2.6 * s, 7), phong(col)); t.position.set(x, 1.3 * s, z); t.castShadow = true; g.add(t); const tr = new THREE.Mesh(new THREE.CylinderGeometry(.15 * s, .2 * s, .6 * s, 5), phong(0x7a5232)); tr.position.set(x, .3 * s, z); g.add(tr); };
  const ring = (n, rad, fn) => { for (let i = 0; i < n; i++) { const a = -PI * .05 - (i / (n - 1)) * PI * .9, rr = rad + r() * 6; fn(Math.cos(a) * rr, Math.sin(a) * rr * .8 - 4, i); } };
  if (kind === 'town' || kind === 'forest' || kind === 'lake') {
    ring(kind === 'forest' ? 46 : 26, 15, (x, z) => tree(x, z, .9 + r() * .7, kind === 'forest' ? 0x2f7a32 : 0x3f8f3a));
    for (let i = 0; i < 5; i++) { const h = new THREE.Mesh(new THREE.SphereGeometry(7 + r() * 5, 14, 8), phong(kind === 'forest' ? 0x4a8a3a : 0x6fb04c)); h.position.set(-28 + i * 14, -3.5, -32 - r() * 6); g.add(h); }
    if (kind === 'lake') { const w = new THREE.Mesh(new THREE.PlaneGeometry(60, 14), new THREE.MeshPhongMaterial({ color: 0x3d8be0, shininess: 90, transparent: true, opacity: .9 })); w.rotation.x = -PI / 2; w.position.set(0, .03, -12); g.add(w); }
    if (kind === 'town') { const d = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(5, 1)), new THREE.LineBasicMaterial({ color: 0xffffff })); d.position.set(-9, -.5, -24); d.scale.set(1, .8, 1); g.add(d); }
  } else if (kind === 'crater') {
    const lv = new THREE.Mesh(new THREE.PlaneGeometry(70, 16), new THREE.MeshBasicMaterial({ color: 0xe04a10 })); lv.rotation.x = -PI / 2; lv.position.set(0, .03, -15); g.add(lv); BS.lavaPlane = lv;
    ring(24, 13, (x, z) => { const k = new THREE.Mesh(new THREE.DodecahedronGeometry(.8 + r() * 1.4, 0), phong(0x3a2e2c)); k.position.set(x, .4, z); k.castShadow = true; g.add(k); });
    const v = new THREE.Mesh(new THREE.ConeGeometry(12, 10, 8, 1, true), phong(0x3a2a26)); v.position.set(4, 3, -40); g.add(v);
    const l = new THREE.PointLight(0xff6a20, 1.4, 30); l.position.set(0, 3, -10); g.add(l);
  } else if (kind === 'storm') {
    ring(22, 13, (x, z) => { const k = new THREE.Mesh(new THREE.DodecahedronGeometry(.8 + r() * 1.6, 0), phong(0x6a7078)); k.position.set(x, .5, z); k.castShadow = true; g.add(k); });
    for (let i = 0; i < 5; i++) { const mtn = new THREE.Mesh(new THREE.ConeGeometry(8 + r() * 4, 12 + r() * 6, 6), phong(0x4a5260)); mtn.position.set(-30 + i * 15, 4, -38 - r() * 6); g.add(mtn); const sn = new THREE.Mesh(new THREE.ConeGeometry(3, 3.5, 6), phong(0xeef2f8)); sn.position.set(mtn.position.x, mtn.position.y + 5.5, mtn.position.z); g.add(sn); }
  } else if (kind === 'domo') {
    const e = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(22, 1)), new THREE.LineBasicMaterial({ color: 0x8a7ad8, transparent: true, opacity: .5 })); e.position.set(0, -3, -4); e.scale.set(1, .65, 1); g.add(e);
    for (let i = 0; i < 10; i++) { const a = -PI * .1 - i / 9 * PI * .8, p = new THREE.Mesh(new THREE.CylinderGeometry(.5, .6, 8, 8), phong(0x5a4a8a)); p.position.set(Math.cos(a) * 15, 4, Math.sin(a) * 12 - 3); g.add(p); const c = new THREE.Mesh(new THREE.OctahedronGeometry(.4, 0), new THREE.MeshBasicMaterial({ color: 0xe8c060 })); c.position.set(p.position.x, 8.4, p.position.z); g.add(c); }
    const ar = new THREE.Mesh(new THREE.RingGeometry(6.2, 6.5, 64), new THREE.MeshBasicMaterial({ color: 0xe8c060 })); ar.rotation.x = -PI / 2; ar.position.set(0, .02, -1.7); g.add(ar);
    BS.domoLight = new THREE.PointLight(0xb08cff, 1, 30); BS.domoLight.position.set(0, 6, -2); g.add(BS.domoLight);
  } else if (kind === 'indoor') {
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(60, 20), lambert(0xe8f0f8)); wall.position.set(0, 10, -16); g.add(wall);
    for (let i = 0; i < 8; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(1.6, 3.2, 1), phong(0xc8d0dc)); m.position.set(-12 + i * 3.4, 1.6, -14); g.add(m); const s = new THREE.Mesh(new THREE.PlaneGeometry(1, .6), new THREE.MeshBasicMaterial({ color: 0x3a8a5a })); s.position.set(-12 + i * 3.4, 2.2, -13.45); g.add(s); }
  }
  g.visible = false; BS.scene.add(g); return g;
}
function setArena(kind) {
  const A = ARENA[kind];
  for (const k in BS.arenas) BS.arenas[k].visible = false;
  (BS.arenas[kind] || (BS.arenas[kind] = buildArenaDecor(kind))).visible = true;
  BS.scene.background = skyTexture(A.sky[0], A.sky[1]); BS.scene.fog = new THREE.Fog(new THREE.Color(A.sky[1]), 18, 60);
  BS.ground.material.color.setHex(A.ground); BS.plats.forEach(p => p.top.material.color.setHex(A.plat));
  BS.hemi.intensity = A.hemi; BS.sun.intensity = A.sun; BS.sun.color.setHex(A.sunC || 0xffffff);
  if (BS.weather) { BS.scene.remove(BS.weather.pts); BS.weather = null; }
  const wk = { forest: 'leaves', crater: 'embers', storm: 'rain', domo: 'aura', lake: 'sparkle', town: 'petals' }[kind];
  if (wk && OPT.particles) BS.weather = makeWeather(wk, BS.scene);
  BS.kind = kind;
}

/* ---------------- EFECTOS VISUALES ---------------- */
const TCOL = { Tierra: 0xb0773a, Lucha: 0xc0453a, Eléctrico: 0xffe040, Planta: 0x6fd05a, Fuego: 0xff6a20, Agua: 0x4fa8ff, Aire: 0xd8f4ff };
function spawn(mesh) { BS.scene.add(mesh); return mesh; }
function kill(mesh) { BS.scene.remove(mesh); mesh.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); }
const centerOf = r => r.g.position.clone().add(new THREE.Vector3(0, r.size * .45, 0));
async function fxProjectile(from, to, t) {
  const S = BS.scene, a = centerOf(from), b = centerOf(to), parts = [];
  const N = { Fuego: 16, Agua: 12, Planta: 14, Aire: 3, Eléctrico: 0, Tierra: 0 }[t] ?? 8;
  if (t === 'Eléctrico') { sfx('elec'); await fxBolt(to); return; }
  if (t === 'Tierra' || t === 'Lucha') { sfx('rock'); await fxRocks(to); return; }
  sfx({ Fuego: 'fire', Agua: 'water', Planta: 'leaf', Aire: 'wind' }[t] || 'hit');
  for (let i = 0; i < N; i++) {
    let m;
    if (t === 'Fuego') m = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTexture('dot'), color: i % 3 ? 0xff7a20 : 0xffd040, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
    else if (t === 'Agua') m = new THREE.Mesh(new THREE.SphereGeometry(.12 + Math.random() * .1, 10, 8), new THREE.MeshPhongMaterial({ color: 0x9ad8ff, transparent: true, opacity: .7, shininess: 100 }));
    else if (t === 'Planta') { m = new THREE.Mesh(new THREE.PlaneGeometry(.3, .16), new THREE.MeshBasicMaterial({ color: i % 2 ? 0x6fd05a : 0x4fae4a, side: THREE.DoubleSide })); }
    else if (t === 'Aire') { m = new THREE.Mesh(new THREE.TorusGeometry(.5, .06, 6, 24), new THREE.MeshBasicMaterial({ color: 0xe8f8ff, transparent: true, opacity: .8 })); }
    else m = new THREE.Mesh(new THREE.SphereGeometry(.15, 8, 6), new THREE.MeshBasicMaterial({ color: TCOL[t] || 0xffffff }));
    m.visible = false; spawn(m); parts.push({ m, d: i * (t === 'Aire' ? 110 : 35), off: new THREE.Vector3((Math.random() - .5) * .6, (Math.random() - .5) * .6, (Math.random() - .5) * .6), sp: Math.random() * 6 });
  }
  const dur = 420 + N * 35;
  await tween(dur, k => {
    const ms = k * dur;
    parts.forEach(p => {
      const kk = clamp((ms - p.d) / 420, 0, 1); p.m.visible = kk > 0 && kk < 1;
      p.m.position.lerpVectors(a, b, kk).add(p.off.clone().multiplyScalar(Math.sin(kk * PI)));
      if (t === 'Agua' || t === 'Fuego') p.m.position.y += Math.sin(kk * PI) * .6;
      if (t === 'Planta') { p.m.rotation.set(kk * 8 + p.sp, kk * 6, p.sp); p.m.position.y += Math.sin(kk * PI * 2 + p.sp) * .4; }
      if (t === 'Aire') { p.m.lookAt(b); p.m.scale.setScalar(.6 + kk); p.m.rotation.z = kk * 10; }
      if (t === 'Fuego') p.m.scale.setScalar(.4 + kk * .6);
    });
  });
  parts.forEach(p => kill(p.m));
  await fxBurst(b, TCOL[t], t === 'Fuego' ? 20 : 12);
}
async function fxBurst(pos, col, n = 12) {
  const ps = []; for (let i = 0; i < n; i++) { const s = spawn(new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTexture('dot'), color: col, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }))); s.position.copy(pos); ps.push({ s, v: new THREE.Vector3(Math.random() - .5, Math.random() - .2, Math.random() - .5).normalize().multiplyScalar(1.5 + Math.random() * 1.5) }); }
  await tween(380, k => ps.forEach(p => { p.s.position.copy(pos).addScaledVector(p.v, k); p.s.material.opacity = 1 - k; p.s.scale.setScalar(.5 + k * .4); }));
  ps.forEach(p => kill(p.s));
}
async function fxBolt(to) {
  const b = centerOf(to), pts = []; let p = b.clone().add(new THREE.Vector3((Math.random() - .5) * 2, 9, 0));
  for (let i = 0; i <= 10; i++) { const k = i / 10; pts.push(new THREE.Vector3(p.x + (b.x - p.x) * k + (i && i < 10 ? (Math.random() - .5) * .8 : 0), p.y + (b.y - p.y) * k, p.z + (b.z - p.z) * k + (i && i < 10 ? (Math.random() - .5) * .5 : 0))); }
  const line = spawn(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xfff6a0 })));
  const glow = spawn(new THREE.PointLight(0xffe040, 4, 12)); glow.position.copy(b);
  for (let i = 0; i < 3; i++) { $('#flash').style.opacity = .55; line.visible = true; await sleep(60); $('#flash').style.opacity = 0; line.visible = false; await sleep(50); }
  kill(line); BS.scene.remove(glow);
  await fxBurst(b, 0xffe040, 16);
}
async function fxRocks(to) {
  const rocks = []; for (let i = 0; i < 7; i++) { const r = spawn(new THREE.Mesh(new THREE.DodecahedronGeometry(.18 + Math.random() * .22, 0), phong(0x8a6a4a))); r.position.copy(to.g.position).add(new THREE.Vector3((Math.random() - .5) * 2.2, -.3, (Math.random() - .5) * 1.4)); rocks.push({ r, h: 1 + Math.random() * 1.5, d: Math.random() * .3 }); }
  await tween(520, k => rocks.forEach(o => { const kk = clamp(k - o.d, 0, 1); o.r.position.y = Math.sin(kk * PI) * o.h; o.r.rotation.x = kk * 6; }));
  shakeBattle(.3, 350); rocks.forEach(o => kill(o.r));
}
async function fxAura(r, col, up = true) {
  const ps = []; for (let i = 0; i < 18; i++) { const s = spawn(new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTexture('dot'), color: col, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }))); const a = i / 18 * PI * 2; ps.push({ s, a, h: Math.random() }); }
  const c = r.g.position;
  await tween(700, k => ps.forEach(p => { const rad = r.size * .4; p.s.position.set(c.x + Math.cos(p.a + k * 4) * rad, c.y + (up ? (p.h + k) : (1 - k + p.h)) * r.size * .6, c.z + Math.sin(p.a + k * 4) * rad * .6); p.s.material.opacity = Math.sin(k * PI); p.s.scale.setScalar(.35); }));
  ps.forEach(p => kill(p.s));
}
let bShakeAmt = 0, bShakeEnd = 0;
function shakeBattle(a, ms) { bShakeAmt = a; bShakeEnd = performance.now() + ms; }
function damagePopup(r, txt, cls = '') {
  const v = centerOf(r).add(new THREE.Vector3(0, r.size * .3, 0)).project(BS.cam);
  const d = document.createElement('div'); d.className = 'dmg ' + cls; d.textContent = txt;
  d.style.left = ((v.x + 1) / 2 * innerWidth) + 'px'; d.style.top = ((1 - v.y) / 2 * innerHeight) + 'px';
  $('#ui').appendChild(d); setTimeout(() => d.remove(), 1100);
}

/* ---------------- HUD ---------------- */
function hudEl(i) { return i === 0 ? $('#hudMe') : $('#hudFoe'); }
function drawHud(i, m, hp = m.hp, showXp = true) {
  const el = hudEl(i); el.classList.remove('hidden');
  el.querySelector('.nm').innerHTML = `${m.n} ${statusBadge(m)}`;
  el.querySelector('.lv').textContent = 'Nv' + m.lv;
  el.querySelector('.tys').innerHTML = SPECIES[m.id].t.map(t => `<i style="background:${TYPES[t].c}" title="${t}"></i>`).join('');
  const p = Math.max(0, hp / m.maxhp), bar = el.querySelector('.hpb i'); bar.style.width = p * 100 + '%'; bar.style.background = hpCol(p);
  const hn = el.querySelector('.hpn'); if (hn) hn.textContent = `${Math.ceil(Math.max(0, hp))}/${m.maxhp}`;
  const xb = el.querySelector('.xpb'); if (xb) { xb.style.visibility = showXp ? 'visible' : 'hidden'; xb.querySelector('i').style.width = xpFrac(m) * 100 + '%'; }
}
async function animHp(i, m, from, to) { await tween(clamp(250 + Math.abs(from - to) * 25, 250, 1000), k => drawHud(i, m, from + (to - from) * k, !BT.pvp)); }
async function animXp(a, b) { const i = $('#hudMe .xpb i'); await tween(500, k => i.style.width = (a + (b - a) * k) * 100 + '%'); }

/* ---------------- ESTADO DEL COMBATE ---------------- */
let BT = null; // combate en curso
const stMul = s => s >= 0 ? (2 + s) / 2 : 2 / (2 - s);
const newVol = () => ({ atk: 0, def: 0, spd: 0, shield: 0, nucleo: 0, ignifugo: 0, revive: 0, fly: 0, blind: 0, stun: 0, flinch: 0, last: null, sleepT: 0 });

async function battleTransition() {
  const f = $('#fade'); f.style.transition = 'none'; f.style.background = '#fff';
  for (let i = 0; i < 3; i++) { f.style.opacity = .85; await sleep(70); f.style.opacity = 0; await sleep(70); }
  const w = $('#wipe'); w.classList.remove('go'); void w.offsetWidth; w.classList.add('go'); await sleep(520);
  f.style.background = '#000'; f.style.opacity = 1; w.classList.remove('go');
}
function setMonSprite(i, m) {
  const r = BS.rigs[i], s = SPECIES[m.id];
  r.m.material.map = monTex(m.id, i === 0); r.m.material.needsUpdate = true; r.m.material.opacity = 1; r.m.material.color.setScalar(1);
  r.bob.position.y = 0; r.m.scale.setScalar(s.awake ? (i === 0 ? 1.06 : 1.15) : 1); r.g.position.copy(r.pos); r.g.rotation.set(0, 0, 0);
  r.aura.visible = !!s.awake; if (s.awake) r.aura.material.color.set(AWAKE_TINT[m.id]);
  r.shield.visible = false;
}
async function sendOut(i, m) {
  const r = BS.rigs[i]; setMonSprite(i, m); r.g.visible = true; sfx('out'); markSeen(m.id);
  const base = SPECIES[m.id].awake ? (i === 0 ? 1.06 : 1.15) : 1;
  await tween(380, k => { r.m.scale.setScalar(Math.max(.01, k) * base); r.m.material.color.setScalar(1 + 3 * (1 - k)); }, easeOut);
}
async function recall(i) { const r = BS.rigs[i], b = r.m.scale.x; await tween(260, k => { r.m.scale.setScalar(Math.max(.01, b * (1 - k))); r.m.material.color.setScalar(1 + 3 * k); }); r.g.visible = false; r.m.material.color.setScalar(1); }
async function faintAnim(i) { const r = BS.rigs[i]; sfx('faint'); r.aura.visible = false; r.shield.visible = false; await tween(520, k => { r.bob.position.y = -k * 3; r.m.material.opacity = 1 - k; }); r.g.visible = false; r.bob.position.y = 0; r.m.material.opacity = 1; }
async function hitFlash(i, crit) {
  const r = BS.rigs[i]; sfx(crit ? 'crit' : 'hit'); shakeBattle(crit ? .25 : .1, 250);
  for (let k = 0; k < 4; k++) { r.m.visible = k % 2 === 1; r.g.position.x = r.pos.x + (k % 2 ? .14 : -.14); await sleep(65); }
  r.m.visible = true; r.g.position.x = r.pos.x;
}
async function statAnim(i, up) { const r = BS.rigs[i]; sfx(up ? 'stat+' : 'stat-'); const fx = fxAura(r, up ? 0xff8a5a : 0x5a8aff, up); await tween(600, k => { const s = Math.sin(k * PI * 3); up ? r.m.material.color.setRGB(1 + s * .6, 1, 1) : r.m.material.color.setRGB(1, 1, 1 + s * .6); }); r.m.material.color.setScalar(1); await fx; }
async function lunge(i) { const a = BS.rigs[i], t = BS.rigs[1 - i], dir = t.pos.clone().sub(a.pos); await tween(130, k => a.g.position.copy(a.pos).addScaledVector(dir, .14 * k)); await tween(150, k => a.g.position.copy(a.pos).addScaledVector(dir, .14 * (1 - k))); }

/* ---------------- BATALLA ---------------- */
async function battle(opt) {
  const T = opt.trainer, wild = !!opt.wild, pvp = !!opt.pvp;
  const prevMode = mode;
  sfx('enc'); playMusic(pvp ? 'boss' : wild ? 'battle' : (T.music || (T.boss ? 'boss' : 'trainer')));
  await battleTransition();
  setArena(opt.arena || arenaKind()); mode = 'battle';
  const sides = [
    { team: pvp ? opt.pvp.teams[0] : G.party, ctrl: 'human', name: pvp ? 'JUGADOR 1' : G.name, idx: 0 },
    { team: pvp ? opt.pvp.teams[1] : wild ? [opt.wild] : teamFor(T.team).map(([id, l]) => makeMon(id, l)), ctrl: pvp ? 'human' : 'ai', name: pvp ? 'JUGADOR 2' : wild ? '' : T.name, idx: 1, potions: T ? (T.boss ? 2 : T.guardian ? 1 : 0) : 0 },
  ];
  BT = { sides, pvp, wild, T, revived: new Set(), fought: new Set(), runs: 0 };
  for (const s of sides) { s.active = s.team.find(m => m.hp > 0); s.v = newVol(); }
  BT.fought.add(sides[0].active);
  const NM = i => { const m = sides[i].active; if (pvp) return `${m.n} (J${i + 1})`; return i === 0 ? m.n : wild ? `${m.n} salvaje` : `${m.n} rival`; };
  BT.NM = NM;

  BS.rigs.forEach(r => r.g.visible = false); BS.tr.g.visible = false; BS.ball.visible = false;
  $('#hint').classList.add('hidden'); setDialog('');
  // presentación
  if (!wild && !pvp) { BS.tr.m.material.map = personTex(T.look, 'down', 0); BS.tr.m.material.needsUpdate = true; BS.tr.g.position.copy(FOE_POS); BS.tr.g.visible = true; }
  if (wild) { setMonSprite(1, sides[1].active); BS.rigs[1].g.visible = true; BS.rigs[1].m.material.color.setScalar(0); markSeen(sides[1].active.id); }
  BS.cam.position.set(-3, 1.4, 4.5);
  const camIn = tween(1100, k => BS.cam.position.set(-3 * (1 - k), 1.4 + 1.5 * k, 4.5 + 3.4 * k), easeInOut);
  await fade(0, 300); await camIn;
  if (wild) { await tween(400, k => BS.rigs[1].m.material.color.setScalar(k)); await say(`¡Un ${sides[1].active.n} salvaje aparece!`); }
  else if (pvp) { await say('¡Comienza el duelo entre JUGADOR 1 y JUGADOR 2!'); await say(`JUGADOR 2 envía a ${sides[1].active.n}.`, { auto: 400 }); await sendOut(1, sides[1].active); }
  else { await say(`¡${T.name} quiere luchar!`); await tween(450, k => BS.tr.g.position.x = FOE_POS.x + k * 8); BS.tr.g.visible = false; await say(`${T.name} envía a ${sides[1].active.n}.`, { auto: 400 }); await sendOut(1, sides[1].active); }
  drawHud(1, sides[1].active, undefined, false); hudEl(1).querySelector('.hpn') && 0;
  await say(pvp ? `JUGADOR 1 envía a ${sides[0].active.n}.` : `¡Adelante, ${sides[0].active.n}!`, { auto: 400 }); await sendOut(0, sides[0].active); drawHud(0, sides[0].active, undefined, !pvp);

  let result = null;
  while (!result) {
    // 1) elegir acciones
    const acts = [];
    for (const s of sides) {
      if (s.v.fly === 1) { acts.push({ type: 'move', mv: { id: 'vuelo', pp: 99, forced: 1 } }); continue; }
      if (s.ctrl === 'human') {
        if (pvp) { await say(`Turno de ${s.name}. (El otro jugador no mira...)`, { auto: 0 }); }
        const a = await chooseAction(s); if (a.type === 'run' && a.done) { result = a.result; break; }
        acts.push(a);
      } else acts.push(aiAction(s, sides[0]));
    }
    if (result) break;
    // 2) acciones que no son ataques (orden: J1, J2)
    for (let i = 0; i < 2 && !result; i++) {
      const a = acts[i], s = sides[i];
      if (a.type === 'run') {
        BT.runs++;
        if (s.active.spd * stMul(s.v.spd) >= sides[1].active.spd || Math.random() < .35 + BT.runs * .15) { sfx('back'); await say('¡Has escapado sin problemas!'); result = 'run'; }
        else await say('¡No has podido escapar!');
      } else if (a.type === 'ball') { if (await throwBall(a.item)) result = 'caught'; }
      else if (a.type === 'switch') await doSwitch(i, a.to);
      else if (a.type === 'used') { if (a.mon === s.active) await animHp(i, a.mon, a.from, a.mon.hp); await say(a.msg); if (a.mon === s.active) drawHud(i, s.active, undefined, !pvp && i === 0); }
      else if (a.type === 'boost') { G.bag[a.item]--; s.v.atk = Math.min(6, s.v.atk + 2); await statAnim(i, true); await say(`¡El ataque de ${s.active.n} sube mucho!`); }
      else if (a.type === 'aiheal') { s.potions--; const from = s.active.hp; s.active.hp = Math.min(s.active.maxhp, s.active.hp + 80); sfx('heal'); await say(`${s.name} usa una Superpoción.`, { auto: 400 }); await animHp(i, s.active, from, s.active.hp); }
      else if (a.type === 'surrender') { await say(`${s.name} se rinde.`); result = i === 0 ? 'lose' : 'win'; }
    }
    if (result) break;
    // 3) ataques por prioridad y velocidad
    const order = [0, 1].filter(i => acts[i].type === 'move').map(i => ({ i, mv: acts[i].mv, pri: MOVES[acts[i].mv.id].pri || 0, spd: effSpd(sides[i]) }));
    order.sort((a, b) => b.pri - a.pri || b.spd - a.spd || (Math.random() - .5));
    const acted = new Set();
    for (const o of order) {
      const s = sides[o.i]; if (s.active.hp <= 0) continue;
      // si el usuario cambió durante el turno (debilitado y sustituido) no ataca
      if (o.mon && o.mon !== s.active) continue;
      await doMove(o.i, o.mv, acted); acted.add(o.i);
      result = await checkFaints(); if (result) break;
    }
    if (result) break;
    // 4) fin de turno
    for (let i = 0; i < 2 && !result; i++) {
      const s = sides[i], m = s.active; if (m.hp <= 0) continue;
      s.v.flinch = 0; if (s.v.blind > 0) s.v.blind--;
      if (m.status === 'brn') {
        const d = Math.max(1, Math.floor(m.maxhp / 12)); sfx('fire'); await fxAura(BS.rigs[i], 0xff6a20, true);
        const from = m.hp; m.hp = Math.max(0, m.hp - d); damagePopup(BS.rigs[i], '-' + d, 'burn'); await animHp(i, m, from, m.hp); await say(`¡${NM(i)} sufre por las quemaduras!`, { auto: 500 });
        m.brnT = (m.brnT || 5) - 1; if (m.brnT <= 0 && m.hp > 0) { m.status = null; m.brnT = 0; drawHud(i, m, undefined, !pvp && i === 0); await say(`Las quemaduras de ${NM(i)} se han apagado.`); }
      } else if (m.status === 'par') {
        const d = Math.max(1, Math.floor(m.maxhp / 16)); sfx('elec');
        const from = m.hp; m.hp = Math.max(0, m.hp - d); damagePopup(BS.rigs[i], '-' + d, 'par'); await animHp(i, m, from, m.hp); await say(`¡La alta tensión daña a ${NM(i)}!`, { auto: 500 });
      }
      result = await checkFaints();
    }
  }
  return await endBattle(result, opt, prevMode);
}
function effSpd(s) { let v = s.active.spd * stMul(s.v.spd); if (s.active.status === 'par') v *= .5; return v; }

async function chooseAction(s) {
  const i = s.idx, me = s.active, pvp = BT.pvp, foe = BT.sides[1 - i].active;
  while (true) {
    setDialog(`¿Qué debería hacer ${me.n}?${pvp ? `  [${s.name}]` : ''}`);
    const c = await choose(['LUCHAR', 'MOCHILA', 'EQUIPO', pvp ? 'RENDIRSE' : 'HUIR'], { cls: 'm-battle', cols: 2 });
    if (c === 0) {
      const usable = me.moves.filter(v => v.pp > 0);
      if (!usable.length) return { type: 'move', mv: { id: 'pisoton', pp: 0, struggle: 1 } };
      const k = await choose(me.moves.map(v => {
        const M = MOVES[v.id], e = M.p ? typeEff(M.t, SPECIES[foe.id].t) : 1;
        const tag = !M.p ? '<em class="e0">APOYO</em>' : e > 1 ? '<em class="e2">¡EFICAZ!</em>' : e < 1 ? '<em class="e1">POCO EFICAZ</em>' : '';
        return { html: `<div class="mvbtn" style="--c:${TYPES[M.t].c}"><b>${M.n}</b><small>${M.t.toUpperCase()} · PP ${v.pp}/${M.pp} ${tag}</small></div>`, disabled: v.pp <= 0 };
      }), { cls: 'm-moves', cols: 2, cancel: true, onMove: idx => { const M = MOVES[me.moves[idx].id]; $('#mvinfo').innerHTML = `<b>${M.n}</b> · ${M.p ? 'Potencia ' + M.p : 'Apoyo'} · ${M.a ? 'Precisión ' + M.a : 'Siempre acierta'}<br>${M.d}`; $('#mvinfo').classList.remove('hidden'); } });
      $('#mvinfo').classList.add('hidden');
      if (k >= 0) return { type: 'move', mv: me.moves[k], mon: me };
    } else if (c === 1) {
      if (pvp) { await say('En los duelos no se pueden usar objetos.'); continue; }
      const r = await bagScreen(true); if (!r) continue;
      if (r.type === 'ball' && !BT.wild) { await say('¡No puedes capturar el Auralis de otro entrenador!'); continue; }
      return r;
    } else if (c === 2) {
      setDialog('Elige un Auralis.');
      const k = await choose(s.team.map(monRow), { cls: 'm-list', cancel: true, title: 'EQUIPO' }); if (k < 0) continue;
      const t = s.team[k];
      if (t === me) { await say(`¡${me.n} ya está luchando!`); continue; }
      if (t.hp <= 0) { await say('¡No le quedan fuerzas para luchar!'); continue; }
      const c2 = await choose(['CAMBIAR', 'FICHA', 'VOLVER'], { cls: 'm-yn', cancel: true });
      if (c2 === 1) { await summaryScreen(t); continue; }
      if (c2 !== 0) continue;
      return { type: 'switch', to: k };
    } else {
      if (pvp) { await say('¿Seguro que quieres rendirte?', { nowait: true }); if (await yesno()) return { type: 'surrender' }; continue; }
      if (!BT.wild) { await say('¡No puedes huir de un combate contra un entrenador!'); continue; }
      return { type: 'run' };
    }
  }
}

function aiAction(s, foeSide) {
  const me = s.active, foe = foeSide.active, smart = !BT.wild;
  if (s.potions > 0 && me.hp < me.maxhp * .25 && Math.random() < .6) return { type: 'aiheal' };
  const ms = me.moves.filter(v => v.pp > 0); if (!ms.length) return { type: 'move', mv: { id: 'pisoton', pp: 0, struggle: 1 }, mon: me };
  const score = v => {
    const M = MOVES[v.id], fx = M.fx || {};
    if (M.p) {
      let sc = M.p * typeEff(M.t, SPECIES[foe.id].t) * (SPECIES[me.id].t.includes(M.t) ? 1.5 : 1) * ((M.a || 100) / 100);
      if (fx.status && !foe.status) sc *= 1.3; if (fx.status && foe.status) sc *= .8;
      if (fx.recoil && me.hp < me.maxhp * .3) sc *= .5;
      if (foeSide.v.fly && M.t === 'Tierra') sc *= .05;
      return sc;
    }
    if (!smart) return 25;
    if (fx.shield) return s.v.shield || s.v.last === v.id ? 2 : (me.hp < me.maxhp * .6 ? 55 : 25);
    if (fx.nucleo) return s.v.nucleo ? 1 : 45;
    if (fx.ignifugo) return s.v.ignifugo ? 1 : (SPECIES[foe.id].t.includes('Fuego') || me.status === 'brn' ? 70 : 10);
    if (fx.revive) return (s.v.revive || BT.revived.has(me)) ? 1 : (me.hp < me.maxhp * .55 ? 60 : 20);
    if (fx.heal) return (me.status || me.hp < me.maxhp * .45) ? 85 : 5;
    return 20;
  };
  const w = ms.map(v => Math.max(1, score(v)) ** (smart ? 2 : 1));
  let r = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < ms.length; i++) { r -= w[i]; if (r <= 0) return { type: 'move', mv: ms[i], mon: me }; }
  return { type: 'move', mv: ms[0], mon: me };
}

async function doSwitch(i, to) {
  const s = BT.sides[i];
  await say(BT.pvp ? `¡${s.name} retira a ${s.active.n}!` : i === 0 ? `¡Vuelve, ${s.active.n}!` : `${s.name} retira a ${s.active.n}.`, { auto: 350 });
  await recall(i); s.active = s.team[to]; s.v = newVol(); if (i === 0) BT.fought.add(s.active);
  await say(BT.pvp ? `${s.name} envía a ${s.active.n}.` : i === 0 ? `¡Adelante, ${s.active.n}!` : `${s.name} envía a ${s.active.n}.`, { auto: 350 });
  await sendOut(i, s.active); drawHud(i, s.active, undefined, !BT.pvp && i === 0);
}

async function doMove(i, mv, acted) {
  const S = BT.sides, s = S[i], o = S[1 - i], att = s.active, def = o.active, NM = BT.NM;
  const M = MOVES[mv.id], fx = M.fx || {};
  const r = BS.rigs[i], tr = BS.rigs[1 - i];
  // impedimentos
  if (s.v.flinch) { s.v.flinch = 0; await say(`¡${NM(i)} retrocede y no puede atacar!`); return; }
  if (s.v.stun) { s.v.stun = 0; await say(`¡${NM(i)} está aturdido y no puede moverse!`); s.v.fly = 0; r.bob.position.y = 0; return; }
  if (att.status === 'slp') {
    if (--att.slpT > 0) { await fxAura(r, 0x8a8aff, true); await say(`${NM(i)} está profundamente dormido...`); return; }
    att.status = null; drawHud(i, att, undefined, !BT.pvp && i === 0); await say(`¡${NM(i)} se ha despertado!`);
  }
  if (att.status === 'par' && Math.random() < .25) { sfx('elec'); await fxAura(r, 0xffe040, true); await say(`¡${NM(i)} está paralizado! No puede moverse.`); return; }
  if (!mv.forced && !mv.struggle) mv.pp = Math.max(0, mv.pp - 1);
  // Vuelo: primer turno se eleva
  if (fx.fly && !s.v.fly) {
    await say(`¡${NM(i)} usa ${M.n}!`, { auto: 350 }); sfx('wind');
    s.v.fly = 1; await tween(450, k => r.bob.position.y = k * 5, easeOut); await say(`¡${NM(i)} se eleva por los aires!`); return;
  }
  await say(`¡${NM(i)} usa ${M.n}!`, { auto: 420 });
  if (fx.fly) { s.v.fly = 0; await tween(260, k => r.bob.position.y = 5 * (1 - k)); }
  s.v.lastPrev = s.v.last; s.v.last = mv.id;
  // apoyo
  if (!M.p) return await supportMove(i, M, mv);
  // precisión / evasión
  let acc = M.a ? M.a * (s.v.blind > 0 ? .6 : 1) : 999;
  if (o.v.fly && !fx.pierce) { if (M.t === 'Tierra') acc = 0; else acc *= .7; }
  if (Math.random() * 100 >= acc) { await lunge(i); await say(o.v.fly ? `¡${NM(1 - i)} está en el aire y esquiva el ataque!` : `¡${NM(i)} ha fallado!`); return; }
  await lunge(i);
  if (o.v.shield && !fx.pierce) { o.v.shield = 0; tr.shield.visible = false; sfx('shield'); await fxBurst(centerOf(tr), 0x9ad8ff, 14); await say(`¡La barrera de ${NM(1 - i)} bloquea el ataque y se rompe!`); return; }
  await fxProjectile(r, tr, M.t);
  // daño
  const defT = SPECIES[def.id].t; let e = typeEff(M.t, defT);
  if (fx.pierce) e = Math.max(e, 1);
  const stab = SPECIES[att.id].t.includes(M.t) ? 1.5 : 1;
  const critRate = M.crit || 1 / 16, crit = Math.random() < critRate ? 1.5 : 1;
  const A = att.atk * stMul(fx.pierce ? Math.max(0, s.v.atk) : s.v.atk) * (att.status === 'brn' ? .75 : 1), D = def.def * stMul(fx.pierce ? Math.min(0, o.v.def) : o.v.def);
  let mod = 1;
  if (s.v.nucleo && M.t === 'Tierra') mod *= 1.5;
  if (o.v.nucleo && M.t === 'Tierra') mod *= .5;
  if (o.v.ignifugo && M.t === 'Fuego') mod *= .5;
  const pw = mv.struggle ? 30 : M.p;
  let dmg = Math.max(1, Math.floor(((2 * att.lv / 5 + 2) * pw * A / D / 50 + 2) * stab * e * crit * mod * (.85 + Math.random() * .15)));
  dmg = Math.min(dmg, def.hp);
  await hitFlash(1 - i, crit > 1);
  const from = def.hp; def.hp -= dmg; damagePopup(tr, '-' + dmg, crit > 1 ? 'crit' : e > 1 ? 'super' : e < 1 ? 'weak' : '');
  await animHp(1 - i, def, from, def.hp);
  if (crit > 1) await say('¡Un golpe crítico!', { auto: 600 });
  if (e > 1) await say('¡Es muy eficaz!', { auto: 600 }); else if (e < 1) await say('No es muy eficaz...', { auto: 600 });
  // efectos secundarios
  if (fx.drain && att.hp > 0) { const h = Math.max(1, Math.floor(dmg * fx.drain)); const f2 = att.hp; att.hp = Math.min(att.maxhp, att.hp + h); if (att.hp > f2) { await fxAura(r, 0x6fd05a, true); await animHp(i, att, f2, att.hp); await say(`¡${NM(i)} absorbe energía vital!`, { auto: 600 }); } }
  if (fx.recoil) { const rc = Math.max(1, Math.floor(dmg * fx.recoil)); const f2 = att.hp; att.hp = Math.max(0, att.hp - rc); await hitFlash(i); await animHp(i, att, f2, att.hp); await say(`¡${NM(i)} también sufre el impacto!`, { auto: 600 }); }
  if (fx.selfDef) { s.v.def = Math.max(-6, s.v.def - 1); await statAnim(i, false); await say(`¡La defensa de ${NM(i)} baja!`, { auto: 600 }); }
  if (def.hp > 0) {
    if (fx.foeSpd) { o.v.spd = Math.max(-6, o.v.spd - 1); await statAnim(1 - i, false); await say(`¡La corriente frena a ${NM(1 - i)}!`, { auto: 600 }); }
    if (fx.blind && Math.random() < fx.blind) { o.v.blind = 3; sfx('elec'); await say(`¡${NM(1 - i)} ha quedado cegado!`, { auto: 600 }); }
    if (fx.stun && Math.random() < fx.stun) { o.v.stun = 1; await say(`¡${NM(1 - i)} ha quedado aturdido!`, { auto: 600 }); }
    if (fx.flinch && !acted.has(1 - i) && Math.random() < fx.flinch) o.v.flinch = 1;
    if (fx.status && !def.status && Math.random() < fx.chance) await applyStatus(1 - i, fx.status);
  }
}
async function applyStatus(i, st) {
  const s = BT.sides[i], m = s.active, t = SPECIES[m.id].t, NM = BT.NM;
  if (st === 'brn' && (t.includes('Fuego') || s.v.ignifugo)) { await say(`¡${NM(i)} es inmune a las quemaduras!`); return; }
  if (st === 'par' && t.includes('Eléctrico')) { await say(`¡${NM(i)} absorbe la electricidad!`); return; }
  m.status = st; if (st === 'brn') m.brnT = 5; if (st === 'slp') m.slpT = rnd(2, 4);
  drawHud(i, m, undefined, !BT.pvp && i === 0);
  const col = { brn: 0xff6a20, par: 0xffe040, slp: 0x8a8aff }[st]; await fxAura(BS.rigs[i], col, true);
  await say({ brn: `¡${NM(i)} se ha quemado! Sufrirá daño durante 5 turnos.`, par: `¡${NM(i)} está paralizado! Puede que no se mueva.`, slp: `¡${NM(i)} se ha dormido!` }[st]);
}
async function supportMove(i, M, mv) {
  const s = BT.sides[i], m = s.active, r = BS.rigs[i], fx = M.fx, NM = BT.NM;
  if (fx.shield) {
    if (s.v.lastPrev === mv.id && Math.random() < .5) { await say('¡Pero ha fallado!'); return; }
    s.v.shield = 1; r.shield.visible = true; r.shield.material.color.setHex(M.t === 'Agua' ? 0x9ad8ff : 0xc8a070); sfx('shield');
    await tween(350, k => r.shield.scale.setScalar(.3 + k * .7), easeOut);
    await say(M.t === 'Agua' ? `¡Una burbuja protege a ${NM(i)}!` : `¡Una coraza de piedra protege a ${NM(i)}!`);
  } else if (fx.nucleo) {
    if (s.v.nucleo) { await say('¡El núcleo ya está activo!'); return; }
    s.v.nucleo = 1; s.v.def = Math.min(6, s.v.def + 1); sfx('rock'); shakeBattle(.2, 300); await fxAura(r, 0xff8a2a, true);
    await say(`¡El Núcleo Terrestre de ${NM(i)} se activa! Sus ataques de Tierra se potencian y resiste ese elemento.`);
  } else if (fx.ignifugo) {
    s.v.ignifugo = 1; await fxAura(r, 0xff5a2a, true);
    if (m.status === 'brn') { m.status = null; drawHud(i, m, undefined, !BT.pvp && i === 0); }
    await say(`¡${NM(i)} se vuelve ignífugo! El Fuego le hace menos daño y no puede quemarse.`);
  } else if (fx.revive) {
    if (BT.revived.has(m) || s.v.revive) { await say('¡Pero ha fallado! Solo funciona una vez por combate.'); return; }
    s.v.revive = fx.revive; sfx('awake'); await fxAura(r, fx.revive >= 1 ? 0xffb030 : 0x9dff6a, true);
    await say(fx.revive >= 1 ? `¡${NM(i)} se envuelve en llamas eternas! Si cae, renacerá de sus cenizas.` : `¡${NM(i)} echa raíces de vida! Si cae, volverá a brotar.`);
  } else if (fx.heal || fx.cure) {
    const had = m.status; if (fx.cure) m.status = null;
    const from = m.hp; m.hp = Math.min(m.maxhp, m.hp + Math.floor(m.maxhp * (fx.heal || 0)));
    sfx('heal'); await fxAura(r, 0x6fd8ff, true); drawHud(i, m, undefined, !BT.pvp && i === 0);
    if (m.hp > from) await animHp(i, m, from, m.hp);
    await say(`¡${NM(i)} se hidrata${had ? ' y se cura de su estado' : ''} y recupera ${m.hp - from} PS!`);
  }
}

async function checkFaints() {
  const S = BT.sides, NM = BT.NM;
  for (const i of [1, 0]) {
    const s = S[i], m = s.active; if (m.hp > 0) continue;
    // Renacer / Fénix
    if (s.v.revive && !BT.revived.has(m)) {
      BT.revived.add(m); const f = s.v.revive; s.v.revive = 0;
      sfx('awake'); const r = BS.rigs[i]; await fxAura(r, f >= 1 ? 0xffb030 : 0x9dff6a, true);
      m.hp = Math.max(1, Math.floor(m.maxhp * f)); m.status = null; await tween(400, k => r.m.material.color.setScalar(1 + 3 * (1 - k)));
      drawHud(i, m, undefined, !BT.pvp && i === 0);
      await say(f >= 1 ? `¡${NM(i)} RENACE DE SUS CENIZAS con todos sus PS!` : `¡${NM(i)} vuelve a brotar con la mitad de sus PS!`);
      continue;
    }
    await faintAnim(i); hudEl(i).classList.add('hidden');
    await say(`¡${NM(i)} se ha debilitado!`);
    if (i === 1 && !BT.pvp) await awardExp(m);
    const next = s.team.findIndex(t => t.hp > 0);
    if (next < 0) return i === 1 ? 'win' : 'lose';
    if (s.ctrl === 'ai') {
      s.active = s.team[next]; s.v = newVol();
      await say(`${s.name} envía a ${s.active.n}.`, { auto: 400 }); await sendOut(1, s.active); drawHud(1, s.active, undefined, false);
      BT.fought = new Set([S[0].active]);
    } else {
      setDialog(BT.pvp ? `${s.name}: elige tu siguiente Auralis.` : 'Elige tu siguiente Auralis.');
      let k; while (true) { k = await choose(s.team.map(monRow), { cls: 'm-list', title: 'EQUIPO' }); if (s.team[k].hp > 0) break; await say('¡No le quedan fuerzas para luchar!'); }
      s.active = s.team[k]; s.v = newVol(); if (i === 0) BT.fought.add(s.active);
      await say(BT.pvp ? `${s.name} envía a ${s.active.n}.` : `¡Adelante, ${s.active.n}!`, { auto: 350 }); await sendOut(i, s.active); drawHud(i, s.active, undefined, !BT.pvp && i === 0);
    }
  }
  return null;
}

async function awardExp(foe) {
  const base = Math.floor(SPECIES[foe.id].xp * foe.lv / 7 * (BT.wild ? 1 : 1.5) * 1.5);
  const me = BT.sides[0].active;
  for (const m of G.party) {
    if (m.hp <= 0) continue;
    const share = BT.fought.has(m) ? base : Math.floor(base / 2);
    if (share > 0) await gainExp(m, share, m === me, !BT.fought.has(m));
  }
}
async function gainExp(m, amt, active, shared) {
  await say(shared ? `${m.n} recibe ${amt} EXP del aura compartida.` : `¡${m.n} gana ${amt} puntos de EXP!`, { auto: shared ? 500 : 0 });
  let cur = xpFrac(m); m.exp += amt;
  while (m.lv < 100 && m.exp >= (m.lv + 1) ** 3) {
    if (active) await animXp(cur, 1); cur = 0;
    const old = { hp: m.maxhp, atk: m.atk, def: m.def, spd: m.spd }; m.lv++; calc(m); m.hp = Math.min(m.maxhp, m.hp + (m.maxhp - old.hp));
    if (active) drawHud(0, m); sfx('lvl');
    await say(`¡${m.n} sube al nivel ${m.lv}!\nPS +${m.maxhp - old.hp}  ATQ +${m.atk - old.atk}  DEF +${m.def - old.def}  VEL +${m.spd - old.spd}`);
    await learnMoves(m);
  }
  if (active) await animXp(cur, xpFrac(m));
}
async function learnMoves(m) {
  for (const [l, mid] of SPECIES[m.id].learn) {
    if (l !== m.lv || m.moves.some(v => v.id === mid)) continue; const M = MOVES[mid];
    if (m.moves.length < 4) { m.moves.push({ id: mid, pp: M.pp }); sfx('lvl'); await say(`¡${m.n} ha aprendido ${M.n}!`); continue; }
    await say(`${m.n} quiere aprender ${M.n}, pero ya conoce 4 habilidades.`);
    await say(`¿Olvidar una habilidad para aprender ${M.n}?`, { nowait: true });
    if (await yesno()) {
      setDialog('¿Cuál debe olvidar?');
      const k = await choose(m.moves.map(v => MOVES[v.id].n), { cls: 'm-yn', cancel: true });
      if (k >= 0) { const old = MOVES[m.moves[k].id].n; m.moves[k] = { id: mid, pp: M.pp }; await say(`1, 2 y... ¡puf! ${m.n} olvidó ${old} y aprendió ${M.n}.`); continue; }
    }
    await say(`${m.n} no aprendió ${M.n}.`);
  }
}

async function throwBall(item) {
  const foe = BT.sides[1].active, it = ITEMS[item]; G.bag[item]--;
  await say(`¡Lanzas una ${it.n}!`, { auto: 250 });
  const b = BS.ball, s = ME_POS.clone().add(new THREE.Vector3(.8, 1.6, 0)), e = FOE_POS.clone().add(new THREE.Vector3(0, 1.3, 0)); b.visible = true; b.rotation.set(0, 0, 0); b.scale.setScalar(1);
  await tween(600, k => { b.position.lerpVectors(s, e, k); b.position.y += Math.sin(k * PI) * 1.7; b.rotation.x = k * 14; });
  const r = BS.rigs[1], base = r.m.scale.x;
  await fxBurst(e, 0x58e0d0, 14);
  await tween(260, k => { r.m.scale.setScalar(Math.max(.01, base * (1 - k))); r.m.material.color.setScalar(1 + 3 * k); }); r.g.visible = false;
  await tween(280, k => { b.position.y = e.y - (e.y - FOE_POS.y - .25) * k * k; }); b.rotation.x = 0;
  const sp = SPECIES[foe.id], bonus = foe.status === 'slp' ? 2 : foe.status ? 1.5 : 1;
  const a = (3 * foe.maxhp - 2 * foe.hp) * sp.rate * it.mult * bonus / (3 * foe.maxhp), q = Math.cbrt(clamp(a / 255 * 1.3 + .03, 0, 1));
  let sh = 0;
  for (let k = 0; k < 3; k++) { await sleep(380); sfx('wob'); await tween(440, t => b.rotation.z = Math.sin(t * PI * 2) * .5); if (Math.random() < q) sh++; else break; }
  if (sh === 3) {
    sfx('catch'); await fxBurst(b.position.clone(), 0xffe080, 20);
    await say(`¡Bien! ¡Has capturado a ${foe.n}!`); b.visible = false; r.m.scale.setScalar(base); r.m.material.color.setScalar(1);
    const first = !(G.caught && G.caught[foe.id]); markCaught(foe.id);
    if (first) await say(`Los datos de ${foe.n} se han registrado en el Archivo Auralis.`);
    foe.status = null;
    if (G.party.length < 6) G.party.push(foe); else { G.pc.push(foe); await say(`Tu equipo está lleno. ${foe.n} se ha enviado al almacén de aura.`); }
    return true;
  }
  b.visible = false; r.g.visible = true; await fxBurst(b.position.clone(), 0x58e0d0, 10);
  await tween(260, k => { r.m.scale.setScalar(Math.max(.01, base * k)); r.m.material.color.setScalar(4 - 3 * k); });
  await say(['¡Oh, no! ¡Se ha escapado!', '¡Vaya! ¡Parecía atrapado!', '¡Uf! ¡Casi lo consigues!'][sh]);
  return false;
}

async function awaken(m) {
  const to = SPECIES[m.id].evo[0], r = BS.rigs[1];
  hudEl(0).classList.add('hidden'); hudEl(1).classList.add('hidden'); BS.rigs[0].g.visible = false; BS.tr.g.visible = false;
  r.pos = new THREE.Vector3(0, .2, -.6); setMonSprite(1, m); r.g.position.copy(r.pos); r.g.visible = true;
  playMusic('title');
  await say(`¿Qué ocurre? ¡El aura de ${m.n} se está desbordando!`, { auto: 900 });
  const tf = monTex(m.id, false), tt = monTex(to, false);
  for (let i = 0; i < 16; i++) { r.m.material.map = i % 2 ? tt : tf; r.m.material.color.setScalar(2.4); sfx('move'); await sleep(Math.max(55, 280 - i * 15)); r.m.material.color.setScalar(1); }
  r.m.material.map = tt; sfx('awake'); $('#flash').style.opacity = 1; await sleep(120); $('#flash').style.opacity = 0;
  const old = m.n, om = m.maxhp; m.id = to; m.n = SPECIES[to].n; calc(m); m.hp = Math.min(m.maxhp, m.hp + m.maxhp - om);
  setMonSprite(1, m); r.g.position.copy(r.pos); r.g.visible = true; await fxAura(r, new THREE.Color(AWAKE_TINT[to]).getHex(), true);
  markCaught(to);
  await say(`¡${old} ha DESPERTADO en ${m.n}!`);
  r.g.visible = false; r.pos = FOE_POS; r.aura.visible = false;
}

async function endBattle(result, opt, prevMode) {
  const T = opt.trainer; clearMenus(); $('#mvinfo').classList.add('hidden');
  let blackout = false;
  if (opt.pvp) {
    sfx('victory'); await say(`¡${result === 'win' ? 'JUGADOR 1' : 'JUGADOR 2'} gana el duelo!`);
  } else if (result === 'win' && T) {
    playMusic('ending'); sfx('victory');
    BS.tr.g.visible = true; BS.tr.g.position.copy(FOE_POS).add(new THREE.Vector3(8, 0, 0)); await tween(450, k => BS.tr.g.position.x = FOE_POS.x + 8 * (1 - k));
    await say(`¡Has derrotado a ${T.name}!`); if (T.lose) await say(`${T.name}: ${T.lose}`);
    G.money += T.money; await say(`Has ganado ${T.money} monedas.`);
  } else if (result === 'win' && opt.wild) { sfx('victory'); }
  if (result === 'lose' && !opt.pvp) {
    if (T && T.win) await say(`${T.name}: ${T.win}`);
    if (opt.noBlackout) healAll();
    else { await say('¡No te quedan Auralis en condiciones de luchar!'); await say('Todo se vuelve negro...'); blackout = true; }
  }
  if (result !== 'lose' && !opt.pvp) for (const m of G.party) { const s = SPECIES[m.id]; if (s.evo && m.lv >= s.evo[1] && m.hp > 0) await awaken(m); }
  hudEl(0).classList.add('hidden'); hudEl(1).classList.add('hidden');
  await fade(1, 350);
  BS.rigs.forEach(r => r.g.visible = false); BS.tr.g.visible = false; BS.ball.visible = false;
  // Los efectos de combate (barreras, núcleo...) no persisten; el estado alterado sí.
  BT = null; mode = prevMode === 'title' ? 'title' : 'world'; hideDialog();
  if (opt.pvp) return result;
  updateHint();
  if (blackout) { G.money = Math.floor(G.money / 2); healAll(); await loadMap(G.respawn.map, G.respawn.x, G.respawn.y, 'down', { noFade: true, silent: true }); }
  playMusic(WD.map.music); refreshFollower();
  await fade(0, 350);
  if (blackout) await say('Te despiertas en un lugar seguro. Tus Auralis se han recuperado... pero has perdido la mitad de tus monedas.');
  save();
  return result;
}

function updateBattle(dt, T) {
  if (!BT && mode !== 'battle') return;
  BS.rigs.forEach((r, i) => {
    if (!r.g.visible) return;
    if (r.m.material.opacity >= 1 && !(BT && BT.sides[i].v.fly)) r.bob.position.y = i === 1 ? Math.abs(Math.sin(T * 2.6)) * .08 : 0;
    if (i === 0) r.bob.scale.y = 1 + Math.sin(T * 2.2) * .02;
    if (r.aura.visible) { const p = r.aura.geometry.attributes.position.array; for (let k = 0; k < 30; k++) { const a = k / 30 * PI * 2 + T * (k % 2 ? 1.2 : -.9); const rad = r.size * (.35 + (k % 3) * .06); p[k * 3] = Math.cos(a) * rad; p[k * 3 + 1] = r.size * (.15 + ((T * .4 + k * .13) % 1) * .8); p[k * 3 + 2] = Math.sin(a) * rad * .4; } r.aura.geometry.attributes.position.needsUpdate = true; }
    if (r.shield.visible) r.shield.material.opacity = .2 + Math.sin(T * 4) * .07;
  });
  BS.cam.position.x += (Math.sin(T * .35) * .4 - BS.cam.position.x) * .05;
  if (performance.now() < bShakeEnd) { BS.cam.position.x += (Math.random() - .5) * bShakeAmt; BS.cam.position.y += (Math.random() - .5) * bShakeAmt * .5; }
  BS.cam.lookAt(0, 1.05, -1.5);
  if (BS.weather) BS.weather.update(dt, 0, -2, T);
  if (BS.kind === 'storm' && Math.random() < dt * .1) { $('#flash').style.opacity = .4; setTimeout(() => { $('#flash').style.opacity = 0; sfx('thunder'); }, 90); }
  if (BS.lavaPlane) BS.lavaPlane.material.color.setHSL(.04, .9, .45 + Math.sin(T * 2) * .05);
}
