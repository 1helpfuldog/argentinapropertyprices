/**
 * 80s night-drive loop in D minor. Beat, bass, pad, sparse lead.
 * Web Audio only — no sample file.
 */
const BPM = 84;
const STEP = 60 / BPM / 4;
const LOOP = 128;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let delay: DelayNode | null = null;
let delayGain: GainNode | null = null;
let noise: AudioBuffer | null = null;
let wanted = true;
let running = false;
let nextNote = 0;
let stepIndex = 0;
let clock: number | null = null;
let padOsc: OscillatorNode[] = [];

const ROOTS = [146.83, 116.54, 174.61, 110];
const LEAD = [293.66, 349.23, 392, 440, 523.25, 440, 349.23, 293.66];

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  return ctx;
}

function noiseBuf(c: AudioContext): AudioBuffer {
  if (noise) return noise;
  const n = c.createBuffer(1, c.sampleRate * 0.4, c.sampleRate);
  const d = n.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  noise = n;
  return n;
}

function attach() {
  const c = ac();
  if (!c || master) return;
  master = c.createGain();
  master.gain.value = 0;

  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 2400;
  filter.Q.value = 0.7;
  master.connect(filter);
  filter.connect(c.destination);

  delay = c.createDelay();
  delay.delayTime.value = 60 / BPM / 2;
  delayGain = c.createGain();
  delayGain.gain.value = 0.22;
  delay.connect(delayGain);
  delayGain.connect(filter);
}

function env(g: GainNode, t: number, peak: number, a: number, r: number) {
  g.gain.cancelScheduledValues(t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + r);
}

function kick(c: AudioContext, t: number) {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(150, t);
  o.frequency.exponentialRampToValueAtTime(40, t + 0.14);
  env(g, t, 0.7, 0.008, 0.28);
  o.connect(g);
  g.connect(master!);
  o.start(t);
  o.stop(t + 0.32);
}

function snare(c: AudioContext, t: number) {
  const src = c.createBufferSource();
  src.buffer = noiseBuf(c);
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 1800;
  bp.Q.value = 0.9;
  const g = c.createGain();
  env(g, t, 0.22, 0.004, 0.12);
  src.connect(bp);
  bp.connect(g);
  g.connect(master!);
  src.start(t);
  src.stop(t + 0.18);
}

function hat(c: AudioContext, t: number, open: boolean) {
  const src = c.createBufferSource();
  src.buffer = noiseBuf(c);
  const hp = c.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 7000;
  const g = c.createGain();
  env(g, t, open ? 0.07 : 0.045, 0.002, open ? 0.09 : 0.03);
  src.connect(hp);
  hp.connect(g);
  g.connect(master!);
  src.start(t);
  src.stop(t + 0.12);
}

function bass(c: AudioContext, t: number, freq: number) {
  const o = c.createOscillator();
  const f = c.createBiquadFilter();
  const g = c.createGain();
  o.type = "sawtooth";
  o.frequency.value = freq / 2;
  f.type = "lowpass";
  f.frequency.setValueAtTime(420, t);
  f.frequency.exponentialRampToValueAtTime(140, t + 0.18);
  env(g, t, 0.18, 0.01, 0.22);
  o.connect(f);
  f.connect(g);
  g.connect(master!);
  o.start(t);
  o.stop(t + 0.28);
}

function lead(c: AudioContext, t: number, freq: number) {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "triangle";
  o.frequency.value = freq;
  env(g, t, 0.09, 0.02, 0.35);
  o.connect(g);
  g.connect(master!);
  if (delay) g.connect(delay);
  o.start(t);
  o.stop(t + 0.4);
}

function chordRoot(step: number): number {
  const bar = Math.floor(step / 16) % 8;
  return ROOTS[Math.floor(bar / 2) % ROOTS.length];
}

function startPad(c: AudioContext, t: number, root: number) {
  stopPad(t);
  const thirds = [1, 1.2, 1.5];
  padOsc = thirds.map((mult, i) => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = i === 1 ? "triangle" : "sine";
    o.frequency.value = root * mult;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.045, t + 0.4);
    o.connect(g);
    g.connect(master!);
    o.start(t);
    return o;
  });
}

function stopPad(t: number) {
  padOsc.forEach((o) => {
    try {
      o.stop(t + 0.01);
    } catch {
      /* already gone */
    }
  });
  padOsc = [];
}

function scheduleStep(step: number, t: number) {
  const c = ctx;
  if (!c || !master) return;
  const s = step % 16;
  const inLoop = step % LOOP;
  const root = chordRoot(inLoop);

  if (s === 0) kick(c, t);
  if (s === 8) kick(c, t);
  if (s === 4 || s === 12) snare(c, t);
  if (s % 2 === 0) hat(c, t, s % 8 === 6);

  if (s === 0 || s === 6 || s === 10) bass(c, t, root);
  if (s === 3) bass(c, t, root * 1.5);

  if (inLoop % 16 === 0) startPad(c, t, root);

  const leadBars = Math.floor(inLoop / 16) % 8 >= 4;
  if (leadBars && (s === 0 || s === 4 || s === 8 || s === 12)) {
    const i = Math.floor(inLoop / 4) % LEAD.length;
    lead(c, t, LEAD[i]);
  }
}

function tick() {
  if (!ctx || !running) return;
  while (nextNote < ctx.currentTime + 0.22) {
    scheduleStep(stepIndex, nextNote);
    nextNote += STEP;
    stepIndex += 1;
  }
}

function fade(to: number, ms = 700) {
  if (!ctx || !master) return;
  master.gain.cancelScheduledValues(ctx.currentTime);
  master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), ctx.currentTime);
  master.gain.exponentialRampToValueAtTime(Math.max(to, 0.0001), ctx.currentTime + ms / 1000);
  if (to === 0) master.gain.setValueAtTime(0, ctx.currentTime + ms / 1000);
}

export function soundWanted(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem("app.sound") !== "off";
}

export async function startSoundtrack() {
  wanted = soundWanted();
  if (!wanted) return;
  attach();
  if (!ctx || !master) return;
  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      return;
    }
  }
  if (!running) {
    running = true;
    nextNote = ctx.currentTime + 0.05;
    stepIndex = 0;
    tick();
    if (clock) window.clearInterval(clock);
    clock = window.setInterval(tick, 80);
  }
  fade(0.2, 900);
}

export function stopSoundtrack() {
  running = false;
  if (clock) {
    window.clearInterval(clock);
    clock = null;
  }
  if (ctx) stopPad(ctx.currentTime);
  fade(0, 400);
}

export function setSoundWanted(on: boolean) {
  wanted = on;
  if (typeof window !== "undefined") localStorage.setItem("app.sound", on ? "on" : "off");
  if (on) void startSoundtrack();
  else stopSoundtrack();
}

export function armSoundtrack() {
  if (typeof window === "undefined") return;
  wanted = soundWanted();
  const kickOff = () => {
    if (wanted) void startSoundtrack();
  };
  window.addEventListener("pointerdown", kickOff, { once: true });
  window.addEventListener("keydown", kickOff, { once: true });
}
