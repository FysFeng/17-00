import React, { useState } from 'react';
import { NewsItem, NewsType } from '../types';
import { DEFAULT_BRANDS, NEWS_TYPES_LIST, NEWS_TYPE_LABELS } from '../constants';
import { analyzeTextWithQwen } from '../services/qwenService';

interface EntryFormProps {
  onAdd: (item: Omit<NewsItem, 'id'>) => void;
}

const EntryForm: React.FC<EntryFormProps> = ({ onAdd }) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'ai'>('ai');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Manual Form State
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    brand: DEFAULT_BRANDS[0],
    type: NewsType.OTHER,
    date: new Date().toISOString().split('T')[0],
    url: '',
    source: '人工录入',
    image: ''
  });

  // AI Form State
  const [aiText, setAiText] = useState('');
  const [aiImageInput, setAiImageInput] = useState(''); // New state for AI tab image URL

  const generateImageUrl = (prompt: string) => {
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=800&height=600&nologo=true&seed=${Math.floor(Math.random()*1000)}`;
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // If no image URL provided, generate one from title/brand
    const finalImage = formData.image.trim() || generateImageUrl(`${formData.brand} ${formData.title} automotive`);

    onAdd({
        ...formData,
        image: finalImage
    });

    // Reset essential fields
    setFormData(prev => ({ ...prev, title: '', summary: '', url: '', image: '' }));
  };

  const handleAiAnalyze = async () => {
    if (!aiText.trim()) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // Switched to Qwen (DashScope)
      const result = await analyzeTextWithQwen(aiText);
      
      // Determine image: 
      // 1. Use user pasted URL in AI tab if available
      // 2. Else use AI generated keyword image
      const finalImage = aiImageInput.trim() 
        ? aiImageInput.trim() 
        : generateImageUrl(result.image_keywords || `${result.brand} car news`);
      
      onAdd({
        title: result.title,
        summary: result.summary,
        brand: result.brand,
        type: result.type as NewsType, // Ensure type cast
        date: result.date,
        url: result.url,
        source: 'AI 智能提取 (Qwen)',
        image: finalImage
      });
      
      setAiText(''); // Clear input on success
      setAiImageInput(''); // Clear image input
      
    } catch (err: any) {
      console.error("Analysis Error:", err);
      const msg = err.message || "未知错误";
      if (msg.includes("API Key") || msg.includes("401") || msg.includes("403")) {
          setError("API Key 错误。请检查 VITE_DASHSCOPE_API_KEY 配置。");
      } else if (msg.includes("JSON")) {
          setError("AI 返回格式解析失败，请重试。");
      } else {
          setError("分析失败: " + msg);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex-1 py-4 text-sm font-medium transition-colors ${
            activeTab === 'ai' 
              ? 'bg-white text-red-600 border-b-2 border-red-600' 
              : 'bg-slate-50 text-slate-500 hover:text-slate-700'
          }`}
        >
          🤖 AI 智能识别 (Qwen)
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={`flex-1 py-4 text-sm font-medium transition-colors ${
            activeTab === 'manual' 
              ? 'bg-white text-red-600 border-b-2 border-red-600' 
              : 'bg-slate-50 text-slate-500 hover:text-slate-700'
          }`}
        >
          ✍️ 手动录入
        </button>
      </div>

      <div className="p-6">
        {activeTab === 'ai' ? (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-700">
              <p>1. 粘贴新闻原文文本。通义千问 (Qwen) 将自动提取关键信息。</p>
              <p>2. (可选) 粘贴新闻配图链接，否则系统将自动生成示意图。</p>
            </div>
            
            <textarea
              className="w-full h-40 p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none text-slate-700 text-sm"
              placeholder="在此粘贴新闻文本..."
              value={aiText}
              onChange={(e) => setAiText(e.target.value)}
            />

            <div>
               <label className="block text-xs font-medium text-slate-500 uppercase mb-1">图片链接 (可选 - 粘贴新闻原图 URL)</label>
               <input 
                  type="url"
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500"
                  placeholder="https://example.com/image.jpg"
                  value={aiImageInput}
                  onChange={(e) => setAiImageInput(e.target.value)}
              />
            </div>
            
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded text-red-600 text-sm flex items-center gap-2">
                 <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                 </svg>
                 <span>{error}</span>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={handleAiAnalyze}
                disabled={isProcessing || !aiText.trim()}
                className={`px-6 py-2.5 rounded-lg font-medium text-white transition-all ${
                  isProcessing || !aiText.trim()
                    ? 'bg-slate-300 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 shadow-md hover:shadow-lg'
                }`}
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Qwen 分析中...
                  </span>
                ) : '开始分析并添加'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase mb-1">品牌</label>
                <select 
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-red-500"
                  value={formData.brand}
                  onChange={(e) => setFormData({...formData, brand: e.target.value})}
                >
                  {DEFAULT_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase mb-1">类型</label>
                <select 
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-red-500"
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value as NewsType})}
                >
                  {NEWS_TYPES_LIST.map(t => <option key={t} value={t}>{NEWS_TYPE_LABELS[t]}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase mb-1">日期</label>
                <input 
                  type="date"
                  required
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase mb-1">链接 URL (可选)</label>
                <input 
                  type="url"
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500"
                  placeholder="https://..."
                  value={formData.url}
                  onChange={(e) => setFormData({...formData, url: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase mb-1">标题</label>
              <input 
                type="text"
                required
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500"
                placeholder="输入新闻标题..."
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase mb-1">摘要</label>
                    <textarea 
                        required
                        className="w-full p-2.5 border border-slate-300 rounded-lg text-sm h-24 resize-none focus:ring-2 focus:ring-red-500"
                        placeholder="简要概括..."
                        value={formData.summary}
                        onChange={(e) => setFormData({...formData, summary: e.target.value})}
                    />
                </div>
                <div>
                     <label className="block text-xs font-medium text-slate-500 uppercase mb-1">图片链接 (可选 - 粘贴新闻原图)</label>
                     <textarea 
                        className="w-full p-2.5 border border-slate-300 rounded-lg text-sm h-24 resize-none focus:ring-2 focus:ring-red-500"
                        placeholder="https://example.com/image.jpg (留空则根据标题生成)"
                        value={formData.image}
                        onChange={(e) => setFormData({...formData, image: e.target.value})}
                    />
                </div>
            </div>

            <div className="flex justify-end pt-2">
              <button 
                type="submit"
                className="bg-slate-800 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors shadow-sm"
              >
                ➕ 确认添加
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EntryForm;