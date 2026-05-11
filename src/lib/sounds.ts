// Notification sound utilities

let audioContext: AudioContext | null = null;
let currentOscillator: OscillatorNode | null = null;
let currentGain: GainNode | null = null;
let isPlaying = false;
let loopInterval: ReturnType<typeof setInterval> | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

/**
 * Play an urgent notification chime - ascending two-tone alert
 */
function playChime() {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const now = ctx.currentTime;

  // First tone (lower)
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(523.25, now); // C5
  osc1.frequency.setValueAtTime(659.25, now + 0.12); // E5
  gain1.gain.setValueAtTime(0.3, now);
  gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.35);

  // Second tone (higher, slightly delayed)
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(659.25, now + 0.15); // E5
  osc2.frequency.setValueAtTime(783.99, now + 0.27); // G5
  gain2.gain.setValueAtTime(0.3, now + 0.15);
  gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now + 0.15);
  osc2.stop(now + 0.5);

  // Third tone (highest)
  const osc3 = ctx.createOscillator();
  const gain3 = ctx.createGain();
  osc3.type = 'sine';
  osc3.frequency.setValueAtTime(783.99, now + 0.3); // G5
  osc3.frequency.setValueAtTime(1046.5, now + 0.42); // C6
  gain3.gain.setValueAtTime(0.35, now + 0.3);
  gain3.gain.exponentialRampToValueAtTime(0.01, now + 0.65);
  osc3.connect(gain3);
  gain3.connect(ctx.destination);
  osc3.start(now + 0.3);
  osc3.stop(now + 0.65);
}

/**
 * Start playing looping notification sound
 */
export function startNotificationSound() {
  if (isPlaying) return;
  isPlaying = true;

  // Play immediately
  playChime();

  // Loop every 4 seconds
  loopInterval = setInterval(() => {
    if (isPlaying) {
      playChime();
    }
  }, 4000);
}

/**
 * Stop playing notification sound
 */
export function stopNotificationSound() {
  isPlaying = false;
  if (loopInterval) {
    clearInterval(loopInterval);
    loopInterval = null;
  }
}

/**
 * Play a one-time confirmation sound
 */
export function playConfirmSound() {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const now = ctx.currentTime;

  // Quick ascending confirmation beep
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, now);
  osc.frequency.linearRampToValueAtTime(900, now + 0.1);
  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.2);
}
