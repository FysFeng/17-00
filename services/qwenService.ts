// 文件路径: src/services/qwenService.ts
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
    // ✅ 请求我们自己的 Vercel 后端
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, prompt: systemPrompt })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Request failed: ${errText}`);
    }

    const data = await response.json();
    const rawContent = data.output?.choices?.[0]?.message?.content || "";

    if (!rawContent) throw new Error("AI returned empty content");

    // 🧹 JSON 清洗逻辑
    let cleanJson = rawContent.replace(/```json/gi, "").replace(/```/g, "").trim();
    const firstOpen = cleanJson.indexOf("{");
    const lastClose = cleanJson.lastIndexOf("}");
    if (firstOpen !== -1 && lastClose !== -1) {
      cleanJson = cleanJson.substring(firstOpen, lastClose + 1);
    }

    return JSON.parse(cleanJson) as ExtractedNewsData;

  } catch (error) {
    console.error("Qwen Service Error:", error);
    throw error;
  }
};
