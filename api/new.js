import { put, list } from '@vercel/blob';

// 定义我们在云端保存的文件名
const DATA_FILE_NAME = 'news_data.json';

export default async function handler(req, res) {
  // 1. 允许跨域
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 获取 Vercel 自动配置的 Token
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'Blob Token 未配置，请在 Vercel 后台 Storage 确认是否连接项目' });
  }

  try {
    // 👉 情况 A: 获取新闻 (下载文件)
    if (req.method === 'GET') {
      // 1. 列出云盘里的文件
      const { blobs } = await list({ token });
      // 2. 找找有没有我们要的那个文件
      const newsBlob = blobs.find(b => b.pathname === DATA_FILE_NAME);

      // 3. 如果文件不存在（第一次用），返回空数组
      if (!newsBlob) {
        return res.status(200).json([]);
      }

      // 4. 如果存在，去下载它的内容
      const response = await fetch(newsBlob.url);
      const data = await response.json();
      return res.status(200).json(data);
    }

    // 👉 情况 B: 保存新闻 (覆盖上传文件)
    if (req.method === 'POST') {
      const newNewsList = req.body; // 前端传来的数据

      // 覆盖上传
      await put(DATA_FILE_NAME, JSON.stringify(newNewsList), { 
        access: 'public',
        addRandomSuffix: false, // 关键：不加随机后缀，保证文件名固定
        token 
      });

      return res.status(200).json({ success: true });
    }

  } catch (error) {
    console.error("Blob Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
