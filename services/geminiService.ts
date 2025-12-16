// 文件路径: src/services/geminiService.ts
import { analyzeTextWithQwen, ExtractedNewsData } from "./qwenService";

// ⚠️ 这是一个“桥接”文件。
// 表面上它还叫 geminiService，实际上它已经偷偷把任务转交给 Qwen (通义千问) 了。
// 这样你就不用去改 App.tsx 或其他 UI 文件了。

export type { ExtractedNewsData };

export const analyzeTextWithGemini = async (text: string): Promise<ExtractedNewsData> => {
  console.log("Redirecting request to Qwen service...");
  // 直接调用千问的服务
  return analyzeTextWithQwen(text);
};
