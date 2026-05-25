import { GenerationResult, GenerationStatus } from '../types';
import ResultCard from './ResultCard';
import { Sparkles, AlertCircle, ImageIcon } from 'lucide-react';

interface Props {
  status: GenerationStatus;
  results: GenerationResult[];
  onToggleFavorite: (id: string) => void;
  onDownloadAll: () => void;
  onRegenerate: () => void;
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full select-none gap-4">
      <div className="grid grid-cols-2 gap-2.5 w-[200px]">
        <div className="h-16 rounded-lg bg-[#F2F2F7] border border-[#E5E5EA]" />
        <div className="h-16 rounded-lg bg-[#F2F2F7] border border-[#E5E5EA]" />
        <div className="h-16 rounded-lg bg-[#F2F2F7] border border-[#E5E5EA]" />
        <div className="h-16 rounded-lg bg-[#F2F2F7] border border-[#E5E5EA]" />
      </div>
      <div className="text-center">
        <p className="text-[13px] font-medium text-[#86868B]">等待生成</p>
        <p className="text-[11px] text-[#C7C7CC] mt-0.5">在左侧填写商品信息后点击生成</p>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center h-full select-none gap-4">
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-[#007AFF] animate-pulse" />
        <span className="w-2 h-2 rounded-full bg-[#007AFF] animate-pulse" style={{ animationDelay: '0.2s' }} />
        <span className="w-2 h-2 rounded-full bg-[#007AFF] animate-pulse" style={{ animationDelay: '0.4s' }} />
      </div>
      <p className="text-[13px] font-medium text-[#86868B]">正在生成...</p>
    </div>
  );
}

function ErrorState() {
  return (
    <div className="flex flex-col items-center justify-center h-full select-none gap-3">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: '#FFF2F0' }}>
        <AlertCircle size={22} color="#FF5F57" />
      </div>
      <p className="text-[13px] font-medium text-[#FF5F57]">生成失败</p>
    </div>
  );
}

export default function ResultPanel({ status, results, onToggleFavorite }: Props) {
  const content = () => {
    switch (status) {
      case 'idle': return <EmptyState />;
      case 'generating': return <LoadingState />;
      case 'error': return <ErrorState />;
      case 'done':
        if (results.length === 0) return <EmptyState />;
        return (
          <div className="space-y-3 pb-4">
            {results.map((r) => (
              <div key={r.id} className="animate-fade-in">
                <ResultCard result={r} onToggleFavorite={onToggleFavorite} />
              </div>
            ))}
          </div>
        );
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2.5 mb-4 shrink-0">
        <h2 className="text-[13px] font-semibold text-[#1D1D1F]">生成结果</h2>
        {results.length > 0 && (
          <span className="mac-badge">{results.length} 套</span>
        )}
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">{content()}</div>
    </div>
  );
}
