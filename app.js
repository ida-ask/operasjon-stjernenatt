/* =========================================================
   OPERASJON STJERNENATT — app.js (drop-in)
   - Endre kun i "EDITERBARE DELER" nedenfor.
   - Media: legg filer i /media og sett media.url = "/media/filnavn.mp4"
   - YouTube/Vimeo: lim inn normal lenke; embed lages automatisk.
   - PWA cache: bump CACHE_NAME i service-worker.js for å tvinge oppdatering.
   ========================================================= */

/* ========== EDITERBARE DELER ========== */

// Når skal dag 1 låses opp hvis unlockOverride=false (YYYY-MM-DD):
const START_DATE = "2025-12-01";

// Sett til true for testing (alle dager åpne), false for ekte kalender:
const UNLOCK_OVERRIDE = true;

// Dagsinnhold: fyll inn dag for dag. Media er VALGFRITT.
// media.type: "video" | "audio" | "image" | "youtube" | "vimeo"
// Ekstra lyd som fallback: audioFallback (valgfrie felt)
const DAYS_CONTENT = [
  {
    day: 1,
    title: "Aktivering: Agent 11",
    mission:
      "Velkommen til ELVES. Lag agent-ID og fingeravtrykk. Velg også kodenavn.",
    tasks: [
      "Signer agent-ID",
      "Ta fingeravtrykk (mel + teip)",
      "Velg kodenavn og noter det"
    ],
    // media: { type: "image", url: "/media/agent-id-mal.png", caption: "Agent-ID mal" },
    answer: { solution: "IS", reward: "NØKKEL: IS" }
  },
  {
    day: 2,
    title: "Signal fra Nord",
    mission: "Dekrypter pigpen-melding og skriv kodeordet.",
    tasks: ["Bruk pigpen-tabell", "Skriv svaret i feltet"],
    // media: { type: "image", url: "/media/pigpen.png", caption: "Pigpen-tabell" },
    answer: { solution: "FROST", reward: "NØKKEL: FROST" }
  },
  {
    day: 3,
    title: "Felt: Lysjakt",
    mission:
      "Finn tre ting ute som reflekterer lys. Ta bilde (frivillig) og rapporter.",
    tasks: ["Finn 3 refleks", "Beskriv funn eller vis bilde"],
    answer: { solution: "LYS", reward: "NØKKEL: LYS" }
  },

  // EKSEMPEL på dag med video + lydfallback (rediger fritt / slett om du ikke vil bruke)
  // {
  //   day: 8,
  //   title: "Operasjon Frostblink",
  //   mission: "Se briefen og dekrypter morse-signalet.",
  //   tasks: [
  //     "Se YouTube-briefen",
  //     "Spill av morse-lyden",
  //     "Oversett til bokstaver (— = strek, · = prikk)",
  //     "Skriv kodeordet"
  //   ],
  //   media: { type: "youtube", url: "https://youtu.be/XXXXXXXXXXX", caption: "Brief 08 — Frostblink" },
  //   audioFallback: { type: "audio", url: "/media/morse-dag8.m4a", caption: "Morse 08 — Lytt nøye" },
  //   answer: { solution: "POLARIS", reward: "NØKKEL 08: POLARIS" }
  // },
];

/* ========== SLUTT: EDITERBARE DELER ========== */


/* =========================================================
   App-logikk (ikke nødvendig å endre under her)
   ========================================================= */

const STORAGE_KEY = "elves-pwa-progress-v1";
const DAYS = Array.from({ length: 24 }, (_, i) => i + 1);

// Bygg komplett innholds-liste ved å kombinere DAYS_CONTENT + placeholders
const CONTENT = {
  startDate: START_DATE,
  unlockOverride: UNLOCK_OVERRIDE,
  days: []
};

// legg inn de du har definert
const defined = new Map(DAYS_CONTENT.map((d) => [d.day, d]));
DAYS.forEach((d) => {
  if (defined.has(d)) {
    CONTENT.days.push(defined.get(d));
  } else {
    // placeholder for udefinerte dager
    CONTENT.days.push({
      day: d,
      title: `Dag ${d}: Oppdrag`,
      mission: "Se konvolutt for oppdrag.",
      tasks: ["Utfør oppdrag", "Skriv kode i appen"],
      answer: { solution: `DAG${d}`, reward: `BELØNNING DAG ${d}` }
    });
  }
});

// LocalStorage helpers
function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
      answers: {},
      rewards: {}
    };
  } catch {
    return { answers: {}, rewards: {} };
  }
}
function save(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
const state = load();

// Dato-låsing
function unlocked(day) {
  if (CONTENT.unlockOverride) return true;
  const start = new Date(CONTENT.startDate);
  const unlock = new Date(start);
  unlock.setDate(start.getDate() + (day - 1));
  return new Date() >= unlock;
}

// DOM
const cal = document.getElementById("calendar");
const progressEl = document.getElementById("progress");
const modal = document.getElementById("modal");
const closeModal = document.getElementById("closeModal");
const modalTitle = document.getElementById("modalTitle");
const mission = document.getElementById("mission");
const mediaBox = document.getElementById("media");
const tasks = document.getElementById("tasks");
const answerBox = document.getElementById("answerBox");
const rewardBox = document.getElementById("reward");
const answerInput = document.getElementById("answer");
const submitAnswer = document.getElementById("submitAnswer");
document.getElementById("yr").textContent = new Date().getFullYear();

let currentDay = null;

// UI
function renderCalendar() {
  cal.innerHTML = "";
  CONTENT.days.forEach((d) => {
    const solved = !!state.answers[d.day];
    const btn = document.createElement("button");
    btn.className = "card" + (unlocked(d.day) ? "" : " locked");
    btn.innerHTML = `
      <div class="badge">Dag ${d.day}</div>
      <h3>${escapeHtml(d.title)}</h3>
      <div>${solved ? "✅ Låst opp" : unlocked(d.day) ? "🔓 Klar" : "🔒 Låst"}</div>
    `;
    if (unlocked(d.day)) btn.addEventListener("click", () => openDay(d.day));
    cal.appendChild(btn);
  });
  const solvedCount = Object.keys(state.answers).length;
  progressEl.textContent = `Fremdrift: ${solvedCount}/24 (${Math.round(
    (solvedCount / 24) * 100
  )}%)`;
}

function openDay(day) {
  const d = CONTENT.days.find((x) => x.day === day);
  currentDay = day;

  modalTitle.textContent = `Dag ${d.day}: ${d.title}`;
  mission.textContent = d.mission;

  // Oppgaver
  tasks.innerHTML = "";
  (d.tasks || []).forEach((t) => {
    const li = document.createElement("li");
    li.textContent = t;
    tasks.appendChild(li);
  });

  // Media
  renderMedia(d);

  // Svar/belønning
  answerInput.value = "";
  if (state.answers[day]) {
    answerBox.classList.add("hidden");
    rewardBox.classList.remove("hidden");
    rewardBox.textContent = state.rewards[day];
  } else {
    rewardBox.classList.add("hidden");
    answerBox.classList.remove("hidden");
  }

  modal.classList.remove("hidden");
}

function close() {
  modal.classList.add("hidden");
}
closeModal.addEventListener("click", close);
modal.addEventListener("click", (e) => {
  // Lukk ved klikk utenfor arket
  if (e.target === modal) close();
});

// Mediarender (video/lyd/bilde/YouTube/Vimeo + valgfri audioFallback)
function renderMedia(d) {
  mediaBox.innerHTML = "";
  if (d.media && d.media.type && d.media.url) {
    const cap = mkCap(d.media.caption);

    if (d.media.type === "video") {
      const v = document.createElement("video");
      v.controls = true;
      v.playsInline = true; // iOS
      v.style.width = "100%";
      v.src = d.media.url;
      mediaBox.appendChild(v);
      if (cap) mediaBox.appendChild(cap);
    }

    if (d.media.type === "audio") {
      const a = document.createElement("audio");
      a.controls = true;
      a.src = d.media.url;
      mediaBox.appendChild(a);
      if (cap) mediaBox.appendChild(cap);
    }

    if (d.media.type === "image") {
      const img = document.createElement("img");
      img.src = d.media.url;
      img.alt = d.media.caption || "";
      img.style.width = "100%";
      img.style.borderRadius = "12px";
      img.style.border = "1px solid var(--line)";
      mediaBox.appendChild(img);
      if (cap) mediaBox.appendChild(cap);
    }

    if (d.media.type === "youtube") {
      const idMatch = d.media.url.match(
        /(?:youtu\.be\/|v=)([A-Za-z0-9_-]{6,})/
      );
      const id = idMatch ? idMatch[1] : null;
      if (id) {
        const iframe = document.createElement("iframe");
        iframe.width = "100%";
        iframe.height = "315";
        iframe.style.border = "0";
        iframe.allow =
          "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
        iframe.allowFullscreen = true;
        iframe.src = `https://www.youtube.com/embed/${id}?rel=0`;
        mediaBox.appendChild(iframe);
        if (cap) mediaBox.appendChild(cap);
      }
    }

    if (d.media.type === "vimeo") {
      const numMatch = d.media.url.match(/vimeo\.com\/(\d+)/);
      const vid = numMatch ? numMatch[1] : null;
      if (vid) {
        const iframe = document.createElement("iframe");
        iframe.width = "100%";
        iframe.height = "315";
        iframe.style.border = "0";
        iframe.allow = "autoplay; fullscreen; picture-in-picture";
        iframe.allowFullscreen = true;
        iframe.src = `https://player.vimeo.com/video/${vid}`;
        mediaBox.appendChild(iframe);
        if (cap) mediaBox.appendChild(cap);
      }
    }
  }

  // Ekstra lyd (fallback)
  if (
    d.audioFallback &&
    d.audioFallback.type === "audio" &&
    d.audioFallback.url
  ) {
    const a = document.createElement("audio");
    a.controls = true;
    a.src = d.audioFallback.url;
    a.style.marginTop = "8px";
    mediaBox.appendChild(a);
    const cap2 = mkCap(d.audioFallback.caption);
    if (cap2) mediaBox.appendChild(cap2);
  }
}

function mkCap(text) {
  if (!text) return null;
  const cap = document.createElement("div");
  cap.style.margin = "8px 0";
  cap.style.color = "var(--muted)";
  cap.style.fontSize = "12px";
  cap.textContent = text;
  return cap;
}

// Svarhåndtering
submitAnswer.addEventListener("click", onSubmit);
answerInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") onSubmit();
});

function onSubmit() {
  const d = CONTENT.days.find((x) => x.day === currentDay);
  const given = normalize(answerInput.value);
  const solution = normalize(d.answer.solution);
  if (!given) {
    alert("Skriv et svar.");
    return;
  }
  if (given === solution) {
    state.answers[currentDay] = true;
    state.rewards[currentDay] = d.answer.reward;
    save(state);
    renderCalendar();
    answerBox.classList.add("hidden");
    rewardBox.classList.remove("hidden");
    rewardBox.textContent = state.rewards[currentDay];
  } else {
    alert("Feil kode. Prøv igjen.");
  }
}

// Utils
function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

// Tåler mellomrom/aksenter/caseforskjell
function normalize(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // fjern diakritiske tegn
    .replace(/\s+/g, "");
}

// Init
renderCalendar();
