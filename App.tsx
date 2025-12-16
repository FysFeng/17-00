import React, { useState, useMemo, useEffect } from 'react';
import { Search } from 'lucide-react'; // 引入搜索图标
import Sidebar from './components/Sidebar';
import NewsCard from './components/NewsCard';
import EntryForm from './components/EntryForm';
import { DEFAULT_BRANDS, NEWS_TYPES_LIST } from './constants';
import { NewsItem, FilterState } from './types';

// 加载动画组件
const LoadingIcon = () => (
  <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

function App() {
  // 🟢 1. 状态管理
  const [news, setNews] = useState<NewsItem[]>([]);
  const [customBrands, setCustomBrands] = useState<string[]>(DEFAULT_BRANDS);
  const [isSyncing, setIsSyncing] = useState(true);

  // 默认筛选时间范围：最近30天
  const defaultEndDate = new Date().toISOString().split('T')[0];
  const defaultStartDate = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];

  const [filters, setFilters] = useState<FilterState>({
    startDate: defaultStartDate,
    endDate: defaultEndDate,
    selectedBrands: [],
    selectedTypes: NEWS_TYPES_LIST,
    searchQuery: '' // 搜索关键词
  });

  const [activeTab, setActiveTab] = useState<'feed' | 'entry'>('feed');

  // 🟢 2. 启动时：从云端同步数据 (News + Brands)
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

        if (Array.isArray(newsData) && newsData.length > 0) setNews(newsData);
        if (Array.isArray(brandsData) && brandsData.length > 0) setCustomBrands(brandsData);
        
      } catch (error) {
        console.error("Cloud sync failed:", error);
      } finally {
        setIsSyncing(false);
      }
    };
    fetchCloudData();
  }, []);

  // 🟢 3. 云端保存逻辑
  const saveNewsToCloud = async (updatedNews: NewsItem[]) => {
    setNews(updatedNews);
    try {
      await fetch('/api/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedNews)
      });
    } catch (err) { console.error("Save news error:", err); }
  };

  const saveBrandsToCloud = async (updatedBrands: string[]) => {
    setCustomBrands(updatedBrands);
    try {
      await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedBrands)
      });
    } catch (err) { console.error("Save brands error:", err); }
  };

  // 🟢 4. 筛选与搜索逻辑
  const filteredNews = useMemo(() => {
    return news.filter(item => {
      const dateMatch = item.date >= filters.startDate && item.date <= filters.endDate;
      const brandMatch = filters.selectedBrands.length === 0 || filters.selectedBrands.includes(item.brand);
      const typeMatch = filters.selectedTypes.length === 0 || filters.selectedTypes.includes(item.type);
      
      // 🔍 搜索匹配逻辑 (标题 或 摘要)
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
    
    // 自动同步新品牌
    let newBrandsList = customBrands;
    if (!customBrands.includes(itemData.brand)) {
        newBrandsList = [...customBrands, itemData.brand];
        saveBrandsToCloud(newBrandsList);
    }

    // 自动同步新闻
    const newNewsList = [newItem, ...news];
    saveNewsToCloud(newNewsList);
    setActiveTab('feed');
  };

  const handleDeleteNews = (id: string) => {
    if (confirm('确定要删除吗？(将同步删除)')) {
      const updatedList = news.filter(item => item.id !== id);
      saveNewsToCloud(updatedList);
    }
  };

  const handleAddBrand = (brand: string) => {
    if (!customBrands.includes(brand)) {
      saveBrandsToCloud([...customBrands, brand]);
    }
  };

  const handleRemoveBrand = (brand: string) => {
    saveBrandsToCloud(customBrands.filter(b => b !== brand));
    setFilters(prev => ({
      ...prev,
      selectedBrands: prev.selectedBrands.filter(b => b !== brand)
    }));
  };

  // 统计数据
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
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* 侧边栏 */}
      <Sidebar 
        filters={filters} 
        setFilters={setFilters} 
        allNews={news}
        availableBrands={customBrands}
        onAddBrand={handleAddBrand}
        onRemoveBrand={handleRemoveBrand}
      />
      
      {/* 主内容区 */}
      <main className="flex-1 ml-72 h-full overflow-y-auto">
        <div className="max-w-5xl mx-auto p-8">
          
          {/* 统计卡片 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-red-500 relative overflow-hidden">
               <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-semibold">当前情报</p>
                    <p className="text-2xl font-bold text-slate-800">{stats.count} 条</p>
                  </div>
                  {isSyncing && <LoadingIcon />}
               </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-orange-500">
              <p className="text-xs text-slate-400 uppercase font-semibold">活跃品牌</p>
              <p className="text-2xl font-bold text-slate-800 truncate">{stats.topBrand}</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-blue-500">
              <p className="text-xs text-slate-400 uppercase font-semibold">最新更新</p>
              <p className="text-2xl font-bold text-slate-800 text-lg">{stats.latest}</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-purple-500">
              <p className="text-xs text-slate-400 uppercase font-semibold">情报来源</p>
              <p className="text-2xl font-bold text-slate-800">{stats.sources} 个</p>
            </div>
          </div>

          {/* 导航 Tab */}
          <div className="mb-6 border-b border-slate-200">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('feed')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'feed'
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                📅 情报时间线
              </button>
              <button
                onClick={() => setActiveTab('entry')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'entry'
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                📝 录入与分析
              </button>
            </nav>
          </div>

          {/* 内容展示区 */}
          <div className="min-h-[500px]">
            {activeTab === 'feed' ? (
              <div className="space-y-4">
                
                {/* 🔍 新增：顶部搜索栏 */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm shadow-sm transition-shadow"
                    placeholder="搜索情报标题、摘要内容..."
                    value={filters.searchQuery}
                    onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                  />
                </div>

                {/* 列表内容 */}
                {isSyncing && news.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="inline-block"><LoadingIcon /></div>
                        <p className="mt-2 text-slate-500">正在同步云端数据...</p>
                    </div>
                ) : filteredNews.length > 0 ? (
                  filteredNews.map(item => (
                    <NewsCard key={item.id} item={item} onDelete={handleDeleteNews} />
                  ))
                ) : (
                  <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                    <p className="text-slate-400 text-lg">📭 没有找到相关情报。</p>
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
                        清除筛选条件
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // 🟢 关键修复：把 customBrands 传给 EntryForm
              <EntryForm 
                onAdd={handleAddNews} 
                availableBrands={customBrands} 
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
