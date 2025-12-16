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
 * Call Alibaba Cloud DashScope API (Qwen-Plus)
 */
export const analyzeTextWithQwen = async (text: string): Promise<ExtractedNewsData> => {
  // Try to get key from Vite env (client) or Process env (server/build)
  // Casting import.meta to any to avoid TypeScript error "Property 'env' does not exist on type 'ImportMeta'"
  const apiKey = (import.meta as any).env?.VITE_DASHSCOPE_API_KEY || process.env.DASHSCOPE_API_KEY;

  if (!apiKey) {
    console.error("DashScope API Key is missing.");
    throw new Error("请配置 VITE_DASHSCOPE_API_KEY 环境变量");
  }

  const modelName = 'qwen-plus'; // qwen-plus is balanced for performance and cost

  const systemPrompt = `
    You are an expert automotive news analyst. Your task is to extract structured data from the provided text.
    
    Output Format:
    You must return STRICT JSON format only. Do not include markdown code blocks (like \`\`\`json).
    
    The JSON structure must be:
    {
      "title": "Concise headline in Chinese",
      "summary": "2-3 sentences summary in Chinese",
      "brand": "Primary brand (e.g., Toyota, BYD, Tesla, or Other)",
      "type": "One of: New Car Launch, Policy & Regulation, Market Sales, Personnel Changes, Competitor Dynamics, Other",
      "date": "YYYY-MM-DD (use today's date if not found)",
      "url": "Relevant URL if found, else empty string",
      "image_keywords": "3-6 English keywords for image generation (e.g. 'BYD electric suv desert')"
    }
    
    Valid Brands: ${DEFAULT_BRANDS.join(', ')}.
    Valid Types: ${Object.values(NewsType).join(', ')}.
    
    If the date is missing, use: ${new Date().toISOString().split('T')[0]}.
  `;

  const userPrompt = `News Text: ${text}`;

  try {
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
            { role: "user", content: userPrompt }
          ]
        },
        parameters: {
          result_format: "message",
          temperature: 0.1, // Low temperature for consistent extraction
          top_p: 0.8
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("DashScope API Error:", errorData);
      throw new Error(errorData.message || `API Request Failed: ${response.status}`);
    }

    const data = await response.json();
    
    // Parse the content
    const rawContent = data.output?.choices?.[0]?.message?.content || "";
    if (!rawContent) {
      throw new Error("Empty response from AI");
    }

    // Cleanup potential markdown fences if the model ignores the "no markdown" instruction
    const jsonString = rawContent.replace(/```json/g, "").replace(/```/g, "").trim();
    
    const parsedData = JSON.parse(jsonString) as ExtractedNewsData;
    return parsedData;

  } catch (error) {
    console.error("Qwen Analysis Failed:", error);
    throw error;
  }
};