import { put, list } from '@vercel/blob';

const DATA_FILE_NAME = 'brands_data.json';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  // 🟢 禁止缓存
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return res.status(500).json({ error: 'Token Missing' });

  try {
    if (req.method === 'GET') {
      const { blobs } = await list({ token });
      const blob = blobs.find(b => b.pathname === DATA_FILE_NAME);
      if (!blob) return res.status(200).json([]);
      
      // 🟢 关键修复：时间戳防缓存
      const response = await fetch(`${blob.url}?t=${Date.now()}`);
      const data = await response.json();
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      await put(DATA_FILE_NAME, JSON.stringify(req.body), { 
        access: 'public', 
        addRandomSuffix: false, 
        token,
        cacheControlMaxAge: 0 // 🟢 禁止缓存
      });
      return res.status(200).json({ success: true });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
