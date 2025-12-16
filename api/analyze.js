// 文件路径: api/analyze.js
export default async function handler(req, res) {
  // 1. 允许跨域
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // ==========================================
  // 🔴 必填：在这里填入你的阿里云 API Key (sk-开头)
  // ==========================================
  const apiKey = 'sk-d7416c81de7f4c9d983c6c05793168e7'; 
  // ==========================================

  const { text, prompt } = req.body;

  try {
    // 2. 服务器端请求阿里云 (Qwen-Plus)
    const response = await fetch("https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "qwen-plus",
        input: {
          messages: [
            { role: "system", content: prompt },
            { role: "user", content: `News Text: ${text}` }
          ]
        },
        parameters: {
          result_format: "message",
          temperature: 0.1, // 低温，更精准
          top_p: 0.8
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Alibaba Cloud API Error');
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
