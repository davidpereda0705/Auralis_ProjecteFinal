'use strict';
/* =========================================================
   AUDIO — efectos y música chiptune procedural (original)
   ========================================================= */
const AUD = { ctx: null, master: null, music: null, sfx: null, track: null, step: 0, next: 0, timer: null, noise: null };

function ensureAudio() {
  if (AUD.ctx) { if (AUD.ctx.state === 'suspended') AUD.ctx.resume(); return true; }
  try {
    AUD.ctx = new (window.AudioContext || window.webkitAudioContext)();
    AUD.master = AUD.ctx.createGain(); AUD.master.connect(AUD.ctx.destination);
    AUD.music = AUD.ctx.createGain(); AUD.music.connect(AUD.master);
    AUD.sfx = AUD.ctx.createGain(); AUD.sfx.connect(AUD.master);
    const len = AUD.ctx.sampleRate * .5, buf = AUD.ctx.createBuffer(1, len, AUD.ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    AUD.noise = buf;
    applyVolumes();
    if (AUD.pending) { const p = AUD.pending; AUD.pending = null; playMusic(p); }
    return true;
  } catch (e) { return false; }
}
function applyVolumes() {
  if (!AUD.ctx) return;
  AUD.music.gain.value = (OPT.music / 10) * .55;
  AUD.sfx.gain.value = (OPT.sfx / 10) * .9;
}

function tone(f, d, w = 'square', v = .05, when = 0, f2 = null, out = null) {
  const c = AUD.ctx, t = c.currentTime + when;
  const o = c.createOscillator(), g = c.createGain();
  o.type = w; o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
  o.connect(g); g.connect(out || AUD.sfx); o.start(t); o.stop(t + d + .03);
}
function noiseHit(d, v, when = 0, hp = 1000, out = null) {
  const c = AUD.ctx, t = c.currentTime + when, s = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter();
  s.buffer = AUD.noise; f.type = 'highpass'; f.frequency.value = hp;
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
  s.connect(f); f.connect(g); g.connect(out || AUD.sfx); s.start(t); s.stop(t + d + .02);
}

function sfx(type) {
  if (!AUD.ctx) return;
  try {
    switch (type) {
      case 'sel':   tone(880, .05, 'square', .04); break;
      case 'move':  tone(660, .03, 'square', .025); break;
      case 'back':  tone(440, .06, 'square', .04, 0, 330); break;
      case 'bump':  tone(90, .08, 'square', .04); break;
      case 'door':  noiseHit(.15, .1, 0, 300); tone(200, .1, 'triangle', .06); break;
      case 'hit':   noiseHit(.12, .18, 0, 400); tone(180, .16, 'sawtooth', .06, 0, 50); break;
      case 'crit':  noiseHit(.2, .25, 0, 200); tone(300, .25, 'sawtooth', .08, 0, 40); break;
      case 'weak':  tone(160, .12, 'square', .05, 0, 120); break;
      case 'faint': tone(700, .8, 'square', .05, 0, 60); break;
      case 'lvl':   [523, 659, 784, 1047].forEach((f, i) => tone(f, .14, 'square', .05, i * .09)); break;
      case 'catch': [784, 988, 1175, 1568, 2093].forEach((f, i) => tone(f, .18, 'triangle', .08, i * .11)); break;
      case 'heal':  [523, 784, 659, 1047, 1319].forEach((f, i) => tone(f, .22, 'triangle', .06, i * .14)); break;
      case 'enc':   for (let i = 0; i < 10; i++) tone(300 + i * 90, .06, 'square', .04, i * .04); break;
      case 'wob':   tone(320, .1, 'triangle', .08); noiseHit(.05, .05); break;
      case 'stat+': tone(400, .3, 'sine', .06, 0, 1200); break;
      case 'stat-': tone(1000, .3, 'sine', .06, 0, 300); break;
      case 'out':   tone(300, .25, 'triangle', .07, 0, 1100); break;
      case 'item':  [1047, 1319, 1568].forEach((f, i) => tone(f, .12, 'square', .05, i * .08)); break;
      case 'shield':tone(600, .4, 'sine', .07, 0, 900); tone(900, .4, 'sine', .04, .05, 1300); break;
      case 'thunder': noiseHit(1.2, .35, 0, 60); break;
      case 'rock':  noiseHit(.3, .3, 0, 120); tone(80, .3, 'square', .08, 0, 40); break;
      case 'fire':  noiseHit(.5, .18, 0, 600); break;
      case 'water': for (let i = 0; i < 5; i++) tone(500 + Math.random() * 600, .08, 'sine', .05, i * .05, 200); break;
      case 'wind':  noiseHit(.7, .12, 0, 1500); break;
      case 'elec':  for (let i = 0; i < 6; i++) tone(200 + Math.random() * 1600, .04, 'sawtooth', .04, i * .03); break;
      case 'leaf':  for (let i = 0; i < 4; i++) tone(1200 + i * 200, .06, 'triangle', .04, i * .05); break;
      case 'awake': for (let i = 0; i < 12; i++) tone(262 * Math.pow(2, i / 6), .25, 'triangle', .05, i * .08); break;
      case 'victory': {
        const n = [[523, 0], [659, .12], [784, .24], [1047, .36], [988, .6], [1047, .72], [1319, .84]];
        n.forEach(([f, t]) => tone(f, .25, 'square', .05, t)); break;
      }
    }
  } catch (e) {}
}

/* ---------- MÚSICA ----------
   Cada paso es una corchea. '.' sostiene, '-' silencio.                  */
const NOTE_I = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
const midi = s => { const m = s.match(/^([A-G][#b]?)(\d)$/); return m ? NOTE_I[m[1]] + 12 * (+m[2] + 1) : null; };
const mfreq = n => 440 * Math.pow(2, (n - 69) / 12);

const TRACKS = {
  title: { bpm: 96, wave: 'square', drums: 'soft', bassStyle: 'pulse',
    lead: 'A4 . . . C5 . E5 . D5 . . . C5 . B4 . A4 . . . E5 . A5 . G5 . . . E5 . . . F5 . . . E5 . D5 . C5 . . . B4 . A4 . B4 . . . C5 . D5 . E5 . . . . . - - ',
    chords: ['A2', 'G2', 'A2', 'E2', 'F2', 'C3', 'G2', 'E2'] },
  town: { bpm: 108, wave: 'square', drums: 'soft', bassStyle: 'walk',
    lead: 'E5 . G5 . C6 . G5 . A5 . G5 . E5 . . . F5 . A5 . G5 . E5 . D5 . . . . . - - E5 . G5 . C6 . D6 . E6 . D6 . C6 . A5 . G5 . E5 . D5 . F5 . C5 . . . . . - - ',
    chords: ['C3', 'A2', 'F2', 'G2', 'C3', 'A2', 'D3', 'C3'] },
  home: { bpm: 84, wave: 'triangle', drums: null, bassStyle: 'walk',
    lead: 'G5 . E5 . C5 . E5 . F5 . A5 . . . E5 . G5 . C6 . B5 . A5 . . . G5 . . . F5 . D5 . E5 . C5 . D5 . . . B4 . G4 . C5 . . . . . - - ',
    chords: ['C3', 'F2', 'C3', 'F2', 'C3', 'G2', 'G2', 'C3'] },
  route: { bpm: 132, wave: 'square', drums: 'beat', bassStyle: 'drive',
    lead: 'D5 . G5 . A5 B5 . . A5 . G5 . E5 . D5 . C5 . E5 . G5 . A5 . B5 . A5 . G5 . . . D5 . G5 . A5 B5 . . D6 . B5 . A5 . G5 . E5 . G5 . A5 . F#5 . G5 . . . . . - - ',
    chords: ['G2', 'E2', 'C3', 'D3', 'G2', 'B2', 'C3', 'D3'] },
  wild: { bpm: 118, wave: 'square', drums: 'beat', bassStyle: 'drive',
    lead: 'A4 . C5 . E5 . . . D5 . C5 . B4 . . . C5 . E5 . A5 . G5 . E5 . . . . . - - F5 . E5 . D5 . C5 . B4 . C5 . D5 . . . E5 . D5 . C5 . B4 . A4 . . . . . - - ',
    chords: ['A2', 'G2', 'A2', 'E2', 'F2', 'G2', 'E2', 'A2'] },
  battle: { bpm: 162, wave: 'square', drums: 'fast', bassStyle: 'octave',
    lead: 'E5 - E5 - G5 - E5 - D5 - D5 - B4 - D5 - C5 - C5 - E5 - G5 - F#5 . . . B5 . . . E5 - E5 - G5 - B5 - A5 - G5 - F#5 - E5 - C5 . E5 . D5 . B4 . E5 . . . . . - - ',
    chords: ['E2', 'B1', 'C2', 'B1', 'E2', 'D2', 'C2', 'B1'] },
  trainer: { bpm: 168, wave: 'square', drums: 'fast', bassStyle: 'octave',
    lead: 'A4 C5 E5 A5 G5 . E5 . F5 . E5 . D5 . C5 . D5 F5 A5 D6 C6 . A5 . B5 . . . G#5 . . . A4 C5 E5 A5 G5 . E5 . F5 . A5 . C6 . B5 . A5 . . . G#5 . A5 . . . - - ',
    chords: ['A2', 'F2', 'D2', 'E2', 'A2', 'F2', 'E2', 'A2'] },
  boss: { bpm: 150, wave: 'sawtooth', drums: 'fast', bassStyle: 'octave',
    lead: 'D5 . F5 . A5 . D6 . C6 . A5 . F5 . A5 . Bb5 . A5 . G5 . F5 . E5 . . . A4 . . . D5 . F5 . A5 . D6 . E6 . D6 . C#6 . A5 . Bb5 . G5 . E5 . C#5 . D5 . . . . . - - ',
    chords: ['D2', 'F2', 'G2', 'A1', 'D2', 'A1', 'G2', 'D2'] },
  domo: { bpm: 112, wave: 'square', drums: 'beat', bassStyle: 'pulse',
    lead: 'D5 . . . A4 . D5 . E5 . F5 . E5 . D5 . C5 . . . G4 . C5 . D5 . E5 . . . - - Bb4 . . . F5 . E5 . D5 . C5 . A4 . . . C#5 . E5 . A5 . G5 . E5 . C#5 . . . - - ',
    chords: ['D2', 'C2', 'Bb1', 'A1', 'D2', 'C2', 'Bb1', 'A1'] },
  ending: { bpm: 90, wave: 'triangle', drums: 'soft', bassStyle: 'walk',
    lead: 'C5 . E5 . G5 . C6 . B5 . G5 . E5 . . . A5 . . . G5 . F5 . E5 . . . D5 . . . F5 . A5 . C6 . D6 . . . B5 . G5 . C6 . . . . . . . - - ',
    chords: ['C3', 'E2', 'F2', 'G2', 'F2', 'G2', 'G2', 'C3'] },
};
for (const k in TRACKS) {
  const t = TRACKS[k]; t.steps = t.lead.trim().split(/\s+/); t.len = t.steps.length;
}

function playMusic(name) {
  if (!AUD.ctx) { AUD.pending = name; return; }
  if (AUD.track && AUD.track.name === name) return;
  stopMusic();
  const t = TRACKS[name]; if (!t) return;
  AUD.track = { ...t, name }; AUD.step = 0; AUD.next = AUD.ctx.currentTime + .08;
  AUD.timer = setInterval(scheduleMusic, 40);
}
function stopMusic() { if (AUD.timer) clearInterval(AUD.timer); AUD.timer = null; AUD.track = null; }
function scheduleMusic() {
  const t = AUD.track; if (!t) return;
  const sd = 60 / t.bpm / 2, c = AUD.ctx;
  while (AUD.next < c.currentTime + .2) {
    const i = AUD.step % t.len, when = AUD.next - c.currentTime;
    // melodía
    const tok = t.steps[i], n = midi(tok);
    if (n !== null) {
      let h = 1; while (t.steps[(i + h) % t.len] === '.' && h < 8) h++;
      tone(mfreq(n), sd * h * .92, t.wave, t.wave === 'sawtooth' ? .022 : t.wave === 'triangle' ? .07 : .032, Math.max(0, when), null, AUD.music);
    }
    // bajo
    const bar = Math.floor(i / 8) % t.chords.length, root = midi(t.chords[bar]), s8 = i % 8;
    if (root !== null) {
      let bn = null;
      if (t.bassStyle === 'octave') bn = s8 % 2 ? root + 12 : root;
      else if (t.bassStyle === 'drive') bn = s8 % 2 === 0 ? (s8 === 4 ? root + 7 : root) : null;
      else if (t.bassStyle === 'pulse') bn = s8 % 4 === 0 ? root : s8 % 4 === 2 ? root + 12 : null;
      else bn = [root, null, root + 7, null, root + 12, null, root + 7, null][s8];
      if (bn !== null) tone(mfreq(bn), sd * .9, 'triangle', .09, Math.max(0, when), null, AUD.music);
    }
    // percusión
    if (t.drums) {
      if (t.drums === 'fast') { if (s8 % 4 === 0) tone(110, .08, 'sine', .12, Math.max(0, when), 40, AUD.music); noiseHit(.03, s8 % 2 ? .03 : .05, Math.max(0, when), 6000, AUD.music); if (s8 === 4) noiseHit(.1, .07, Math.max(0, when), 1500, AUD.music); }
      else if (t.drums === 'beat') { if (s8 === 0 || s8 === 5) tone(110, .08, 'sine', .1, Math.max(0, when), 40, AUD.music); if (s8 % 2 === 0) noiseHit(.03, .025, Math.max(0, when), 7000, AUD.music); if (s8 === 4) noiseHit(.09, .05, Math.max(0, when), 1800, AUD.music); }
      else if (t.drums === 'soft') { if (s8 % 4 === 2) noiseHit(.03, .018, Math.max(0, when), 8000, AUD.music); }
    }
    AUD.next += sd; AUD.step++;
  }
}
