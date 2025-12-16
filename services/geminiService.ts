// This file is deprecated. We have switched to Qwen (Alibaba Cloud).
// See services/qwenService.ts

// Keeping file structure but removing imports to @google/genai to prevent build errors
// since we removed the dependency from index.html

export const analyzeTextWithGemini = async (text: string): Promise<any> => {
  throw new Error("Gemini service is disabled. Please use Qwen service.");
};
