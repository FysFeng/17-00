import React, { useState } from 'react';
import { NewsItem, NewsType } from '../types';
import { NEWS_TYPE_LABELS } from '../constants';

interface NewsCardProps {
  item: NewsItem;
  onDelete: (id: string) => void;
}

const getTypeColor = (type: NewsType) => {
  switch (type) {
    case NewsType.LAUNCH: return 'bg-blue-100 text-blue-800';
    case NewsType.POLICY: return 'bg-purple-100 text-purple-800';
    case NewsType.SALES: return 'bg-green-100 text-green-800';
    case NewsType.PERSONNEL: return 'bg-orange-100 text-orange-800';
    case NewsType.COMPETITOR: return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const NewsCard: React.FC<NewsCardProps> = ({ item, onDelete }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="group relative pl-8 pb-12 last:pb-0">
      {/* Timeline Line */}
      <div className="absolute left-[11px] top-4 bottom-0 w-0.5 bg-gray-200 group-last:bottom-auto group-last:h-full"></div>
      
      {/* Timeline Dot */}
      <div className="absolute left-0 top-6 w-6 h-6 rounded-full border-4 border-white bg-red-500 shadow-md z-10"></div>
      
      {/* Card Content */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 hover:shadow-lg hover:border-red-100 transition-all duration-300 flex flex-col md:flex-row gap-6">
        
        {/* Image */}
        <div className="w-full md:w-48 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
          <img 
            src={item.image} 
            alt={item.title} 
            className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://picsum.photos/400/300?blur=2';
            }}
          />
        </div>

        {/* Text */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider">
                {item.brand}
              </span>
              <span className={`px-2.5 py-0.5 rounded text-xs font-semibold ${getTypeColor(item.type)}`}>
                {NEWS_TYPE_LABELS[item.type]}
              </span>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              📅 {item.date}
            </span>
          </div>

          <h3 className="text-lg font-bold text-slate-800 leading-tight mb-2">
            {item.title}
          </h3>
          
          <p className="text-sm text-slate-600 leading-relaxed mb-4 flex-1 line-clamp-3">
            {item.summary}
          </p>
          
          {expanded && (
             <div className="mt-2 mb-4 p-3 bg-slate-50 rounded-lg text-sm text-slate-700 border border-slate-100 animate-fadeIn">
                <p className="font-semibold mb-1">完整摘要:</p>
                {item.summary}
                <div className="mt-2 text-xs text-slate-400">ID: {item.id}</div>
             </div>
          )}

          <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
            <div className="flex items-center gap-4 text-xs">
              <span className="text-slate-400">来源: <span className="font-medium text-slate-600">{item.source}</span></span>
              
              <button 
                onClick={() => setExpanded(!expanded)}
                className="text-slate-500 hover:text-slate-800 font-medium underline decoration-slate-300 hover:decoration-slate-500 underline-offset-2"
              >
                {expanded ? "收起详情" : "查看详情"}
              </button>

              {item.url && item.url !== '#' ? (
                 <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-red-500 hover:text-red-600 font-medium flex items-center gap-1">
                   🔗 跳转原文
                 </a>
              ) : (
                 <span className="text-slate-300 cursor-not-allowed">无链接</span>
              )}
            </div>
            
            <button 
              onClick={() => onDelete(item.id)}
              className="text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1 text-xs"
              title="删除此条情报"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>删除</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsCard;