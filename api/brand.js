import { put, list } from '@vercel/blob';

// ☁️ 我们在云端保存品牌的文件名
const DATA_FILE_NAME = 'brands_data.json';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return res.status(500).json({ error: 'Blob Token Missing' });

  try {
    // 👉 GET: 获取品牌列表
    if (req.method === 'GET') {
      const { blobs } = await list({ token });
      const blob = blobs.find(b => b.pathname === DATA_FILE_NAME);
      if (!blob) return res.status(200).json([]); // 如果没文件，返回空数组
      
      const response = await fetch(blob.url);
      const data = await response.json();
      return res.status(200).json(data);
    }

    // 👉 POST: 保存/更新品牌列表
    if (req.method === 'POST') {
      const newBrandsList = req.body; 
      await put(DATA_FILE_NAME, JSON.stringify(newBrandsList), { 
        access: 'public', 
        addRandomSuffix: false, 
        token 
      });
      return res.status(200).json({ success: true });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
