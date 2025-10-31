/* ELVES HUMINT — ALL IN ONE + Storage Meter */
const STORAGE_KEY = "elves-humint-all";
const ADMIN_UNLOCK_KEY = "elves-admin-unlocked";
const ASSUMED_QUOTA_MB = 20; // konservativ antagelse for LocalStorage kvote

const CODES = {1:{code:"ELF1",brief:"Aktivering. Registrer kodenavn og gjør første rekognosering."},2:{code:"ELF2",brief:"Intersepsjon. Finn spor av aktivitet i nærområdet."},3:{code:"ELF3",brief:"Lys/lyd. Noter mønstre du observerer."},4:{code:"ELF4",brief:"Sporanalyse. Tre typer spor og sannsynlig hendelsesforløp."},5:{code:"ELF5",brief:"Morse. Lytt og dekrypter kort signal (valgfritt)."},6:{code:"ELF6",brief:"Kompass. Gå kurs og noter funn ved slutten."},7:{code:"ELF7",brief:"Kryptering. Caesar-variant."},8:{code:"ELF8",brief:"Brief (video). Identifiser kodeord i sendingen."},9:{code:"ELF9",brief:"Isolasjon. Ranger materialer etter varmehold."},10:{code:"ELF10",brief:"Skygge. Mål og noter avvik."},11:{code:"ELF11",brief:"Speiltekst. Les og rapporter nøkkelord."},12:{code:"ELF12",brief:"Kart. Finn høyeste punkt."},13:{code:"ELF13",brief:"Lydbilde. Registrer 5 lyder."},14:{code:"ELF14",brief:"Krysspeiling. Estimer vinkel."},15:{code:"ELF15",brief:"Kuldeindeks. Regn ut følt temperatur."},16:{code:"ELF16",brief:"Usynlig blekk. Avslør beskjed."},17:{code:"ELF17",brief:"Sifre fra naturen. Multiplikasjon."},18:{code:"ELF18",brief:"Frosthånd-sending (video). Finn sted."},19:{code:"ELF19",brief:"Snøkrystall. Mønster-analogi."},20:{code:"ELF20",brief:"A1Z26. Dekrypter tallkode."},21:{code:"ELF21",brief:"Nattpatrulje. Lys-mønstre."},22:{code:"ELF22",brief:"Nøkkelsetning. Kombiner tre nøkler."},23:{code:"ELF23",brief:"Perimeter. Sikkerhetssjekk hus."},24:{code:"ELF24",brief:"Finale. Gjemmested og sluttrapport."}};

function load(){ try{ return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {agent:{name:null}, lastOpenDay:null, reports:{}}; }catch{ return {agent:{name:null},lastOpenDay:null,reports:{}}; } }
function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); updateStorageMeter(); }
const state = load();

/* DOM */
const agentNameInput = document.getElementById("agentName");
const dayCodeInput = document.getElementById("dayCode");
const doLoginBtn = document.getElementById("doLogin");
const skipLoginBtn = document.getElementById("skipLogin");
const loginMsg = document.getElementById("loginMsg");
const loginSec = document.getElementById("login");

const formWrap=document.getElementById("formWrap"), formTitle=document.getElementById("formTitle"), formBrief=document.getElementById("formBrief");
const reportTitle=document.getElementById("reportTitle"), reportLocation=document.getElementById("reportLocation"), reportBody=document.getElementById("reportBody");
const reportImages=document.getElementById("reportImages"), thumbs=document.getElementById("thumbs");
const submitBtn=document.getElementById("submitReport"), cancelBtn=document.getElementById("cancelReport"), formMsg=document.getElementById("formMsg");

const historySec=document.getElementById("history"), historyList=document.getElementById("historyList");
const inboxList=document.getElementById("inboxList"), chatInfo=document.getElementById("chatInfo"), chatAgentHidden=document.getElementById("chatAgentHidden");

const adminSec=document.getElementById("admin"), exportAllBtn=document.getElementById("exportAll"), resetAllBtn=document.getElementById("resetAll");
const reloadInboxBtn=document.getElementById("reloadInbox");
const adminToolsToggle=document.getElementById("adminToolsToggle");

/* Admin lock UI */
const admin_pin=document.getElementById("admin_pin");
const admin_unlock=document.getElementById("admin_unlock");
const admin_lock=document.getElementById("admin_lock");
const admin_msg=document.getElementById("admin_msg");

/* Uploader */
const upl_file=document.getElementById("upl_file"), upl_pin=document.getElementById("upl_pin");
const upl_send=document.getElementById("upl_send"), upl_msg=document.getElementById("upl_msg");

/* Inbox admin form */
const a_id=document.getElementById("a_id"), a_from=document.getElementById("a_from"), a_title=document.getElementById("a_title"), a_text=document.getElementById("a_text");
const a_mtype=document.getElementById("a_mtype"), a_murl=document.getElementById("a_murl"), a_mcap=document.getElementById("a_mcap");
const a_pin=document.getElementById("a_pin"), a_ts=document.getElementById("a_ts"), a_send=document.getElementById("a_send"), a_delete=document.getElementById("a_delete");
const a_msg=document.getElementById("a_msg");

/* Scheduler Admin */
const s_from=document.getElementById("s_from"), s_title=document.getElementById("s_title"), s_text=document.getElementById("s_text");
const s_mtype=document.getElementById("s_mtype"), s_murl=document.getElementById("s_murl"), s_mcap=document.getElementById("s_mcap");
const s_when=document.getElementById("s_when"), s_daily=document.getElementById("s_daily"), s_pin=document.getElementById("s_pin");
const s_schedule=document.getElementById("s_schedule"), s_msg=document.getElementById("s_msg");
const viewQueueBtn=document.getElementById("viewQueue"), queueList=document.getElementById("queueList");

/* Storage meter */
const storageText=document.getElementById("storageText");
const storageBar=document.getElementById("storageBar");

/* Utils */
document.getElementById("yr").textContent = new Date().getFullYear();
const normalize=s=>(s||"").toString().trim().toUpperCase();
const fmtTime=ts=>new Date(ts).toLocaleString();
function escapeHtml(s){ return String(s||"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;"); }
function setChatAgentHidden(){ if(chatAgentHidden) chatAgentHidden.value = state.agent?.name || ""; }
if(state.agent?.name) agentNameInput.value = state.agent.name;
setChatAgentHidden();

/* Storage meter helpers */
function byteLength(str){ return new Blob([str]).size; }
function getLocalUsageBytes(){
  let total=0;
  for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i);
    const v=localStorage.getItem(k);
    total += byteLength(k||"") + byteLength(v||"");
  }
  return total;
}
function updateStorageMeter(){
  const usedBytes = getLocalUsageBytes();
  const usedMB = usedBytes / (1024*1024);
  const pct = Math.min(100, Math.round((usedMB / ASSUMED_QUOTA_MB) * 100));
  storageBar.style.width = pct + "%";
  // farger
  let color="#2e7d32"; // grønn
  if(pct>=80) color="#c62828"; else if(pct>=50) color="#ef6c00";
  storageBar.style.background = color;
  storageText.textContent = `Lagringsnivå: ${pct}% (${usedMB.toFixed(2)} MB av ${ASSUMED_QUOTA_MB} MB)`;
}
setInterval(updateStorageMeter, 60000); // hvert minutt
window.addEventListener("storage", updateStorageMeter); // hvis annet vindu endrer
updateStorageMeter();

/* Local image thumbs for report */
reportImages.addEventListener("change", async (e)=>{
  thumbs.innerHTML="";
  const files=Array.from(e.target.files||[]);
  for(const file of files){
    const dataUrl=await resizeImage(file,1600);
    const img=document.createElement("img"); img.src=dataUrl; img.dataset.dataUrl=dataUrl; thumbs.appendChild(img);
  }
  updateStorageMeter();
});
function resizeImage(file,maxSide=1600){
  return new Promise((resolve,reject)=>{
    const r=new FileReader();
    r.onload=()=>{ const im=new Image(); im.onload=()=>{
        const scale=Math.min(1,maxSide/Math.max(im.width,im.height));
        const w=Math.round(im.width*scale), h=Math.round(im.height*scale);
        const c=document.createElement("canvas"); c.width=w; c.height=h; const ctx=c.getContext("2d"); ctx.drawImage(im,0,0,w,h);
        resolve(c.toDataURL("image/jpeg",0.85));
      }; im.onerror=reject; im.src=r.result; };
    r.onerror=reject; r.readAsDataURL(file);
  });
}

/* Login */
doLoginBtn.addEventListener("click",()=>{
  const name=normalize(agentNameInput.value);
  const code=normalize(dayCodeInput.value);
  const day=findDayByCode(code);
  if(!day){ loginMsg.textContent="Feil feltkode. Prøv igjen."; return; }
  if(name){ state.agent={name}; save(); setChatAgentHidden(); }
  openForm(day);
});
skipLoginBtn.addEventListener("click",()=>{
  if(state.lastOpenDay) openForm(state.lastOpenDay);
  else loginMsg.textContent="Ingen dag er åpnet enda. Skriv en feltkode.";
});
function findDayByCode(code){ if(!code) return null; for(const [day,meta] of Object.entries(CODES)){ if(normalize(meta.code)===code) return parseInt(day,10); } return null; }

function openForm(day){
  state.lastOpenDay=day; save();
  loginSec.classList.add("hidden"); formWrap.classList.remove("hidden"); historySec.classList.remove("hidden");
  const meta=CODES[day]; const hello=state.agent?.name?` — Agent ${state.agent.name}`:"";
  formTitle.textContent=`Dag ${day}${hello}`; formBrief.textContent=meta?.brief||"Skriv observasjoner for i dag.";
  const rep=state.reports[day]||{};
  reportTitle.value=rep.title||""; reportLocation.value=rep.location||""; reportBody.value=rep.body||""; thumbs.innerHTML="";
  if(rep.images?.length){ for(const url of rep.images){ const img=document.createElement("img"); img.src=url; img.dataset.dataUrl=url; thumbs.appendChild(img); } }
  renderHistory();
}
submitBtn.addEventListener("click",()=>{
  const day=state.lastOpenDay; if(!day){ formMsg.textContent="Ingen dag er åpen."; return; }
  const images=Array.from(thumbs.querySelectorAll("img")).map(i=>i.dataset.dataUrl);
  state.reports[day]={ title:reportTitle.value.trim(), location:reportLocation.value.trim(), body:reportBody.value.trim(), images, ts:Date.now() };
  save(); formMsg.textContent="Rapport lagret lokalt."; renderHistory();
});
cancelBtn.addEventListener("click",()=>{ formWrap.classList.add("hidden"); loginSec.classList.remove("hidden"); });

function renderHistory(){
  const entries=Object.entries(state.reports).sort((a,b)=>a[0]-b[0]);
  historyList.innerHTML="";
  for(const [day,rep] of entries){
    const div=document.createElement("div"); div.className="item";
    div.innerHTML=`<strong>Dag ${day} — ${escapeHtml(rep.title||"Uten tittel")}</strong><br>
      <span class="muted">${escapeHtml(rep.location||"Uten sted")}</span><br>
      <span class="muted">${fmtTime(rep.ts)}</span>
      <p style="margin:.4rem 0 0;">${escapeHtml(rep.body||"")}</p>
      ${rep.images?.length?`<div class="thumbs">${rep.images.map(u=>`<img src="${u}">`).join("")}</div>`:""}
      <div class="admin-tools">
        <button class="ghost" data-open="${day}">Åpne</button>
        <button class="ghost" data-del="${day}">Slett</button>
      </div>`;
    historyList.appendChild(div);
  }
  historyList.querySelectorAll("[data-open]").forEach(b=>b.addEventListener("click",()=>openForm(parseInt(b.dataset.open,10))));
  historyList.querySelectorAll("[data-del]").forEach(b=>b.addEventListener("click",()=>{
    const d=parseInt(b.dataset.del,10); if(confirm(`Slette rapport for dag ${d}?`)){ delete state.reports[d]; save(); renderHistory(); }
  }));
}

/* Inbox + admin tools in list */
let adminUnlocked = localStorage.getItem(ADMIN_UNLOCK_KEY)==="1";
adminToolsToggle.checked = adminUnlocked;
adminToolsToggle.addEventListener("change",()=>{ adminToolsToggle.checked = adminUnlocked; }); // toggle via lock
async function fetchInbox(){
  try{ const res=await fetch("/api/inbox?ts="+Date.now()); if(!res.ok) throw new Error(res.statusText); const data=await res.json();
    renderInbox(data); chatInfo.textContent="Innboks oppdatert: "+new Date().toLocaleString();
  }catch(e){ chatInfo.textContent="Kunne ikke laste innboks."; }
}
function renderInbox(items=[]){
  inboxList.innerHTML="";
  if(!items.length){ const d=document.createElement("div"); d.className="item"; d.textContent="Ingen meldinger enda."; inboxList.appendChild(d); return; }
  items.sort((a,b)=>(a.ts||0)-(b.ts||0));
  for(const m of items){
    const div=document.createElement("div"); div.className="item";
    const from=escapeHtml(m.from||"ELVES HQ"); const t=m.ts?new Date(m.ts).toLocaleString():""; const title=escapeHtml(m.title||""); const id=escapeHtml(m.id||"");
    div.innerHTML=`<strong>${from}</strong> <span class="muted">${t}</span>${title?`<div>${title}</div>`:""} ${id?`<div class="muted">ID: ${id}</div>`:""}`;
    if(m.text){ const p=document.createElement("p"); p.style.margin=".4rem 0 0"; p.textContent=m.text; div.appendChild(p); }
    if(m.media && m.media.url && m.media.type){
      const cap=m.media.caption?`<div class="muted" style="margin-top:6px;">${escapeHtml(m.media.caption)}</div>`:"";
      if(m.media.type==="image"){ const img=document.createElement("img"); img.src=m.media.thumb_url||m.media.url; img.alt=m.media.caption||""; img.style.width="100%"; img.style.border="1px solid var(--line)"; img.style.borderRadius="10px"; div.appendChild(img); if(cap) div.insertAdjacentHTML("beforeend",cap); }
      if(m.media.type==="audio"){ const a=document.createElement("audio"); a.controls=true; a.src=m.media.url; div.appendChild(a); if(cap) div.insertAdjacentHTML("beforeend",cap); }
      if(m.media.type==="video"){ const v=document.createElement("video"); v.controls=true; v.playsInline=true; v.style.width="100%"; v.src=m.media.url; div.appendChild(v); if(cap) div.insertAdjacentHTML("beforeend",cap); }
      if(m.media.type==="youtube"){ const mId=m.media.url.match(/(?:youtu\.be\/|v=)([A-Za-z0-9_-]{6,})/); const vid=mId?mId[1]:null; if(vid){ const ifr=document.createElement("iframe"); ifr.width="100%"; ifr.height="315"; ifr.style.border="0"; ifr.allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"; ifr.allowFullscreen=true; ifr.src=`https://www.youtube.com/embed/${vid}?rel=0`; div.appendChild(ifr); if(cap) div.insertAdjacentHTML("beforeend",cap); } }
      if(m.media.type==="vimeo"){ const vm=m.media.url.match(/vimeo\.com\/(\d+)/); const vid=vm?m[1]:null; if(vid){ const ifr=document.createElement("iframe"); ifr.width="100%"; ifr.height="315"; ifr.style.border="0"; ifr.allow="autoplay; fullscreen; picture-in-picture"; ifr.allowFullscreen=true; ifr.src=`https://player.vimeo.com/video/${vid}`; div.appendChild(ifr); if(cap) div.insertAdjacentHTML("beforeend",cap); } }
    }
    if(adminUnlocked){
      const tools=document.createElement("div"); tools.className="admin-tools";
      const editBtn=document.createElement("button"); editBtn.className="ghost"; editBtn.textContent="Rediger"; editBtn.addEventListener("click",()=>{
        document.getElementById("a_id").value=m.id||""; document.getElementById("a_from").value=m.from||"";
        document.getElementById("a_title").value=m.title||""; document.getElementById("a_text").value=m.text||"";
        document.getElementById("a_mtype").value=m.media?.type||""; document.getElementById("a_murl").value=m.media?.url||""; document.getElementById("a_mcap").value=m.media?.caption||"";
        window.scrollTo({top:document.getElementById("admin").offsetTop, behavior:"smooth"});
      });
      const delBtn=document.createElement("button"); delBtn.className="ghost"; delBtn.textContent="Slett"; delBtn.addEventListener("click",async()=>{
        if(!m.id) return; if(!confirm("Slette melding?")) return;
        const pin=prompt("PIN:"); if(!pin) return;
        const res=await fetch(`/api/inbox?id=${encodeURIComponent(m.id)}`, { method:"DELETE", headers:{ "X-PIN": pin } });
        if(res.ok){ fetchInbox(); } else { alert("Feil ved sletting"); }
      });
      tools.append(editBtn, delBtn); div.appendChild(tools);
    }
    inboxList.appendChild(div);
  }
  inboxList.lastElementChild?.scrollIntoView({behavior:"smooth"});
}
fetchInbox(); setInterval(fetchInbox, 60*1000);

/* Admin lock logic */
function setAdminUnlocked(v){ adminUnlocked=!!v; localStorage.setItem(ADMIN_UNLOCK_KEY, v?"1":"0"); adminToolsToggle.checked = adminUnlocked; admin_msg.textContent = v? "Admin låst opp (lokalt).":"Låst."; }
admin_unlock?.addEventListener("click", async ()=>{
  const pin=admin_pin.value.trim(); if(!pin){ admin_msg.textContent="Skriv PIN."; return; }
  // Validate with harmless ping (ts=0)
  const res=await fetch("/api/inbox", { method:"POST", headers:{ "Content-Type":"application/json","X-PIN":pin }, body: JSON.stringify({ title:"__ping", text:"__ping__", from:"PING", ts: 0 }) });
  if(res.status===200){ setAdminUnlocked(true); admin_msg.textContent="OK (ping kan slettes fra admin)."; fetchInbox(); }
  else{ admin_msg.textContent="Feil PIN."; }
});
admin_lock?.addEventListener("click", ()=> setAdminUnlocked(false));

/* Admin form actions */
a_send?.addEventListener("click", async ()=>{
  const pin=a_pin.value.trim(); if(!pin){ a_msg.textContent="PIN mangler."; return; }
  const payload={ id: a_id.value.trim()||undefined, from:a_from.value, title:a_title.value, text:a_text.value, media_type:a_mtype.value, media_url:a_murl.value, media_caption:a_mcap.value, ts:a_ts.value };
  const method = payload.id ? "PUT" : "POST";
  try{
    const res=await fetch("/api/inbox", { method, headers:{ "Content-Type":"application/json","X-PIN":pin }, body: JSON.stringify(payload) });
    const out=await res.json(); if(!res.ok) throw new Error(out.error||res.statusText);
    a_msg.textContent="Lagret ✅"; fetchInbox();
  }catch(e){ a_msg.textContent="Feil: "+e.message; }
});
a_delete?.addEventListener("click", async ()=>{
  const pin=a_pin.value.trim(); const id=a_id.value.trim();
  if(!pin || !id){ a_msg.textContent="Trenger både PIN og ID for sletting."; return; }
  if(!confirm("Slette melding med ID?")) return;
  const res=await fetch(`/api/inbox?id=${encodeURIComponent(id)}`, { method:"DELETE", headers:{ "X-PIN": pin } });
  if(res.ok){ a_msg.textContent="Slettet."; fetchInbox(); } else { a_msg.textContent="Feil ved sletting."; }
});

/* Media uploader with client-side thumbnail */
upl_send?.addEventListener("click", async ()=>{
  upl_msg.textContent=""; const file=upl_file.files?.[0]; const pin=upl_pin.value.trim();
  if(!file){ upl_msg.textContent="Velg en fil først."; return; } if(!pin){ upl_msg.textContent="Skriv PIN."; return; }

  let thumb_b64 = null;
  if(file.type.startsWith("image/")){
    const dataUrl = await makeThumb(file, 600);
    thumb_b64 = dataUrl.split(",")[1];
  }
  const file_b64 = await fileToBase64(file);
  try{
    const res = await fetch("/api/upload-media", {
      method:"POST",
      headers:{ "Content-Type": "application/json", "X-PIN": pin },
      body: JSON.stringify({ filename:file.name, content_type:file.type||"application/octet-stream", data_base64:file_b64.split(",")[1], thumb_base64: thumb_b64 })
    });
    const out = await res.json();
    if(!res.ok) throw new Error(out.error||res.statusText);
    upl_msg.innerHTML = `Lastet opp ✅ URL: <code>${out.url}</code>${out.thumb_url?`<br>Thumbnail: <code>${out.thumb_url}</code>`:""}`;
    const murl=document.getElementById("a_murl"), mtype=document.getElementById("a_mtype");
    if(murl) murl.value = out.url; if(mtype){ if(file.type.startsWith("image/")) mtype.value="image"; else if(file.type.startsWith("audio/")) mtype.value="audio"; else if(file.type.startsWith("video/")) mtype.value="video"; }
  }catch(e){ upl_msg.textContent="Feil: "+e.message; }
});
function makeThumb(file, maxSide=600){ return new Promise((resolve,reject)=>{
  const r=new FileReader(); r.onload=()=>{ const im=new Image(); im.onload=()=>{
    const scale=Math.min(1,maxSide/Math.max(im.width,im.height)); const w=Math.round(im.width*scale), h=Math.round(im.height*scale);
    const c=document.createElement("canvas"); c.width=w; c.height=h; const ctx=c.getContext("2d"); ctx.drawImage(im,0,0,w,h); resolve(c.toDataURL("image/jpeg",0.8));
  }; im.onerror=reject; im.src=r.result; }; r.onerror=reject; r.readAsDataURL(file); }); }
function fileToBase64(file){ return new Promise((resolve,reject)=>{ const r=new FileReader(); r.onload=()=>resolve(r.result); r.onerror=reject; r.readAsDataURL(file); }); }

/* Scheduler UI */
s_schedule?.addEventListener("click", async ()=>{
  s_msg.textContent="";
  const pin=s_pin.value.trim(); if(!pin){ s_msg.textContent="PIN mangler."; return; }
  const when=s_when.value; if(!when){ s_msg.textContent="Velg dato/tid."; return; }
  const ts=Date.parse(when); if(isNaN(ts)){ s_msg.textContent="Ugyldig dato/tid."; return; }
  const payload={ from:s_from.value, title:s_title.value, text:s_text.value, media_type:s_mtype.value, media_url:s_murl.value, media_caption:s_mcap.value, publish_at: ts, repeat: s_daily.checked ? "DAILY" : "NONE" };
  try{
    const res=await fetch("/api/inbox?queue=1", { method:"POST", headers:{ "Content-Type":"application/json","X-PIN":pin }, body: JSON.stringify(payload) });
    const out=await res.json(); if(!res.ok) throw new Error(out.error||res.statusText);
    s_msg.textContent="Planlagt ✅"; await loadQueue(pin);
  }catch(e){ s_msg.textContent="Feil: "+e.message; }
});
viewQueueBtn?.addEventListener("click", async ()=>{
  const pin=prompt("PIN for å se kø:"); if(!pin) return;
  await loadQueue(pin);
});
async function loadQueue(pin){
  const res=await fetch("/api/inbox?queue=1", { headers: { "X-PIN": pin } });
  if(!res.ok){ queueList.innerHTML="<div class='item'>Feil ved henting av kø.</div>"; return; }
  const data=await res.json(); renderQueue(data);
}
function renderQueue(items){
  queueList.innerHTML="";
  if(!items.length){ queueList.innerHTML="<div class='item'>Køen er tom.</div>"; return; }
  items.sort((a,b)=>(a.publish_at||0)-(b.publish_at||0));
  for(const q of items){
    const d=document.createElement("div"); d.className="item";
    const next=new Date(q.publish_at).toLocaleString();
    d.innerHTML=`<strong>${escapeHtml(q.from||"ELVES HQ")}</strong> <span class="muted">${next}</span>${q.title?`<div>${escapeHtml(q.title)}</div>`:""} ${q.repeat&&q.repeat!=="NONE"?`<div class="muted">Repeater: ${q.repeat}</div>`:""}`;
    queueList.appendChild(d);
  }
}

/* Periodic inbox refresh */
setInterval(fetchInbox, 60*1000);
fetchInbox();
