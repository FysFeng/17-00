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

export const analyzeTextWithQwen = async (text: string): Promise<ExtractedNewsData> => {
  
  // 提示词定义 (保持不变)
  const systemPrompt = `
    You are an expert automotive news analyst. Extract structured data into STRICT JSON format.
    No markdown blocks.
    Structure:
    {
      "title": "Chinese headline",
      "summary": "2-3 sentences Chinese summary",
      "brand": "Primary brand from: ${DEFAULT_BRANDS.join(', ')} (or Other)",
      "type": "One of: ${Object.values(NewsType).join(', ')}",
      "date": "YYYY-MM-DD (default: ${new Date().toISOString().split('T')[0]})",
      "url": "URL or empty",
      "image_keywords": "3-6 English keywords"
    }
  `;

  try {
    // ✅ 修改点：不再直接请求阿里云，而是请求我们自己的后端 API
    // Vercel 会自动把 /api/analyze 路由映射到刚才那个文件
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: text,
        prompt: systemPrompt
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `请求失败: ${response.status}`);
    }

    const data = await response.json();
    
    // 解析阿里云的返回结构
    const rawContent = data.output?.choices?.[0]?.message?.content || "";
    if (!rawContent) {
      throw new Error("AI 返回内容为空");
    }

    // JSON 清洗
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : rawContent;
    
    return JSON.parse(jsonString) as ExtractedNewsData;

  } catch (error) {
    console.error("Analysis Failed:", error);
    throw error;
  }
};

// 保持兼容性
export const analyzeTextWithGemini = analyzeTextWithQwen;
