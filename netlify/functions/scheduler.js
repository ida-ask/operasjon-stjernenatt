// netlify/functions/scheduler.js
const { getStore } = require("@netlify/blobs");
const BUCKET="elves-inbox"; const INBOX_KEY="inbox.json"; const QUEUE_KEY="queue.json";

exports.handler = async () => {
  const store=getStore(BUCKET,{consistency:"strong"});
  async function readJson(key){ const txt=await store.get(key,{type:"text"}); if(!txt) return []; try{ return JSON.parse(txt);}catch{return[];} }
  async function writeJson(key, list){ await store.set(key, JSON.stringify(list,null,2), {contentType:"application/json"}); }

  const now=Date.now();
  const inbox=await readJson(INBOX_KEY);
  let queue=await readJson(QUEUE_KEY);
  const remaining=[];
  let published=0;

  for(const item of queue){
    if((item.publish_at||0) <= now){
      const msg={ id:item.id, ts: now, from:item.from, title:item.title, text:item.text, media:item.media||null };
      inbox.push(msg); published++;
      if(item.repeat==="DAILY"){
        item.publish_at = (item.publish_at||now) + 24*60*60*1000;
        remaining.push(item);
      }
    }else{
      remaining.push(item);
    }
  }

  if(published>0){
    inbox.sort((a,b)=>(a.ts||0)-(b.ts||0));
    await writeJson(INBOX_KEY, inbox);
  }
  if(remaining.length !== queue.length){
    await writeJson(QUEUE_KEY, remaining.sort((a,b)=>(a.publish_at||0)-(b.publish_at||0)));
  }

  return { statusCode: 200, body: JSON.stringify({ ok:true, published, remaining: remaining.length }) };
};
