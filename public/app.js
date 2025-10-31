/* ELVES HUMINT — Login-gated meldingsportal */
const STORAGE_KEY = "elves-humint-session";
const CODES = {
  1:{code:"ELF1"},2:{code:"ELF2"},3:{code:"ELF3"},4:{code:"ELF4"},5:{code:"ELF5"},
  6:{code:"ELF6"},7:{code:"ELF7"},8:{code:"ELF8"},9:{code:"ELF9"},10:{code:"ELF10"},
  11:{code:"ELF11"},12:{code:"ELF12"},13:{code:"ELF13"},14:{code:"ELF14"},15:{code:"ELF15"},
  16:{code:"ELF16"},17:{code:"ELF17"},18:{code:"ELF18"},19:{code:"ELF19"},20:{code:"ELF20"},
  21:{code:"ELF21"},22:{code:"ELF22"},23:{code:"ELF23"},24:{code:"ELF24"}
};
function load(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY))||{agent:{name:null},session:{loggedIn:false},outboxHistory:[]}}catch{return {agent:{name:null},session:{loggedIn:false},outboxHistory:[]}}}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}
const state=load(); if(!state.session) state.session={loggedIn:false}; if(!Array.isArray(state.outboxHistory)) state.outboxHistory=[];
if(new URLSearchParams(location.search).get('force')==='login'){ state.session={loggedIn:false}; localStorage.removeItem(STORAGE_KEY); save(); }
if(new URLSearchParams(location.search).get('logout')==='1'){ localStorage.removeItem(STORAGE_KEY); location.href=location.pathname+'?force=login'; }

const $=(s)=>document.querySelector(s);
const $login=$("#login"),$chat=$("#chat"),$history=$("#history");
const $agentName=$("#agentNameInput"),$dayCode=$("#dayCodeInput"),$btnLogin=$("#doLoginBtn"),$btnSkip=$("#skipLoginBtn");
const $inbox=$("#inbox"),$inboxStatus=$("#inboxStatus"),$chatInput=$("#chatInput"),$fileInput=$("#fileInput"),$sendBtn=$("#sendBtn"),$clearBtn=$("#clearBtn");
const $reportHistory=$("#reportHistory");
const normalize=(s)=>(s||'').toString().trim().toUpperCase();
function findDayByCode(code){ if(!code) return null; for(const [d,m] of Object.entries(CODES)){ if(normalize(m.code)===normalize(code)) return parseInt(d,10); } return null; }
function safe(s){return String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');}
function revealApp(){ $chat?.classList.remove('hidden'); $history?.classList.remove('hidden'); }
function hideApp(){ $chat?.classList.add('hidden'); $history?.classList.add('hidden'); }

if(state.session.loggedIn){ $login?.classList.add('hidden'); revealApp(); fetchInbox(); renderHistory(); }
else { hideApp(); $login?.classList.remove('hidden'); }
if(state.agent?.name) $agentName.value=state.agent.name;

$btnLogin?.addEventListener('click',()=>{
  const name=normalize($agentName.value);
  const code=normalize($dayCode.value);
  const day=findDayByCode(code);
  const msg=document.getElementById('loginMsg');
  if(!day){ if(msg) msg.textContent='Feil feltkode. Prøv igjen.'; return; }
  if(name) state.agent={name};
  state.session.loggedIn=true; save();
  $login?.classList.add('hidden'); revealApp();
  if(msg) msg.textContent='';
  $inboxStatus.textContent=`Innlogget som ${state.agent.name||'AGENT'}. Laster innboksen…`;
  fetchInbox(); renderHistory();
});
$btnSkip?.addEventListener('click',()=>{ const msg=document.getElementById('loginMsg'); if(msg) msg.textContent='Du må skrive dagens feltkode.'; });

async function fetchInbox(){
  try{
    const res=await fetch('/api/inbox?ts='+Date.now());
    if(!res.ok) throw new Error(res.statusText);
    const data=await res.json();
    renderInbox(Array.isArray(data)?data:[]);
    $inboxStatus.textContent='Innboks oppdatert: '+new Date().toLocaleString();
  }catch{ $inboxStatus.textContent='Kunne ikke laste innboks.'; }
}
function renderInbox(items=[]){
  $inbox.innerHTML='';
  if(!items.length){ $inbox.innerHTML='<div style="color:#777;">Ingen meldinger enda.</div>'; return; }
  items.sort((a,b)=>(a.ts||0)-(b.ts||0));
  for(const m of items){
    const from=safe(m.from||'ELVES HQ'); const t=m.ts?new Date(m.ts).toLocaleString():'';
    const title=safe(m.title||''); const text=safe(m.text||''); const id=safe(m.id||'');
    const wrap=document.createElement('div');
    wrap.style.border='1px dashed #d4ccc1'; wrap.style.padding='10px'; wrap.style.borderRadius='8px'; wrap.style.margin='8px 0';
    wrap.innerHTML=`<strong>${from}</strong> <span style="color:#777;">${t}</span>${title?`<div><em>${title}</em></div>`:''}${text?`<p style="margin:.4rem 0 0;">${text}</p>`:''}${id?`<div style="color:#999;font-size:12px;">ID: ${id}</div>`:''}`;
    if(m.media && m.media.url && m.media.type){
      const type=m.media.type, url=m.media.url, cap=m.media.caption?`<div style="color:#777;margin-top:6px;">${safe(m.media.caption)}</div>`:'';
      if(type==='image'){ const img=document.createElement('img'); img.src=m.media.thumb_url||url; img.alt=m.media.caption||''; img.style.width='100%'; img.style.border='1px solid #d4ccc1'; img.style.borderRadius='8px'; wrap.appendChild(img); if(cap) wrap.insertAdjacentHTML('beforeend',cap); }
      if(type==='audio'){ const a=document.createElement('audio'); a.controls=true; a.src=url; wrap.appendChild(a); if(cap) wrap.insertAdjacentHTML('beforeend',cap); }
      if(type==='video'){ const v=document.createElement('video'); v.controls=true; v.playsInline=true; v.style.width='100%'; v.src=url; wrap.appendChild(v); if(cap) wrap.insertAdjacentHTML('beforeend',cap); }
      if(type==='youtube'){ const mId=url.match(/(?:youtu\.be\/|v=)([A-Za-z0-9_-]{6,})/); const vid=mId?mId[1]:null;
        if(vid){ const ifr=document.createElement('iframe'); ifr.width='100%'; ifr.height='315'; ifr.style.border='0'; ifr.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'; ifr.allowFullscreen=true; ifr.src=`https://www.youtube.com/embed/${vid}?rel=0`; wrap.appendChild(ifr); if(cap) wrap.insertAdjacentHTML('beforeend',cap);}}
      if(type==='vimeo'){ const vm=url.match(/vimeo\.com\/(\d+)/); const vid=vm?vm[1]:null;
        if(vid){ const ifr=document.createElement('iframe'); ifr.width='100%'; ifr.height='315'; ifr.style.border='0'; ifr.allow='autoplay; fullscreen; picture-in-picture'; ifr.allowFullscreen=true; ifr.src=`https://player.vimeo.com/video/${vid}`; wrap.appendChild(ifr); if(cap) wrap.insertAdjacentHTML('beforeend',cap);}}
    }
    $inbox.appendChild(wrap);
  }
}
setInterval(()=>{ if(state.session.loggedIn) fetchInbox(); }, 60*1000);

function formElement(){ return document.querySelector('form[name="agent-chat"][data-netlify]'); }
async function sendViaNetlifyForms(text, file){
  const form=formElement();
  if(form){ const fd=new FormData(form); fd.set('message',text||''); fd.set('agent',state.agent?.name||''); if(file) fd.set('file',file,file.name); const res=await fetch('/',{method:'POST',body:fd}); if(!res.ok) throw new Error('Submit-feil'); return true; }
  const fd=new FormData(); fd.set('form-name','agent-chat'); fd.set('message',text||''); fd.set('agent',state.agent?.name||''); if(file) fd.set('file',file,file.name); const res=await fetch('/',{method:'POST',body:fd}); if(!res.ok) throw new Error('Submit-feil'); return true;
}
$sendBtn?.addEventListener('click',async()=>{
  if(!state.session.loggedIn) return;
  const text=($chatInput.value||'').trim();
  const file=$fileInput.files && $fileInput.files[0] ? $fileInput.files[0] : null;
  if(!text && !file){ alert('Skriv en melding eller legg ved fil.'); return; }
  $sendBtn.disabled=true; $sendBtn.textContent='Sender…';
  try{
    await sendViaNetlifyForms(text,file);
    state.outboxHistory.push({ts:Date.now(), title:text.slice(0,80)||(file?`Sendte fil: ${file.name}`:'Melding'), body:text, file:file?file.name:null});
    if(state.outboxHistory.length>200) state.outboxHistory.splice(0,state.outboxHistory.length-200);
    save(); renderHistory(); $chatInput.value=''; if($fileInput) $fileInput.value='';
  }catch{ alert('Kunne ikke sende meldingen.'); }
  finally{ $sendBtn.disabled=false; $sendBtn.textContent='SEND'; fetchInbox(); }
});
$clearBtn?.addEventListener('click',()=>{ $chatInput.value=''; if($fileInput) $fileInput.value=''; });

function renderHistory(){
  if(!state.outboxHistory.length){ $reportHistory.textContent='Ingen rapporter enda.'; return; }
  const html=state.outboxHistory.slice().sort((a,b)=>(a.ts||0)-(b.ts||0)).map(r=>{
    const ts=new Date(r.ts).toLocaleString(); const title=safe(r.title||'Melding'); const body=safe(r.body||''); const file=r.file?`<div style="color:#777;">Fil: ${safe(r.file)}</div>`:'';
    return `<div style="border:1px solid #e4dccf;border-radius:8px;padding:8px;margin:8px 0;">
      <strong>${title}</strong> <span style="color:#777;">${ts}</span>
      ${body?`<p style="margin:.4rem 0 0;">${body}</p>`:''}
      ${file}
    </div>`;
  }).join('');
  $reportHistory.innerHTML=html;
}

if('serviceWorker' in navigator){
  window.addEventListener('load',()=>{
    navigator.serviceWorker.register('/service-worker.js').catch(()=>{});
  });
}
