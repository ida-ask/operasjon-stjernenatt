// netlify/functions/admin_list.js
import { Blobs } from '@netlify/blobs';

export default async (req) => {
  const pin = req.headers.get('x-admin-pin') || '';
  if (pin !== process.env.INBOX_PIN) {
    return new Response('Unauthorized', { status: 401 });
  }
  const blobs = new Blobs({ siteID: process.env.SITE_ID });
  const keys = await blobs.list({ prefix: 'inbox/' });
  const items = [];
  for (const k of keys.blobs) {
    const obj = await blobs.get(k.key, { type: 'json' });
    if (obj) items.push(obj);
  }
  items.sort((a,b)=>(a.ts||0)-(b.ts||0));
  return new Response(JSON.stringify(items), { status:200, headers:{'content-type':'application/json'} });
}
