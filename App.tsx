import React, { useState, useMemo, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import NewsCard from './components/NewsCard';
import EntryForm from './components/EntryForm';
import { DEFAULT_BRANDS, NEWS_TYPES_LIST } from './constants';
import { NewsItem, FilterState } from './types';

// 简单的加载图标
const LoadingIcon = () => (
  <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

function App() {
  // 🟢 1. 状态初始化：默认为空数组，等待从云端加载
  const [news, setNews] = useState<NewsItem[]>([]);
  const [customBrands, setCustomBrands] = useState<string[]>(DEFAULT_BRANDS);
  const [isSyncing, setIsSyncing] = useState(true); // 是否正在同步中
  
  // Date calculation for default filter (Last 30 days)
  const defaultEndDate = new Date().toISOString().split('T')[0];
  const defaultStartDate = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];

  const [filters, setFilters] = useState<FilterState>({
    startDate: defaultStartDate,
    endDate: defaultEndDate,
    selectedBrands: [], // 默认全选/不选
    selectedTypes: NEWS_TYPES_LIST,
    searchQuery: ''
  });

  const [activeTab, setActiveTab] = useState<'feed' | 'entry'>('feed');

  // 🟢 2. 核心逻辑：网页启动时，从 Vercel 云端下载数据
  useEffect(() => {
    const fetchCloudData = async () => {
      try {
        setIsSyncing(true);
        const [newsRes, brandsRes] = await Promise.all([
          fetch('/api/news'),
          fetch('/api/brands')
        ]);

        const newsData = await newsRes.json();
        const brandsData = await brandsRes.json();

        // 如果云端有数据，就覆盖本地；否则保持空或默认
        if (Array.isArray(newsData) && newsData.length > 0) {
          setNews(newsData);
        }
        if (Array.isArray(brandsData) && brandsData.length > 0) {
          setCustomBrands(brandsData);
        }
      } catch (error) {
        console.error("Failed to sync with cloud:", error);
      } finally {
        setIsSyncing(false);
      }
    };

    fetchCloudData();
  }, []);

  // 🟢 3. 辅助函数：保存到云端
  const saveNewsToCloud = async (updatedNews: NewsItem[]) => {
    setNews(updatedNews); // 先更新 UI
    try {
      await fetch('/api/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedNews)
      });
    } catch (err) {
      console.error("Failed to save news:", err);
    }
  };

  const saveBrandsToCloud = async (updatedBrands: string[]) => {
    setCustomBrands(updatedBrands); // 先更新 UI
    try {
      await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedBrands)
      });
    } catch (err) {
      console.error("Failed to save brands:", err);
    }
  };

  // Filter Logic (保持不变)
  const filteredNews = useMemo(() => {
    return news.filter(item => {
      const dateMatch = item.date >= filters.startDate && item.date <= filters.endDate;
      const brandMatch = filters.selectedBrands.length === 0 || filters.selectedBrands.includes(item.brand);
      const typeMatch = filters.selectedTypes.length === 0 || filters.selectedTypes.includes(item.type);
      
      const searchLower = filters.searchQuery.toLowerCase();
      const searchMatch = !filters.searchQuery || 
                          item.title.toLowerCase().includes(searchLower) || 
                          item.summary.toLowerCase().includes(searchLower);

      return dateMatch && brandMatch && typeMatch && searchMatch;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [news, filters]);

  // Actions
  const handleAddNews = (itemData: Omit<NewsItem, 'id'>) => {
    const newId = Math.random().toString(36).substring(2, 9);
    
    const newItem: NewsItem = {
      ...itemData,
      id: newId,
      image: itemData.image || `https://image.pollinations.ai/prompt/${encodeURIComponent(itemData.brand + ' car')}?nologo=true`
    };
    
    // 🟢 逻辑更新：如果有新品牌，同时保存品牌和新闻
    let newBrandsList = customBrands;
    if (!customBrands.includes(itemData.brand)) {
        newBrandsList = [...customBrands, itemData.brand];
        saveBrandsToCloud(newBrandsList); // 同步品牌
    }

    // 🟢 逻辑更新：保存新闻到云端
    const newNewsList = [newItem, ...news];
    saveNewsToCloud(newNewsList);
    
    setActiveTab('feed');
  };

  const handleDeleteNews = (id: string) => {
    if (confirm('确定要删除这条情报吗？(该操作会同步给所有同事)')) {
      // 🟢 逻辑更新：同步删除操作
      const updatedList = news.filter(item => item.id !== id);
      saveNewsToCloud(updatedList);
    }
  };

  const handleAddBrand = (brand: string) => {
    if (!customBrands.includes(brand)) {
      // 🟢 逻辑更新：同步新增品牌
      const updatedBrands = [...customBrands, brand];
      saveBrandsToCloud(updatedBrands);
    }
  };

  const handleRemoveBrand = (brand: string) => {
    // 🟢 逻辑更新：同步删除品牌
    const updatedBrands = customBrands.filter(b => b !== brand);
    saveBrandsToCloud(updatedBrands);

    setFilters(prev => ({
      ...prev,
      selectedBrands: prev.selectedBrands.filter(b => b !== brand)
    }));
  };

  // Stats (保持不变)
  const stats = useMemo(() => {
    if (news.length === 0) return { count: 0, topBrand: 'N/A', latest: 'N/A', sources: 0 };
    
    const brandCounts: Record<string, number> = {};
    const sources = new Set<string>();
    let latestDate = '';

    news.forEach(item => {
        brandCounts[item.brand] = (brandCounts[item.brand] || 0) + 1;
        sources.add(item.source);
        if (!latestDate || item.date > latestDate) latestDate = item.date;
    });

    const topBrand = Object.entries(brandCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || 'N/A';

    return {
        count: news.length,
        topBrand,
        latest: latestDate,
        sources: sources.size
    };
  }, [news]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar 
        filters={filters} 
        setFilters={setFilters} 
        allNews={news}
        availableBrands={customBrands}
        onAddBrand={handleAddBrand}
        onRemoveBrand={handleRemoveBrand}
      />
      
      <main className="flex-1 ml-72 h-full overflow-y-auto bg-slate-50">
        <div className="max-w-5xl mx-auto p-8">
          
          {/* Top Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {/* 🟢 加了一个同步状态提示 */}
            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-red-500 relative">
              <p className="text-xs text-slate-400 uppercase font-semibold flex items-center justify-between">
                当前情报数 {isSyncing && <LoadingIcon />}
              </p>
              <p className="text-2xl font-bold text-slate-800">{stats.count} 条</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-orange-500">
              <p className="text-xs text-slate-400 uppercase font-semibold">活跃品牌</p>
              <p className="text-2xl font-bold text-slate-800 truncate">{stats.topBrand}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
              <p className="text-xs text-slate-400 uppercase font-semibold">最新情报</p>
              <p className="text-2xl font-bold text-slate-800 text-sm md:text-xl">{stats.latest}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-purple-500">
              <p className="text-xs text-slate-400 uppercase font-semibold">来源覆盖</p>
              <p className="text-2xl font-bold text-slate-800">{stats.sources}</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6 border-b border-slate-200">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('feed')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'feed'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                📅 情报时间线 (Feed)
              </button>
              <button
                onClick={() => setActiveTab('entry')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'entry'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                📝 录入与分析 (Add News)
              </button>
            </nav>
          </div>

          {/* Content Area */}
          <div className="min-h-[500px]">
            {activeTab === 'feed' ? (
              <div className="space-y-2">
                {/* 🟢 加载状态显示 */}
                {isSyncing && news.length === 0 ? (
                    <div className="text-center py-20">
                        <LoadingIcon /> 
                        <span className="ml-2 text-slate-500">正在从云端同步数据...</span>
                    </div>
                ) : filteredNews.length > 0 ? (
                  filteredNews.map(item => (
                    <NewsCard key={item.id} item={item} onDelete={handleDeleteNews} />
                  ))
                ) : (
                  <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                    <p className="text-slate-400 text-lg">📭 当前筛选范围内没有数据。</p>
                    <button 
                        onClick={() => setFilters({
                            startDate: defaultStartDate,
                            endDate: defaultEndDate,
                            selectedBrands: [], // Reset to empty to match logic
                            selectedTypes: NEWS_TYPES_LIST,
                            searchQuery: ''
                        })}
                        className="mt-4 text-red-500 font-medium hover:underline"
                    >
                        重置筛选
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <EntryForm onAdd={handleAddNews} />
            )}
          </div>

        </div>
      </main>
    </div>
  );
}

export default App;
