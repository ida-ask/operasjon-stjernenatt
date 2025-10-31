// netlify/functions/inbox.js
const { getStore } = require("@netlify/blobs");
const crypto = require("crypto");
const BUCKET="elves-inbox"; const INBOX_KEY="inbox.json"; const QUEUE_KEY="queue.json";

exports.handler = async (event) => {
  const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET,POST,PUT,DELETE,OPTIONS","Access-Control-Allow-Headers":"Content-Type, X-PIN"};
  if(event.httpMethod==="OPTIONS"){ return {statusCode:204, headers:cors, body:""}; }

  const store=getStore(BUCKET,{consistency:"strong"});
  async function readJson(key){ const txt=await store.get(key,{type:"text"}); if(!txt) return []; try{ return JSON.parse(txt);}catch{return[];} }
  async function writeJson(key, list){ await store.set(key, JSON.stringify(list,null,2), {contentType:"application/json"}); }

  const isQueue = event.queryStringParameters && event.queryStringParameters.queue==="1";

  if(event.httpMethod==="GET"){
    if(isQueue){
      const pinOk = (event.headers["x-pin"]||event.headers["X-PIN"]) === (process.env.INBOX_PIN||"");
      if(!pinOk){ return {statusCode:401, headers:{...cors,"Content-Type":"application/json"}, body:JSON.stringify({error:"Unauthorized"})}; }
      const q = await readJson(QUEUE_KEY);
      return {statusCode:200, headers:{...cors,"Content-Type":"application/json"}, body:JSON.stringify(q)};
    }
    const inbox=await readJson(INBOX_KEY);
    return {statusCode:200, headers:{...cors,"Content-Type":"application/json"}, body:JSON.stringify(inbox)};
  }

  const PIN=process.env.INBOX_PIN||"";
  const headers=event.headers||{};
  const clientPin=headers["x-pin"]||headers["X-PIN"]||headers["x-PIN"];
  if(!PIN || clientPin!==PIN){
    return {statusCode:401, headers:{"Content-Type":"application/json",...cors}, body:JSON.stringify({error:"Unauthorized"})};
  }

  if(event.httpMethod==="POST"){
    let payload={}; try{ payload=JSON.parse(event.body||"{}"); }catch{ return {statusCode:400, headers:{"Content-Type":"application/json",...cors}, body:JSON.stringify({error:"Bad JSON"})}; }

    // QUEUE
    if(isQueue){
      const item={ id: crypto.randomBytes(8).toString("hex"),
        publish_at: Number(payload.publish_at)||Date.now(),
        repeat: (payload.repeat==="DAILY"?"DAILY":"NONE"),
        from:(payload.from||"ELVES HQ").toString().slice(0,80),
        title:(payload.title||"").toString().slice(0,140),
        text:(payload.text||"").toString().slice(0,5000),
        media:null };
      const mType=(payload.media_type||"").toString(), mUrl=(payload.media_url||"").toString(), mCap=(payload.media_caption||"").toString();
      if(mType && mUrl){ item.media={type:mType, url:mUrl, caption:mCap||""}; if(payload.thumb_url) item.media.thumb_url = payload.thumb_url; }
      const q=await readJson(QUEUE_KEY); q.push(item); q.sort((a,b)=>(a.publish_at||0)-(b.publish_at||0)); await writeJson(QUEUE_KEY, q);
      return {statusCode:200, headers:{...cors,"Content-Type":"application/json"}, body:JSON.stringify({ok:true, id:item.id, count:q.length})};
    }

    // DIRECT publish
    const now=Date.now();
    const item={ id: crypto.randomBytes(8).toString("hex"), ts:Number(payload.ts)||now, from:(payload.from||"ELVES HQ").toString().slice(0,80),
      title:(payload.title||"").toString().slice(0,140), text:(payload.text||"").toString().slice(0,5000), media:null };
    const mType=(payload.media_type||"").toString(), mUrl=(payload.media_url||"").toString(), mCap=(payload.media_caption||"").toString();
    if(mType && mUrl){ item.media={type:mType, url:mUrl, caption:mCap||""}; if(payload.thumb_url) item.media.thumb_url = payload.thumb_url; }
    const inbox=await readJson(INBOX_KEY); inbox.push(item); inbox.sort((a,b)=>(a.ts||0)-(b.ts||0)); if(inbox.length>1000) inbox.splice(0,inbox.length-1000); await writeJson(INBOX_KEY, inbox);
    return {statusCode:200, headers:{...cors,"Content-Type":"application/json"}, body:JSON.stringify({ok:true, id:item.id, count:inbox.length})};
  }

  if(event.httpMethod==="PUT"){
    let payload={}; try{ payload=JSON.parse(event.body||"{}"); }catch{ return {statusCode:400, headers:{"Content-Type":"application/json",...cors}, body:JSON.stringify({error:"Bad JSON"})}; }
    const id=(payload.id||"").toString(); if(!id){ return {statusCode:400, headers:{"Content-Type":"application/json",...cors}, body:JSON.stringify({error:"Missing id"})}; }
    const list=await readJson(INBOX_KEY); const ix=list.findIndex(m=>m.id===id); if(ix<0) return {statusCode:404, headers:{"Content-Type":"application/json",...cors}, body:JSON.stringify({error:"Not found"})};
    const m=list[ix];
    if(payload.ts) m.ts=Number(payload.ts);
    if(payload.from!=null) m.from=(payload.from||"").toString().slice(0,80);
    if(payload.title!=null) m.title=(payload.title||"").toString().slice(0,140);
    if(payload.text!=null) m.text=(payload.text||"").toString().slice(0,5000);
    if(!m.media && (payload.media_type||payload.media_url)) m.media={};
    if(m.media){
      if(payload.media_type!=null) m.media.type=(payload.media_type||"").toString();
      if(payload.media_url!=null) m.media.url=(payload.media_url||"").toString();
      if(payload.media_caption!=null) m.media.caption=(payload.media_caption||"").toString();
      if(payload.thumb_url!=null) m.media.thumb_url=(payload.thumb_url||"").toString();
    }
    list[ix]=m; list.sort((a,b)=>(a.ts||0)-(b.ts||0)); await writeJson(INBOX_KEY, list);
    return {statusCode:200, headers:{"Content-Type":"application/json",...cors}, body:JSON.stringify({ok:true})};
  }

  if(event.httpMethod==="DELETE"){
    const id=(event.queryStringParameters && event.queryStringParameters.id)||"";
    if(!id){ return {statusCode:400, headers:{...cors,"Content-Type":"application/json"}, body:JSON.stringify({error:"Missing id"})}; }
    const list=await readJson(INBOX_KEY);
    const ix=list.findIndex(m=>m.id===id);
    if(ix<0){ return {statusCode:404, headers:{...cors,"Content-Type":"application/json"}, body:JSON.stringify({error:"Not found"})}; }
    list.splice(ix,1); await writeJson(INBOX_KEY, list);
    return {statusCode:200, headers:{...cors,"Content-Type":"application/json"}, body:JSON.stringify({ok:true})};
  }

  return {statusCode:405, headers:cors, body:"Method Not Allowed"};
};
