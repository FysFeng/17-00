import { NewsType } from "../types";
import { DEFAULT_BRANDS } from "../constants";

export interface ExtractedNewsData {
  title: string;
  summary: string;
  brand: string;
  type: NewsType;
  date: string;
  url: string;
  image_keywords: string;
}

/**
 * 调用阿里云 DashScope API (通义千问 Qwen-Plus)
 */
export const analyzeTextWithQwen = async (text: string): Promise<ExtractedNewsData> => {
  
  // ============================================================
  // 🔴【关键】请在这里填入你的阿里云 API Key (sk-开头)
  // ============================================================
  const apiKey = 'sk-d7416c81de7f4c9d983c6c05793168e7'; 
  // ============================================================

  if (!apiKey || apiKey.includes('xxxx')) {
    console.error("API Key 未配置");
    throw new Error("请在代码中填入正确的阿里云 API Key");
  }

  // qwen-plus 是性价比最高的模型，适合长文本分析
  const modelName = 'qwen-plus'; 

  const systemPrompt = `
    You are an expert automotive news analyst. Your task is to extract structured data from the provided text.
    
    Output Format:
    You must return STRICT JSON format only. Do not include markdown code blocks.
    
    The JSON structure must be:
    {
      "title": "Concise headline in Chinese",
      "summary": "2-3 sentences summary in Chinese",
      "brand": "Primary brand (Priority selection: ${DEFAULT_BRANDS.join(', ')}). If not found, use 'Other'.",
      "type": "One of: ${Object.values(NewsType).join(', ')}",
      "date": "YYYY-MM-DD (use today's date ${new Date().toISOString().split('T')[0]} if not explicit)",
      "url": "Relevant URL if found, else empty string",
      "image_keywords": "3-6 English keywords for image generation"
    }
  `;

  try {
    console.log("正在调用通义千问 API...");

    const response = await fetch("https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: modelName,
        input: {
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `News Text: ${text}` }
          ]
        },
        parameters: {
          result_format: "message", // 强制返回 message 格式，兼容 OpenAI 风格
          temperature: 0.1,         // 低温度，保证输出稳定
          top_p: 0.8
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("DashScope API Error:", errorData);
      throw new Error(errorData.message || `API 请求失败: ${response.status}`);
    }

    const data = await response.json();
    
    // 解析返回内容
    const rawContent = data.output?.choices?.[0]?.message?.content || "";
    if (!rawContent) {
      throw new Error("AI 返回了空内容");
    }

    // ✅【优化】强力 JSON 提取器
    // 有时候 AI 会返回 "```json {...} ```" 或者 "Here is the result: {...}"
    // 我们只提取第一个 '{' 和最后一个 '}' 之间的内容
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : rawContent;
    
    const parsedData = JSON.parse(jsonString) as ExtractedNewsData;
    console.log("✅ 千问分析成功！");
    
    return parsedData;

  } catch (error) {
    console.error("Qwen Analysis Failed:", error);
    throw error;
  }
};

// 为了兼容你原来的代码调用习惯，我们可以把原来导出的名字指向这个新函数
export const analyzeTextWithGemini = analyzeTextWithQwen;
