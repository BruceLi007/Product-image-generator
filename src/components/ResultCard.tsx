import { useState } from 'react';
import { Copy, Download, Star, Check } from 'lucide-react';
import { GenerationResult } from '../types';
import MainImageCanvas from './MainImageCanvas';
import { showToast } from './Toast';

interface Props {
  result: GenerationResult;
  onToggleFavorite: (id: string) => void;
}

export default function ResultCard({ result, onToggleFavorite }: Props) {
  const [copying, setCopying] = useState(false);
  const [starHover, setStarHover] = useState(false);

  const handleCopy = async () => {
    try {
      setCopying(true);
      await navigator.clipboard.writeText(result.copy);
      showToast('已复制', 'success');
      setTimeout(() => setCopying(false), 1000);
    } catch { showToast('复制失败', 'error'); setCopying(false); }
  };

  const handleDownload = () => {
    try {
      const link = document.createElement('a');
      link.href = result.mainImageUrl;
      link.download = `主图_${result.title.slice(0, 10)}.png`;
      document.body.appendChild(link); link.click();
      document.body.removeChild(link);
      showToast('下载成功', 'success');
    } catch { showToast('下载失败', 'error'); }
  };

  return (
    <div className={`mac-card overflow-hidden ${result.isFavorited ? 'border-[#FEBC2E]' : ''}`}>
      <div className="flex gap-4 p-4">
        {/* Image */}
        <div className="w-[160px] shrink-0">
          <MainImageCanvas imageUrl={result.mainImageUrl} alt={result.title} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <h3 className="text-[14px] font-bold text-[#1D1D1F] leading-snug line-clamp-1">{result.title}</h3>
            {result.sellingPoints.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {result.sellingPoints.map((p, i) => (
                  <span key={i} className="mac-tag">
                    {p.replace(/^[✨✅]\s*/, '')}
                  </span>
                ))}
              </div>
            )}
            <p className="text-[12px] text-[#86868B] mt-1.5 leading-relaxed line-clamp-2">{result.copy}</p>
          </div>

          <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-[#F2F2F7]">
            <button onClick={handleCopy}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${copying ? 'text-white bg-[#28C840]' : 'text-[#86868B] border border-[#D2D2D7] hover:bg-[#F2F2F7]'}`}>
              {copying ? <Check size={12} /> : <Copy size={12} />}
              {copying ? '已复制' : '复制文案'}
            </button>
            <button onClick={handleDownload}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-[#86868B] border border-[#D2D2D7] hover:bg-[#F2F2F7] transition-all">
              <Download size={12} />下载主图
            </button>
            <button onClick={() => onToggleFavorite(result.id)}
              onMouseEnter={() => setStarHover(true)} onMouseLeave={() => setStarHover(false)}
              className="ml-auto p-1 rounded-lg transition-colors"
              style={{ color: result.isFavorited ? '#FEBC2E' : starHover ? '#FEBC2E' : '#C7C7CC' }}>
              <Star size={16} fill={result.isFavorited ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
