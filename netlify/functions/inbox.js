// netlify/functions/inbox.js
// Bruker context.blobs i stedet for new Blobs(...)
export default async (req, context) => {
  const store = context.blobs; // <— riktig måte i dagens Netlify runtime

  if (req.method === 'GET') {
    // Hent alle meldinger som er publisert (evt. fremtidige — vi filtrerer her også)
    const { blobs } = await store.list({ prefix: 'inbox/' }); // { blobs: [{ key, size, ...}, ...] }
    const items = [];
    for (const b of blobs) {
      const obj = await store.get(b.key, { type: 'json' }); // returnerer JSON eller null
      if (obj) items.push(obj);
    }
    const now = Date.now();
    const visible = items
      .filter(m => !m.availableAt || m.availableAt <= now)
      .sort((a, b) => (a.ts || 0) - (b.ts || 0));

    return new Response(JSON.stringify(visible), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }

  if (req.method === 'POST') {
    // Enkelt PIN-sjekk (admin.html sender denne i header)
    const pin = req.headers.get('x-admin-pin') || '';
    if (pin !== (process.env.INBOX_PIN || '')) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const id = crypto.randomUUID();
    const item = {
      id,
      from: body.from || 'ELVES HQ',
      title: body.title || '',
      text: body.text || '',
      media: body.media || null, // { type:'image|audio|video|youtube|vimeo', url:'...', thumb_url?, caption? }
      availableAt: typeof body.availableAt === 'number' ? body.availableAt : null,
      ts: body.ts || Date.now(),
    };

    await store.set(`inbox/${id}.json`, JSON.stringify(item), {
      contentType: 'application/json',
    });

    return new Response(JSON.stringify({ ok: true, id }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }

  return new Response('Method not allowed', { status: 405 });
};
