export default async function handler(req, res) {
  if (res.setHeader) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  if (req.method === 'OPTIONS') {
    return res.status ? res.status(200).end() : new Response(null, { status: 200 });
  }

  if (req.method !== 'POST') {
    return res.status ? res.status(405).json({ error: 'Method not allowed' }) : new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    }
    const md5 = body?.md5;
    if (!md5) {
      const errRes = { error: 'MD5 hash is required' };
      return res.status ? res.status(400).json(errRes) : new Response(JSON.stringify(errRes), { status: 400 });
    }

    const token = process.env.BAKONG_TOKEN || process.env.VITE_BAKONG_TOKEN;
    if (!token) {
      const errRes = { error: 'Bakong token not configured' };
      return res.status ? res.status(500).json(errRes) : new Response(JSON.stringify(errRes), { status: 500 });
    }

    const nbcRes = await fetch('https://api-bakong.nbc.gov.kh/v1/check_transaction_by_md5', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ md5 })
    });

    const data = await nbcRes.json();
    const status = nbcRes.status || 200;

    if (res.status) {
      return res.status(status).json(data);
    }
    return new Response(JSON.stringify(data), {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    console.error('[check-bakong-payment] Error:', err);
    const errRes = { error: err.message };
    return res.status ? res.status(500).json(errRes) : new Response(JSON.stringify(errRes), { status: 500 });
  }
}
