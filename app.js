const $ = (s) => document.querySelector(s);

let cfg = {};
let phases = [];
let idx = 0;
let remaining = 0;
let paused = false;
let timer = null;
let sound = true;
let wakeLock = null;
let phaseDeadline = 0;
let pausedRemainingMs = 0;
let lastBeepSecond = null;

const setup = $("#setupView");
const timerView = $("#timerView");
const card = $("#timerCard");
const phaseEl = $("#phase");
const timeEl = $("#time");
const setEl = $("#setLabel");
const cycleEl = $("#cycleLabel");
const bar = $("#progressBar");
const estimate = $("#estimate");
const pauseBtn = $("#pauseBtn");
const nextPhaseEl = $("#nextPhase");

function val(id) {
  return Math.max(0, parseInt($(id).value, 10) || 0);
}

function fmt(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return String(Math.floor(s / 60)).padStart(2, "0") + ":" +
    String(s % 60).padStart(2, "0");
}

function calcTotal() {
  const prep = val("#prep");
  const work = val("#work");
  const rest = val("#rest");
  const sets = Math.max(1, val("#sets"));
  const cycles = Math.max(1, val("#cycles"));
  return (prep + (work * sets) + (rest * Math.max(0, sets - 1))) * cycles;
}

function updateEstimate() {
  estimate.textContent = fmt(calcTotal());
}

["#prep", "#work", "#rest", "#sets", "#cycles"].forEach((id) => {
  $(id).addEventListener("input", updateEstimate);
});
updateEstimate();

function beep(freq = 700, duration = 0.08) {
  if (!sound) return;

  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {}
}

function build() {
  phases = [];

  for (let c = 1; c <= cfg.cycles; c++) {
    if (cfg.prep && c === 1) {
      phases.push({
        name: "PREPARAÇÃO",
        sec: cfg.prep,
        type: "prep",
        cycle: c,
        set: 1
      });
    }

    for (let s = 1; s <= cfg.sets; s++) {
      phases.push({
        name: "EXERCÍCIO",
        sec: cfg.work,
        type: "work",
        cycle: c,
        set: s
      });

      if (s < cfg.sets && cfg.rest) {
        phases.push({
          name: "DESCANSO",
          sec: cfg.rest,
          type: "rest",
          cycle: c,
          set: s
        });
      }
    }
  }
}

function nextLabel() {
  const n = phases[idx + 1];

  if (!n) {
    nextPhaseEl.textContent = "ÚLTIMA ETAPA";
    nextPhaseEl.className = "next-phase";
    return;
  }

  nextPhaseEl.textContent = "PRÓXIMO → " + n.name;
  nextPhaseEl.className = "next-phase " + n.type;
}

function render() {
  const p = phases[idx];

  if (!p) {
    finish();
    return;
  }

  phaseEl.textContent = p.name;
  timeEl.textContent = fmt(remaining);
  setEl.textContent = p.type === "prep"
    ? "PREPARAÇÃO"
    : "SET " + p.set + "/" + cfg.sets;
  cycleEl.textContent = "CICLO " + p.cycle + "/" + cfg.cycles;

  card.className = "timer-card " + p.type + "-state";

  const progress = p.sec > 0
    ? Math.max(0, Math.min(1, remaining / p.sec))
    : 0;

  bar.style.transform = "scaleX(" + progress + ")";
  pauseBtn.textContent = paused ? "CONTINUAR" : "PAUSAR";
  nextLabel();
}

async function requestWakeLock() {
  if (!("wakeLock" in navigator)) return;

  try {
    wakeLock = await navigator.wakeLock.request("screen");
    wakeLock.addEventListener("release", () => {
      wakeLock = null;
    });
  } catch (e) {}
}

async function releaseWakeLock() {
  try {
    if (wakeLock) await wakeLock.release();
  } catch (e) {}

  wakeLock = null;
}

document.addEventListener("visibilitychange", () => {
  if (
    document.visibilityState === "visible" &&
    !paused &&
    timerView.classList.contains("active")
  ) {
    requestWakeLock();
  }
});

function enterPhase(initial = false) {
  const p = phases[idx];

  if (!p) {
    finish();
    return;
  }

  remaining = p.sec;
  pausedRemainingMs = p.sec * 1000;
  phaseDeadline = Date.now() + pausedRemainingMs;
  lastBeepSecond = null;

  if (!initial) {
    beep(p.type === "work" ? 900 : 600, 0.1);
  }

  render();
}

function tick() {
  if (paused || !phases[idx]) return;

  const msLeft = Math.max(0, phaseDeadline - Date.now());

  if (msLeft <= 0) {
    remaining = 0;
    render();

    idx++;

    if (phases[idx]) {
      enterPhase(false);
    } else {
      finish();
    }

    return;
  }

  remaining = Math.ceil(msLeft / 1000);
  render();

  if (
    remaining <= 3 &&
    remaining >= 1 &&
    remaining !== lastBeepSecond
  ) {
    lastBeepSecond = remaining;
    beep(1000, 0.05);
  }
}

function start() {
  clearInterval(timer);
  timer = setInterval(tick, 50);
  requestWakeLock();
  tick();
}

function finish() {
  clearInterval(timer);
  timer = null;
  releaseWakeLock();

  phaseEl.textContent = "TREINO CONCLUÍDO";
  timeEl.textContent = "00:00";
  setEl.textContent = "EXCELENTE TRABALHO";
  nextPhaseEl.textContent = "APEX TRAINING SYSTEM";
  nextPhaseEl.className = "next-phase";
  bar.style.transform = "scaleX(0)";
  pauseBtn.textContent = "FINALIZADO";
  card.className = "timer-card complete-state";

  beep(1100, 0.16);
  setTimeout(() => beep(1300, 0.22), 180);
}

$("#setupForm").addEventListener("submit", (e) => {
  e.preventDefault();

  cfg = {
    prep: val("#prep"),
    work: val("#work"),
    rest: val("#rest"),
    sets: Math.max(1, val("#sets")),
    cycles: Math.max(1, val("#cycles"))
  };

  build();

  if (!phases.length) return;

  idx = 0;
  paused = false;
  timerView.classList.add("active");
  setup.classList.remove("active");

  enterPhase(true);
  start();
});

pauseBtn.addEventListener("click", () => {
  if (!phases.length || idx >= phases.length) return;

  if (!paused) {
    pausedRemainingMs = Math.max(0, phaseDeadline - Date.now());
    remaining = Math.ceil(pausedRemainingMs / 1000);
    paused = true;

    clearInterval(timer);
    timer = null;
    releaseWakeLock();
    render();
    return;
  }

  paused = false;
  phaseDeadline = Date.now() + pausedRemainingMs;
  lastBeepSecond = null;

  start();
  beep(800, 0.07);
});

$("#restartBtn").addEventListener("click", () => {
  idx = 0;
  paused = false;
  clearInterval(timer);
  timer = null;

  if (phases.length) {
    enterPhase(true);
    start();
  }
});

$("#skipBtn").addEventListener("click", () => {
  if (idx < phases.length - 1) {
    idx++;
    paused = false;
    enterPhase(false);
    beep(650, 0.08);
    start();
  } else {
    finish();
  }
});

$("#backBtn").addEventListener("click", () => {
  clearInterval(timer);
  timer = null;
  releaseWakeLock();

  timerView.classList.remove("active");
  setup.classList.add("active");

  phases = [];
  idx = 0;
  paused = false;
  phaseDeadline = 0;
  pausedRemainingMs = 0;
});

$("#soundBtn").addEventListener("click", () => {
  sound = !sound;
  $("#soundBtn").textContent = sound ? "🔊" : "🔇";
});

document.addEventListener("keydown", (e) => {
  if (!timerView.classList.contains("active")) return;

  if (e.code === "Space") {
    e.preventDefault();
    pauseBtn.click();
  }

  if (e.key.toLowerCase() === "s") {
    $("#skipBtn").click();
  }

  if (e.key.toLowerCase() === "r") {
    $("#restartBtn").click();
  }
});
