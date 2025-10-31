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
    mission: "Velkommen til ELVES. Lag agent-ID og fingeravtrykk. Velg kodenavn.",
    tasks: ["Signer agent-ID", "Ta fingeravtrykk (mel + teip)", "Velg kodenavn og noter det"],
    // media: { type: "image", url: "/media/agent-id-mal.png", caption: "Agent-ID mal" },
    answer: { solution: "IS", reward: "NØKKEL 01: IS" }
  },
  {
    day: 2,
    title: "Signal fra Nord",
    mission: "Dekrypter pigpen-melding og skriv kodeordet.",
    tasks: ["Bruk pigpen-tabell", "Skriv svaret i feltet"],
    // media: { type: "image", url: "/media/pigpen.png", caption: "Pigpen-tabell" },
    answer: { solution: "FROST", reward: "NØKKEL 02: FROST" }
  },
  {
    day: 3,
    title: "Felt: Lysjakt",
    mission: "Finn tre ting ute som reflekterer lys. Ta bilde (frivillig) og rapporter.",
    tasks: ["Finn 3 refleks", "Beskriv funn eller vis bilde"],
    answer: { solution: "LYS", reward: "NØKKEL 03: LYS" }
  },
  {
    day: 4,
    title: "Spor i snø",
    mission: "Identifiser tre ulike spor (dyr, menneske, kjøretøy) i nærmiljøet.",
    tasks: ["Finn 3 spor", "Skisser eller beskriv", "Rapporter hva du tror har skjedd"],
    answer: { solution: "Spor", reward: "NØKKEL 04: SPOR" }
  },
  {
    day: 5,
    title: "Morse fra utkikket",
    mission: "Lytt til morse og dekrypter. Tips: — = strek, · = prikk.",
    tasks: ["Spill av lyd", "Skriv ned streker/prikker", "Oversett til bokstaver"],
    media: { type: "audio", url: "/media/morse-dag5.m4a", caption: "Morse 05" },
    answer: { solution: "ELV", reward: "NØKKEL 05: ELV" }
  },
  {
    day: 6,
    title: "Kompasskurs",
    mission: "Gå 50 m nord, 30 m øst, 20 m sør. Hva er objektet nærmest slutten?",
    tasks: ["Bruk kompass/app", "Noter sluttpunkt", "Skriv navnet på objektet"],
    answer: { solution: "GRAN", reward: "NØKKEL 06: GRAN" }
  },
  {
    day: 7,
    title: "Kald kryptering",
    mission: "En enkel Caesar +3: ALP blir DSO. Dekrypter meldingen: ‘VLMHQQDW’",
    tasks: ["Bruk −3 på hver bokstav", "Skriv kodeordet"],
    answer: { solution: "JULENATT", reward: "NØKKEL 07: NATT" }
  },
  {
    day: 8,
    title: "Operasjon Frostblink",
    mission: "Se briefen og dekrypter morse-signalet.",
    tasks: ["Se video", "Spill av morse-lydelement", "Skriv kodeordet"],
    media: { type: "youtube", url: "https://youtu.be/XXXXXXXXXXX", caption: "Brief 08 — Frostblink" },
    audioFallback: { type: "audio", url: "/media/morse-dag8.m4a", caption: "Morse 08 — Lytt nøye" },
    answer: { solution: "POLARIS", reward: "NØKKEL 08: POLARIS" }
  },
  {
    day: 9,
    title: "Kuldekjede",
    mission: "Finn 4 ting hjemme som isolerer varme. Ranger dem best→dårligst.",
    tasks: ["Finn 4 ting", "Ranger isolasjon", "Rapporter beste ting"],
    answer: { solution: "ULL", reward: "NØKKEL 09: ULL" }
  },
  {
    day: 10,
    title: "Skyggejakt",
    mission: "Gå ut når det er lys og mål din egen skygge. Hvor lang er den?",
    tasks: ["Mål i cm", "Skriv tallet (kun tall)"],
    answer: { solution: "100", reward: "NØKKEL 10: LOKASJON A" } // endre tall etter måling om du vil bruke ekte kontroll
  },
  {
    day: 11,
    title: "Kodeskrift",
    mission: "Les en kort setning skrevet i speil. Skriv nøkkelordet.",
    tasks: ["Hold arket foran speil", "Skriv kodeordet"],
    // media: { type: "image", url: "/media/speiltekst.png", caption: "Speiltekst" },
    answer: { solution: "ELVES", reward: "NØKKEL 11: ELVES" }
  },
  {
    day: 12,
    title: "Kart og kompass",
    mission: "Studer kartutsnitt og finn høyeste punkt i ruten.",
    tasks: ["Se kart", "Skriv navnet/høyden"],
    media: { type: "image", url: "/media/kart-dag12.png", caption: "Kart 12" },
    answer: { solution: "TOPP", reward: "NØKKEL 12: TOPP" }
  },
  {
    day: 13,
    title: "Lydbilde",
    mission: "Stå stille i 2 min. Noter 5 lyder du hører. Hvilken var svakest?",
    tasks: ["Noter 5 lyder", "Velg svakeste", "Skriv ordet"],
    answer: { solution: "VIND", reward: "NØKKEL 13: VIND" }
  },
  {
    day: 14,
    title: "Krysspeiling",
    mission: "Finn to punkter i horisonten. Estimer vinkelen mellom dem.",
    tasks: ["Velg to punkter", "Estimer vinkel (grader)", "Skriv tallet"],
    answer: { solution: "60", reward: "NØKKEL 14: VINKEL 60" } // valgfritt tall
  },
  {
    day: 15,
    title: "Kuldeindeks",
    mission: "Regn ut følt temperatur: Tfølt = T − (v/5). T=−4°C, v=10 m/s.",
    tasks: ["Regn ut", "Skriv tallet (med minus)"],
    answer: { solution: "-6", reward: "NØKKEL 15: KALD" }
  },
  {
    day: 16,
    title: "Usynlig blekk",
    mission: "Skriv hemmelig beskjed med sitronsaft. Varm forsiktig for å lese.",
    tasks: ["Lag usynlig blekk", "Avslør beskjed", "Skriv nøkkelordet"],
    answer: { solution: "STJERNE", reward: "NØKKEL 16: STJERNE" }
  },
  {
    day: 17,
    title: "Sifre fra naturen",
    mission: "Tell antall trinn til postkassa × antall vinduer på fasaden.",
    tasks: ["Tell trinn", "Tell vinduer", "Multipliser", "Skriv tallet"],
    answer: { solution: "24", reward: "NØKKEL 17: 24" } // juster til faktisk produkt
  },
  {
    day: 18,
    title: "Frosthånd-sending",
    mission: "Se denne videoen. En detalj avslører et sted.",
    tasks: ["Se video", "Finn stedet", "Skriv stedsnavn"],
    media: { type: "vimeo", url: "https://vimeo.com/123456789", caption: "Avlyttet sending 18" },
    answer: { solution: "BRO", reward: "NØKKEL 18: BRO" }
  },
  {
    day: 19,
    title: "Snøkrystall",
    mission: "Finn en ‘Y’-form i en snøkrystall/isbord (eller bilde). Hva ligner den?",
    tasks: ["Observer", "Beskriv kort", "Skriv nøkkelord"],
    answer: { solution: "GREIN", reward: "NØKKEL 19: GREIN" }
  },
  {
    day: 20,
    title: "Cifretegn",
    mission: "Dekrypter tall-kode (A1Z26): 19-20-10-5-18-14-5.",
    tasks: ["A=1, B=2 ...", "Skriv ordet"],
    answer: { solution: "STJERNE", reward: "NØKKEL 20: STJERNE" }
  },
  {
    day: 21,
    title: "Nattpatrulje",
    mission: "Gå en liten runde i mørket (med voksen). Noter 3 lys du ser.",
    tasks: ["Noter 3 lyskilder", "Hvilken blinket raskest?"],
    answer: { solution: "SYKKELLYS", reward: "NØKKEL 21: LYS" }
  },
  {
    day: 22,
    title: "Siste nøkler",
    mission: "Sett sammen 3 valgte nøkler fra tidligere dager til en setning.",
    tasks: ["Velg 3 nøkler", "Lag setning", "Skriv kodeordet"],
    answer: { solution: "BLIKK", reward: "NØKKEL 22: BLIKK" }
  },
  {
    day: 23,
    title: "Operasjon Sikkerhet",
    mission: "Sjekk husets ‘perimeter’: dører/vinduer er lukket og låst. Bekreft.",
    tasks: ["Sjekk alle dører", "Sjekk alle vinduer", "Rapporter"],
    answer: { solution: "KLART", reward: "NØKKEL 23: KLAR" }
  },
  {
    day: 24,
    title: "Stjernenatt",
    mission: "Storaksjon! Bruk alle nøkler/hint til å finne hemmelig gjemmested. Si koden ved funn.",
    tasks: [
      "Les sammen nøkkelord (IS, FROST, LYS, ...)",
      "Gå til stedet hintene peker mot",
      "Si koden høyt for å få pakken"
    ],
    // media: { type: "video", url: "/media/julehilsen.mp4", caption: "Siste briefing" },
    answer: { solution: "GODJUL", reward: "GOD JUL, AGENT!" }
  }
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
