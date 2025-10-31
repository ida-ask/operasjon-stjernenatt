// netlify/functions/upload-media.js
const { getStore } = require("@netlify/blobs");
const crypto = require("crypto");
const BUCKET="elves-media";

exports.handler = async (event) => {
  const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type, X-PIN"};
  if(event.httpMethod==="OPTIONS"){ return {statusCode:204, headers:cors, body:""}; }

  const PIN=process.env.INBOX_PIN||"";
  const headers=event.headers||{};
  const clientPin=headers["x-pin"]||headers["X-PIN"]||headers["x-PIN"];
  if(!PIN || clientPin!==PIN){ return {statusCode:401, headers:{"Content-Type":"application/json",...cors}, body:JSON.stringify({error:"Unauthorized"})}; }

  let payload={};
  try{ payload=JSON.parse(event.body||"{}"); }catch{ return {statusCode:400, headers:{"Content-Type":"application/json",...cors}, body:JSON.stringify({error:"Bad JSON"})}; }
  const filename=(payload.filename||"upload.bin").toString();
  const contentType=(payload.content_type||"application/octet-stream").toString();
  const b64=(payload.data_base64||"").toString();
  const thumb_b64=(payload.thumb_base64||"").toString();

  if(!b64){ return {statusCode:400, headers:{"Content-Type":"application/json",...cors}, body:JSON.stringify({error:"Missing data_base64"})}; }
  const sizeBytes = Buffer.byteLength(b64, "base64"); if(sizeBytes>25*1024*1024){ return {statusCode:413, headers:{"Content-Type":"application/json",...cors}, body:JSON.stringify({error:"File too large (max 25MB)"})}; }

  const ext = (filename.includes(".") ? filename.split(".").pop() : "bin").toLowerCase().replace(/[^a-z0-9]/g,"");
  const id = crypto.randomBytes(12).toString("hex") + (ext?("."+ext):"");
  const store = getStore(BUCKET, { consistency: "strong" });
  await store.set(id, Buffer.from(b64,"base64"), { contentType });

  let thumb_url=null;
  if(thumb_b64){
    const tid = crypto.randomBytes(10).toString("hex") + ".jpg";
    await store.set(tid, Buffer.from(thumb_b64,"base64"), { contentType: "image/jpeg" });
    thumb_url = `/api/media/${encodeURIComponent(tid)}`;
  }

  return { statusCode:200, headers:{"Content-Type":"application/json",...cors}, body: JSON.stringify({ id, url:`/api/media/${encodeURIComponent(id)}`, thumb_url }) };
};
