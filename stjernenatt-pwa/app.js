
const STORAGE_KEY = "elves-pwa-progress-v1";

const DAYS = Array.from({length:24}, (_,i)=>i+1);
const CONTENT = {
  startDate: "2025-12-01",
  unlockOverride: true, // set false for real advent release
  days: [
    { day:1, title:"Aktivering: Agent 11", mission:"Velkommen til ELVES. Lag ID-kort og fingeravtrykk.", tasks:["Signer agent-ID","Ta fingeravtrykk (mel + teip)","Velg kodenavn"], answer:{solution:"IS", reward:"NØKKEL: IS"}},
    { day:2, title:"Signal fra Nord", mission:"Dekrypter pigpen-melding.", tasks:["Bruk pigpen-tabell","Skriv svaret"], answer:{solution:"FROST", reward:"NØKKEL: FROST"}},
    { day:3, title:"Felt: Lysjakt", mission:"Finn tre ting som reflekterer lys ute. Rapporter.", tasks:["Finn 3 refleks","Ta bilde (frivillig)"], answer:{solution:"LYS", reward:"NØKKEL: LYS"}},
  ]
};

// Fill the rest of days with placeholders for simplicity
for(let d=4; d<=24; d++){
  CONTENT.days.push({day:d, title:`Dag ${d}: Oppdrag`, mission:"Se konvolutt for oppdrag.", tasks:["Utfør oppdrag","Skriv kode i appen"], answer:{solution:`DAG${d}`, reward:`BELØNNING DAG ${d}`}});
}

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {answers:{}, rewards:{}}; }
  catch { return {answers:{}, rewards:{}}; }
}
function save(state){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

const state = load();

function ymd(dateStr){
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function unlocked(day){
  if (CONTENT.unlockOverride) return true;
  const start = new Date(CONTENT.startDate);
  const unlock = new Date(start);
  unlock.setDate(start.getDate() + (day-1));
  return new Date() >= unlock;
}

const cal = document.getElementById("calendar");
const progressEl = document.getElementById("progress");

function renderCalendar(){
  cal.innerHTML = "";
  CONTENT.days.forEach(d => {
    const solved = !!state.answers[d.day];
    const btn = document.createElement("button");
    btn.className = "card" + (unlocked(d.day) ? "" : " locked");
    btn.innerHTML = `
      <div class="badge">Dag ${d.day}</div>
      <h3>${d.title}</h3>
      <div>${ solved ? "✅ Låst opp" : (unlocked(d.day) ? "🔓 Klar" : "🔒 Låst") }</div>
    `;
    if(unlocked(d.day)){
      btn.addEventListener("click", ()=> openDay(d.day));
    }
    cal.appendChild(btn);
  });
  const solvedCount = Object.keys(state.answers).length;
  progressEl.textContent = `Fremdrift: ${solvedCount}/24 (${Math.round(solvedCount/24*100)}%)`;
}

const modal = document.getElementById("modal");
const closeModal = document.getElementById("closeModal");
const modalTitle = document.getElementById("modalTitle");
const mission = document.getElementById("mission");
const tasks = document.getElementById("tasks");
const answerBox = document.getElementById("answerBox");
const rewardBox = document.getElementById("reward");
const answerInput = document.getElementById("answer");
const submitAnswer = document.getElementById("submitAnswer");

let currentDay = null;
function openDay(day){
  const d = CONTENT.days.find(x=>x.day===day);
  currentDay = day;
  modalTitle.textContent = `Dag ${d.day}: ${d.title}`;
  mission.textContent = d.mission;
  tasks.innerHTML = "";
  d.tasks.forEach(t => {
    const li = document.createElement("li"); li.textContent = t; tasks.appendChild(li);
  });
  answerInput.value = "";
  if(state.answers[day]){
    answerBox.classList.add("hidden");
    rewardBox.classList.remove("hidden");
    rewardBox.textContent = state.rewards[day];
  } else {
    rewardBox.classList.add("hidden");
    answerBox.classList.remove("hidden");
  }
  modal.classList.remove("hidden");
}
function close(){
  modal.classList.add("hidden");
}
closeModal.addEventListener("click", close);

submitAnswer.addEventListener("click", ()=>{
  const d = CONTENT.days.find(x=>x.day===currentDay);
  const given = String(answerInput.value).trim().toLowerCase();
  const solution = String(d.answer.solution).trim().toLowerCase();
  if(!given){ alert("Skriv et svar."); return; }
  if(given === solution){
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
});

document.getElementById("yr").textContent = new Date().getFullYear();
renderCalendar();
