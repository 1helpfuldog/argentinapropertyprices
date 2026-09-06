/**
 * Night-drive pad: slow analog drone in D minor.
 * No sample file — Web Audio, loops while the tab is open.
 */
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let timer: number | null = null;
let wanted = true;

function attach() {
  if (typeof window === "undefined") return;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  if (!ctx) ctx = new AC();
  if (!master) {
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 640;
    filter.Q.value = 0.7;
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.07;
    lfoGain.gain.value = 180;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    const mix = ctx.createGain();
    mix.gain.value = 0.22;
    mix.connect(filter);
    filter.connect(master);

    const drone = ctx.createOscillator();
    drone.type = "triangle";
    drone.frequency.value = 73.42;
    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.35;
    drone.connect(droneGain);
    droneGain.connect(mix);
    drone.start();

    const fifth = ctx.createOscillator();
    fifth.type = "sine";
    fifth.frequency.value = 110;
    const fifthGain = ctx.createGain();
    fifthGain.gain.value = 0.12;
    fifth.connect(fifthGain);
    fifthGain.connect(mix);
    fifth.start();

    const high = ctx.createOscillator();
    high.type = "sine";
    high.frequency.value = 293.66;
    const highGain = ctx.createGain();
    highGain.gain.value = 0.05;
    high.connect(highGain);
    highGain.connect(mix);
    high.start();
  }
}

function fade(to: number, ms = 900) {
  if (!ctx || !master) return;
  master.gain.cancelScheduledValues(ctx.currentTime);
  master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
  master.gain.linearRampToValueAtTime(to, ctx.currentTime + ms / 1000);
}

export function soundWanted(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem("app.sound") !== "off";
}

export async function startSoundtrack() {
  wanted = soundWanted();
  if (!wanted) return;
  attach();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      return;
    }
  }
  fade(0.22);
}

export function stopSoundtrack() {
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
  const kick = () => {
    if (wanted) void startSoundtrack();
  };
  window.addEventListener("pointerdown", kick, { once: true });
  window.addEventListener("keydown", kick, { once: true });
  if (timer) window.clearInterval(timer);
  timer = window.setInterval(() => {
    if (wanted && ctx?.state === "suspended") void ctx.resume();
  }, 4000);
}
