// netlify/functions/media.js
const { getStore } = require("@netlify/blobs");
const BUCKET="elves-media";
exports.handler = async (event) => {
  const cors={"Access-Control-Allow-Origin":"*"};
  const id=(event.queryStringParameters && event.queryStringParameters.id)||"";
  if(!id) return {statusCode:400, headers:cors, body:"Missing id"};
  const store=getStore(BUCKET,{consistency:"strong"});
  const meta=await store.getMetadata(id);
  const contentType=meta?.contentType || "application/octet-stream";
  const arrbuf=await store.get(id, { type:"arrayBuffer" });
  if(!arrbuf) return {statusCode:404, headers:cors, body:"Not found"};
  const b64=Buffer.from(arrbuf).toString("base64");
  return { statusCode:200, headers:{ "Content-Type":contentType, "Cache-Control":"public, max-age=31536000", ...cors }, isBase64Encoded:true, body:b64 };
};
