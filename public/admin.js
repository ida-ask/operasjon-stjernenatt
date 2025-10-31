/* ELVES ADMIN — egen side med planlegging */
const PIN_KEY = "elves-admin-pin";

const $ = (s)=>document.querySelector(s);
const $envBanner = $("#envBanner");
const $lock = $("#lock");
const $panel = $("#panel");
const $listWrap = $("#listWrap");
const $list = $("#list");
const $pin = $("#pin");
const $unlock = $("#unlock");
const $lockMsg = $("#lockMsg");
const $from = $("#from");
const $title = $("#title");
const $text = $("#text");
const $mediaType = $("#mediaType");
const $mediaUrl = $("#mediaUrl");
const $mediaThumb = $("#mediaThumb");
const $mediaCaption = $("#mediaCaption");
const $publishAt = $("#publishAt");
const $send = $("#send");
const $refresh = $("#refresh");
const $logout = $("#logout");

// Miljøbanner ut fra hostname
const host = location.hostname;
if(/test|staging|preview|dev/i.test(host)){
  $envBanner.textContent = "TESTMILJØ — trygt å prøve seg frem";
} else {
  $envBanner.textContent = "PRODUKSJON — meldinger går til agenten";
}

// Gjenbruk pin hvis finnes
const savedPin = sessionStorage.getItem(PIN_KEY);
if(savedPin){
  $lock.classList.add("hidden");
  $panel.classList.remove("hidden");
  $listWrap.classList.remove("hidden");
  fetchList(savedPin);
}

$unlock.addEventListener("click", ()=>{
  const pin = ($pin.value||"").trim();
  if(!pin){ $lockMsg.textContent = "Skriv PIN"; return; }
  sessionStorage.setItem(PIN_KEY, pin);
  $lock.classList.add("hidden");
  $panel.classList.remove("hidden");
  $listWrap.classList.remove("hidden");
  $lockMsg.textContent = "";
  fetchList(pin);
});

$logout.addEventListener("click", ()=>{
  sessionStorage.removeItem(PIN_KEY);
  location.href = location.pathname + "?v=" + Date.now();
});

$send.addEventListener("click", async ()=>{
  const pin = sessionStorage.getItem(PIN_KEY)||"";
  if(!pin){ alert("Lås opp med PIN først."); return; }

  const body = {
    from: ($from.value||"").trim() || "ELVES HQ",
    title: ($title.value||"").trim(),
    text: ($text.value||"").trim(),
    ts: Date.now()
  };

  const mt = ($mediaType.value||"").trim();
  const mu = ($mediaUrl.value||"").trim();
  const mth= ($mediaThumb.value||"").trim();
  const mc = ($mediaCaption.value||"").trim();
  if(mt && mu){
    body.media = { type: mt, url: mu };
    if(mth) body.media.thumb_url = mth;
    if(mc) body.media.caption = mc;
  }

  const pa = ($publishAt.value||"").trim();
  if(pa){
    const ms = Date.parse(pa);
    if(!isNaN(ms)) body.availableAt = ms; // planlagt tidspunkt
  }

  const res = await fetch("/api/inbox", {
    method:"POST",
    headers:{ "Content-Type":"application/json", "x-admin-pin": pin },
    body: JSON.stringify(body)
  });
  if(!res.ok){ alert("Publisering feilet. Sjekk PIN og deploy av funksjon."); return; }

  alert("Publisert ✅");
  $title.value=""; $text.value=""; $mediaType.value=""; $mediaUrl.value=""; $mediaThumb.value=""; $mediaCaption.value=""; $publishAt.value="";
  fetchList(pin);
});

$refresh.addEventListener("click", ()=>{
  const pin = sessionStorage.getItem(PIN_KEY)||"";
  if(pin) fetchList(pin);
});

async function fetchList(pin){
  $list.textContent = "Laster...";
  try{
    const res = await fetch("/api/admin_list", { headers:{ "x-admin-pin": pin }});
    if(!res.ok) throw new Error("Auth/Fetch error");
    const items = await res.json();
    if(!items.length){ $list.innerHTML = "<em>Ingen meldinger enda.</em>"; return; }
    const rows = items.sort((a,b)=>(a.ts||0)-(b.ts||0)).map(m=>{
      const when = new Date(m.ts||Date.now()).toLocaleString();
      const avail = m.availableAt ? new Date(m.availableAt).toLocaleString() : "Umiddelbart";
      const media = m.media ? ` [${m.media.type}]` : "";
      return `<div style="border:1px dashed #d4ccc1;border-radius:8px;padding:8px;margin:6px 0;">
        <strong>${escapeHtml(m.title||"(uten tittel)")}</strong> — ${escapeHtml(m.from||"ELVES HQ")} ${media}<br>
        <span class="muted">Opprettet: ${when} · Synlig fra: ${avail}</span>
        ${m.text?`<div>${escapeHtml(m.text)}</div>`:""}
        <div class="small muted">ID: ${m.id||""}</div>
      </div>`;
    }).join("");
    $list.innerHTML = rows;
  }catch{
    $list.textContent = "Kunne ikke laste liste.";
  }
}
function escapeHtml(s){
  return String(s??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
}
