import { GenerationResult, UserSettings } from '../types';
import { BarChart3, Sparkles, Star, ArrowRight, Clock, Image } from 'lucide-react';

interface Props {
  results: GenerationResult[];
  settings: UserSettings;
  onNavigate: (page: 'tasks' | 'templates') => void;
}

export default function HomePage({ results, settings, onNavigate }: Props) {
  const totalGenerations = results.length;
  const favoritedCount = results.filter((r) => r.isFavorited).length;
  const latestResult = results[results.length - 1];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-xl font-bold text-[#1D1D1F]">概览</h1>
        <p className="text-[13px] text-[#86868B] mt-0.5">项目整体进度与快捷操作</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="mac-card p-4">
          <div className="flex items-center gap-2 text-[#86868B] mb-2">
            <Sparkles size={16} />
            <span className="text-[11px] font-semibold">生成次数</span>
          </div>
          <p className="text-2xl font-bold text-[#1D1D1F]">{totalGenerations}</p>
        </div>
        <div className="mac-card p-4">
          <div className="flex items-center gap-2 text-[#86868B] mb-2">
            <Star size={16} />
            <span className="text-[11px] font-semibold">已收藏</span>
          </div>
          <p className="text-2xl font-bold text-[#1D1D1F]">{favoritedCount}</p>
        </div>
        <div className="mac-card p-4">
          <div className="flex items-center gap-2 text-[#86868B] mb-2">
            <BarChart3 size={16} />
            <span className="text-[11px] font-semibold">默认售价</span>
          </div>
          <p className="text-2xl font-bold text-[#1D1D1F]">¥{settings.defaultSalePrice}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mac-card p-4">
        <h2 className="text-[13px] font-semibold text-[#1D1D1F] mb-3">快捷操作</h2>
        <div className="flex gap-3">
          <button onClick={() => onNavigate('tasks')} className="mac-btn-secondary text-xs px-4 py-2 gap-2">
            <Sparkles size={14} />
            新建生成任务
            <ArrowRight size={14} />
          </button>
          <button onClick={() => onNavigate('templates')} className="mac-btn-secondary text-xs px-4 py-2 gap-2">
            <Image size={14} />
            查看模板库
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mac-card p-4">
        <h2 className="text-[13px] font-semibold text-[#1D1D1F] mb-3">最近生成</h2>
        {results.length === 0 ? (
          <div className="text-center py-8">
            <Clock size={24} className="mx-auto text-[#C7C7CC]" />
            <p className="text-[12px] text-[#86868B] mt-2">暂无生成记录</p>
            <button onClick={() => onNavigate('tasks')} className="mac-btn text-xs mt-3 px-4 py-1.5">
              开始第一次生成
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {[...results].reverse().slice(0, 5).map((r) => (
              <div key={r.id} className="flex items-center gap-3 py-2 border-b border-[#F2F2F7] last:border-0">
                {r.mainImageUrl && (
                  <img src={r.mainImageUrl} alt="" className="w-10 h-10 rounded-lg object-cover border border-[#E5E5EA]" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-[#1D1D1F] truncate">{r.title}</p>
                  <p className="text-[10px] text-[#86868B]">{r.isFavorited ? '⭐ 已收藏' : '未收藏'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
