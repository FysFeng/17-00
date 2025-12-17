import React, { useState, useMemo, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import NewsCard from './components/NewsCard';
import EntryForm from './components/EntryForm';
import { DEFAULT_BRANDS, NEWS_TYPES_LIST } from './constants';
import { NewsItem, FilterState } from './types';

// 加载动画
const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-20">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
    <span className="ml-3 text-slate-500">正在同步云端数据...</span>
  </div>
);

function App() {
  // 🟢 1. 状态初始化 (不再从 localStorage 读)
  const [news, setNews] = useState<NewsItem[]>([]);
  const [customBrands, setCustomBrands] = useState<string[]>(DEFAULT_BRANDS);
  const [isLoading, setIsLoading] = useState(true);

  // 🟢 2. 网页启动时：从云端下载数据
  useEffect(() => {
    const fetchCloudData = async () => {
      try {
        setIsLoading(true);
        // 加时间戳 ?t=... 强制获取最新数据
        const headers = { 'Cache-Control': 'no-cache' };
        const [newsRes, brandsRes] = await Promise.all([
          fetch(`/api/news?t=${Date.now()}`, { headers }),
          fetch(`/api/brands?t=${Date.now()}`, { headers })
        ]);

        const newsData = await newsRes.json();
        const brandsData = await brandsRes.json();

        if (Array.isArray(newsData)) setNews(newsData);
        if (Array.isArray(brandsData) && brandsData.length > 0) setCustomBrands(brandsData);
      } catch (error) {
        console.error("Cloud sync failed:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCloudData();
  }, []);

  // 🟢 3. 云端保存助手函数
  const saveNewsToCloud = async (data: NewsItem[]) => {
    setNews(data); // 先更新界面
    await fetch('/api/news', { method: 'POST', body: JSON.stringify(data) });
  };

  const saveBrandsToCloud = async (data: string[]) => {
    setCustomBrands(data); // 先更新界面
    await fetch('/api/brands', { method: 'POST', body: JSON.stringify(data) });
  };

  // 筛选逻辑 (保持不变)
  const defaultEndDate = new Date().toISOString().split('T')[0];
  const defaultStartDate = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
  
  const [filters, setFilters] = useState<FilterState>({
    startDate: defaultStartDate,
    endDate: defaultEndDate,
    selectedBrands: [], // 默认全选
    selectedTypes: NEWS_TYPES_LIST,
    searchQuery: ''
  });

  const [activeTab, setActiveTab] = useState<'feed' | 'entry'>('feed');

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

  // 🟢 4. 操作逻辑更新：调用云端保存
  const handleAddNews = (itemData: Omit<NewsItem, 'id'>) => {
    const newId = Math.random().toString(36).substring(2, 9);
    const newItem: NewsItem = {
      ...itemData,
      id: newId,
      image: itemData.image || `https://image.pollinations.ai/prompt/${encodeURIComponent(itemData.brand + ' car')}?nologo=true`
    };
    
    // 自动同步新品牌
    if (!customBrands.includes(itemData.brand)) {
        const newBrands = [...customBrands, itemData.brand];
        saveBrandsToCloud(newBrands);
    }

    // 保存新闻
    const newNewsList = [newItem, ...news];
    saveNewsToCloud(newNewsList);
    setActiveTab('feed');
  };

  const handleDeleteNews = (id: string) => {
    if (confirm('确定要删除这条情报吗？(将同步给所有同事)')) {
      const newNewsList = news.filter(item => item.id !== id);
      saveNewsToCloud(newNewsList);
    }
  };

  const handleAddBrand = (brand: string) => {
    if (!customBrands.includes(brand)) {
      saveBrandsToCloud([...customBrands, brand]);
    }
  };

  const handleRemoveBrand = (brand: string) => {
    const newBrands = customBrands.filter(b => b !== brand);
    saveBrandsToCloud(newBrands);
    setFilters(prev => ({
      ...prev,
      selectedBrands: prev.selectedBrands.filter(b => b !== brand)
    }));
  };

  // 统计逻辑 (保持不变)
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
    return { count: news.length, topBrand, latest: latestDate, sources: sources.size };
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
            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-red-500">
              <p className="text-xs text-slate-400 uppercase font-semibold">当前情报数</p>
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
                {isLoading ? (
                  <LoadingSpinner />
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
                            selectedBrands: [],
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
              <EntryForm onAdd={handleAddNews} availableBrands={customBrands} />
            )}
          </div>

        </div>
      </main>
    </div>
  );
}

export default App;
