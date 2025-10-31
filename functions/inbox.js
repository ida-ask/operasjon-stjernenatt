// netlify/functions/inbox.js
import { Blobs } from '@netlify/blobs';

export default async (req) => {
  const blobs = new Blobs({ siteID: process.env.SITE_ID });

  if (req.method === 'GET') {
    const keys = await blobs.list({ prefix: 'inbox/' });
    const items = [];
    for (const k of keys.blobs) {
      const obj = await blobs.get(k.key, { type: 'json' });
      if (obj) items.push(obj);
    }
    const now = Date.now();
    const visible = items.filter(m => !m.availableAt || m.availableAt <= now)
                         .sort((a,b)=>(a.ts||0)-(b.ts||0));
    return new Response(JSON.stringify(visible), { status:200, headers:{'content-type':'application/json'} });
  }

  if (req.method === 'POST') {
    const pin = req.headers.get('x-admin-pin') || '';
    if (pin !== process.env.INBOX_PIN) {
      return new Response('Unauthorized', { status: 401 });
    }
    const body = await req.json();
    const id = crypto.randomUUID();
    const item = {
      id,
      from: body.from || 'ELVES HQ',
      title: body.title || '',
      text: body.text || '',
      media: body.media || null,
      availableAt: typeof body.availableAt === 'number' ? body.availableAt : null,
      ts: body.ts || Date.now()
    };
    await blobs.set(`inbox/${id}.json`, JSON.stringify(item), { contentType: 'application/json' });
    return new Response(JSON.stringify({ ok:true, id }), { status:200, headers:{'content-type':'application/json'} });
  }

  return new Response('Method not allowed', { status: 405 });
}
