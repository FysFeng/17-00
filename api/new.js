import { put, list } from '@vercel/blob';

const DATA_FILE_NAME = 'news_data.json';

export default async function handler(req, res) {
  // 1. 设置跨域和禁止缓存头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  // 关键：告诉浏览器不要缓存这个 API 的响应
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'Blob Token Missing' });
  }

  try {
    // 👉 GET: 获取新闻
    if (req.method === 'GET') {
      const { blobs } = await list({ token });
      const newsBlob = blobs.find(b => b.pathname === DATA_FILE_NAME);

      if (!newsBlob) {
        return res.status(200).json([]);
      }

      // 🟢 关键修复：给 URL 加上时间戳，强制 Vercel Blob 返回最新文件，而不是 CDN 缓存
      const noCacheUrl = `${newsBlob.url}?timestamp=${Date.now()}`;
      
      const response = await fetch(noCacheUrl);
      const data = await response.json();
      return res.status(200).json(data);
    }

    // 👉 POST: 保存新闻
    if (req.method === 'POST') {
      const newNewsList = req.body;
      
      await put(DATA_FILE_NAME, JSON.stringify(newNewsList), { 
        access: 'public',
        addRandomSuffix: false,
        token,
        // 🟢 关键修复：设置文件上传时的缓存策略
        cacheControlMaxAge: 0 
      });

      return res.status(200).json({ success: true });
    }

  } catch (error) {
    console.error("Blob Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
