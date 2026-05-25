import { GenerationResult } from '../types';
import { Star, Copy, Download, Trash2, Heart } from 'lucide-react';
import { showToast } from '../components/Toast';
import { useState } from 'react';

interface Props {
  results: GenerationResult[];
  onToggleFavorite: (id: string) => void;
  onRemove: (id: string) => void;
}

export default function TemplatePage({ results, onToggleFavorite, onRemove }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const favorited = results.filter((r) => r.isFavorited);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('已复制', 'success');
    } catch {
      showToast('复制失败', 'error');
    }
  };

  const handleDownload = (url: string, title: string) => {
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = `模板_${title.slice(0, 10)}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('下载成功', 'success');
    } catch {
      showToast('下载失败', 'error');
    }
  };

  if (favorited.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full select-none gap-4">
        <div className="w-16 h-16 rounded-2xl bg-[#FFFDF0] border border-[#FEBC2E]/30 flex items-center justify-center">
          <Heart size={28} className="text-[#FEBC2E]" />
        </div>
        <div className="text-center">
          <p className="text-[13px] font-medium text-[#86868B]">模板库为空</p>
          <p className="text-[11px] text-[#C7C7CC] mt-0.5">在生成结果中收藏喜欢的模板</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1D1D1F]">模板库</h1>
          <p className="text-[13px] text-[#86868B] mt-0.5">共 {favorited.length} 个收藏模板</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {favorited.map((item) => (
          <div key={item.id} className="mac-card overflow-hidden hover:border-[#FEBC2E] transition-colors">
            {/* Image */}
            <div className="aspect-square bg-[#F5F5F7] border-b border-[#E5E5EA]">
              <img src={item.mainImageUrl} alt={item.title} className="w-full h-full object-cover" />
            </div>

            {/* Info */}
            <div className="p-3 space-y-2">
              <h3 className="text-[12px] font-semibold text-[#1D1D1F] line-clamp-1">{item.title}</h3>
              <p className="text-[11px] text-[#86868B] line-clamp-2">{item.copy}</p>

              {/* Tags */}
              {item.sellingPoints.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {item.sellingPoints.slice(0, 2).map((p, i) => (
                    <span key={i} className="mac-tag text-[10px]">{p.replace(/^[✨✅]\s*/, '')}</span>
                  ))}
                  {item.sellingPoints.length > 2 && (
                    <span className="mac-tag text-[10px]">+{item.sellingPoints.length - 2}</span>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-1.5 pt-2 border-t border-[#F2F2F7]">
                <button onClick={() => handleCopy(item.copy)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium text-[#86868B] border border-[#D2D2D7] hover:bg-[#F2F2F7] transition-all">
                  <Copy size={11} />文案
                </button>
                <button onClick={() => handleDownload(item.mainImageUrl, item.title)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium text-[#86868B] border border-[#D2D2D7] hover:bg-[#F2F2F7] transition-all">
                  <Download size={11} />图片
                </button>
                <button onClick={() => onToggleFavorite(item.id)}
                  className="ml-auto p-1 rounded-lg text-[#FEBC2E] hover:bg-[#FFFDF0] transition-all">
                  <Star size={14} fill="currentColor" />
                </button>
                <button onClick={() => onRemove(item.id)}
                  className="p-1 rounded-lg text-[#C7C7CC] hover:text-[#FF5F57] hover:bg-[#FFF2F0] transition-all">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
