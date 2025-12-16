// 文件路径: api/analyze.js

// 这是一个运行在 Vercel 服务器端的函数，浏览器看不到这里面的 Key，非常安全
export default async function handler(req, res) {
  // 1. 设置跨域头，允许你的前端访问
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理预检请求 (OPTIONS)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 只允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // ==========================================
  // 🔴 在这里填入你的阿里云 API Key
  // ==========================================
  const apiKey = 'sk-d7416c81de7f4c9d983c6c05793168e7'; 
  // ==========================================

  const { text, prompt } = req.body;

  try {
    // 2. 在服务器端向阿里云发请求 (不会有 CORS 问题)
    const response = await fetch("https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "qwen-plus", // 使用通义千问 Plus
        input: {
          messages: [
            { role: "system", content: prompt }, // 使用前端传来的 Prompt
            { role: "user", content: `News Text: ${text}` }
          ]
        },
        parameters: {
          result_format: "message",
          temperature: 0.1,
          top_p: 0.8
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Alibaba API Error');
    }

    // 3. 把结果返回给前端
    return res.status(200).json(data);

  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
