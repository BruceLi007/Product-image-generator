import { useState, useEffect, useCallback } from 'react';
import {
  Sparkles, Image, FileText, Download, Trash2, ChevronDown, ChevronRight,
  Clock, CheckCircle, XCircle, AlertCircle, Search,
} from 'lucide-react';
import { ConversationRecord } from '../types';
import {
  loadHistoryRecords, deleteHistoryRecord, clearHistory,
  exportHistoryAsJson, exportSingleRecordAsJson,
} from '../utils/history';
import { showToast } from '../components/Toast';

const TASK_TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  generate: { label: '主图生成', icon: <Sparkles size={16} />, color: '#007AFF' },
  produce: { label: '图片生成', icon: <Image size={16} />, color: '#34C759' },
  describe: { label: '图片描述', icon: <FileText size={16} />, color: '#FF9500' },
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getInputSummary(record: ConversationRecord): string {
  if (record.productName) return `商品：${record.productName}`;
  if (record.prompt) return `提示词：${record.prompt.slice(0, 40)}${record.prompt.length > 40 ? '...' : ''}`;
  if (record.uploadedFileName) return `图片：${record.uploadedFileName}`;
  return '-';
}

function getOutputSummary(record: ConversationRecord): string {
  if (record.results && record.results.length > 0) {
    return `生成 ${record.results.length} 套文案`;
  }
  if (record.imageUrls && record.imageUrls.length > 0) {
    return `生成 ${record.imageUrls.length} 张图片`;
  }
  if (record.description) {
    return `描述：${record.description.slice(0, 30)}${record.description.length > 30 ? '...' : ''}`;
  }
  return '-';
}

export default function HistoryPage() {
  const [records, setRecords] = useState<ConversationRecord[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const refresh = useCallback(() => setRecords(loadHistoryRecords()), []);

  useEffect(() => { refresh(); }, [refresh]);

  const filtered = search.trim()
    ? records.filter(r =>
        JSON.stringify(r).toLowerCase().includes(search.toLowerCase())
      )
    : records;

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteHistoryRecord(id);
    if (expandedId === id) setExpandedId(null);
    refresh();
    showToast('已删除', 'success');
  };

  const handleClearAll = () => {
    clearHistory();
    setExpandedId(null);
    refresh();
    showToast('已清空所有记录', 'success');
  };

  const handleExportSingle = (record: ConversationRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    exportSingleRecordAsJson(record);
    showToast('已导出 JSON', 'success');
  };

  const handleExportAll = () => {
    if (records.length === 0) { showToast('暂无记录可导出', 'error'); return; }
    exportHistoryAsJson(records);
    showToast(`已导出 ${records.length} 条记录`, 'success');
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="shrink-0">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="text-xl font-bold text-[#1D1D1F]">对话历史</h1>
            <p className="text-[13px] text-[#86868B] mt-0.5">
              共 {records.length} 条记录
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportAll}
              disabled={records.length === 0}
              className="mac-btn-secondary text-xs px-3 py-1.5 gap-1.5 disabled:opacity-40"
            >
              <Download size={14} />
              导出全部
            </button>
            {records.length > 0 && (
              <button
                onClick={handleClearAll}
                className="mac-btn-secondary text-xs px-3 py-1.5 gap-1.5 text-[#FF5F57] hover:bg-[#FFF2F0]"
              >
                <Trash2 size={14} />
                清空
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        {records.length > 0 && (
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#86868B]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="搜索历史记录..."
              className="mac-input pl-8 text-[12px] h-9"
            />
          </div>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto min-h-0 space-y-2 pb-4">
        {records.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full select-none gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#F2F2F7] flex items-center justify-center">
              <Clock size={28} className="text-[#C7C7CC]" />
            </div>
            <div className="text-center">
              <p className="text-[13px] font-medium text-[#86868B]">暂无历史记录</p>
              <p className="text-[11px] text-[#C7C7CC] mt-0.5">完成任务后会自动记录在此</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 select-none gap-3">
            <Search size={24} className="text-[#C7C7CC]" />
            <p className="text-[13px] font-medium text-[#86868B]">没有匹配的记录</p>
          </div>
        ) : (
          filtered.map(r => (
            <HistoryCard
              key={r.id}
              record={r}
              isExpanded={expandedId === r.id}
              onToggle={() => setExpandedId(expandedId === r.id ? null : r.id)}
              onDelete={(e) => handleDelete(r.id, e)}
              onExport={(e) => handleExportSingle(r, e)}
            />
          ))
        )}
      </div>
    </div>
  );
}

/* ──────── Single Record Card ──────── */

function HistoryCard({
  record, isExpanded, onToggle, onDelete, onExport,
}: {
  record: ConversationRecord;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onExport: (e: React.MouseEvent) => void;
}) {
  const config = TASK_TYPE_CONFIG[record.taskType] || TASK_TYPE_CONFIG.generate;

  return (
    <div className="mac-card overflow-hidden">
      {/* Collapsed header */}
      <div
        onClick={onToggle}
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[#F8F8FA] transition-colors select-none"
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${config.color}15` }}
        >
          <span style={{ color: config.color }}>{config.icon}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-semibold text-[#1D1D1F]">{config.label}</span>
            {record.status === 'success' ? (
              <CheckCircle size={12} color="#28C840" />
            ) : (
              <XCircle size={12} color="#FF5F57" />
            )}
            <span className="text-[10px] text-[#86868B] ml-auto">{formatTime(record.timestamp)}</span>
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[11px] text-[#86868B] truncate">{getInputSummary(record)}</span>
            <span className="text-[10px] text-[#C7C7CC] shrink-0">→</span>
            <span className="text-[11px] text-[#86868B] truncate">{getOutputSummary(record)}</span>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
          <button
            onClick={onExport}
            className="p-1.5 rounded-lg text-[#86868B] hover:bg-[#F2F2F7] transition-all"
            title="导出 JSON"
          >
            <Download size={14} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg text-[#C7C7CC] hover:text-[#FF5F57] hover:bg-[#FFF2F0] transition-all"
            title="删除"
          >
            <Trash2 size={14} />
          </button>
          <span className="ml-1 text-[#C7C7CC]">
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </span>
        </div>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="border-t border-[#F2F2F7] px-4 py-3 space-y-4 bg-[#FAFAFC]">
          {/* Error message */}
          {record.status === 'error' && record.errorMessage && (
            <div className="flex items-start gap-2 bg-[#FFF0EE] border border-[#FFC7C2] rounded-lg px-3 py-2">
              <AlertCircle size={14} color="#FF5F57" className="mt-0.5 shrink-0" />
              <span className="text-[11px] text-[#C41E1E]">{record.errorMessage}</span>
            </div>
          )}

          {/* User Input Section */}
          <DetailSection title="用户输入">
            {record.taskType === 'generate' && (
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                <DetailField label="商品名称" value={record.productName} />
                <DetailField label="品牌" value={record.brand} />
                <DetailField label="类目" value={record.category} />
                <DetailField label="售价" value={record.salePrice != null ? `¥${record.salePrice}` : undefined} />
                <DetailField label="原价" value={record.originalPrice != null ? `¥${record.originalPrice}` : undefined} />
                <DetailField label="参考图片" value={record.imageFileName || undefined} />
                {record.attributes && (
                  <div className="col-span-2">
                    <DetailField label="属性" value={record.attributes} />
                  </div>
                )}
                {record.specifications && (
                  <div className="col-span-2">
                    <DetailField label="规格" value={record.specifications} />
                  </div>
                )}
                {record.sellingPoints && record.sellingPoints.length > 0 && (
                  <div className="col-span-2">
                    <span className="text-[10px] font-medium text-[#86868B] block mb-1">卖点</span>
                    <div className="flex flex-wrap gap-1">
                      {record.sellingPoints.map((sp, i) => (
                        <span key={i} className="mac-tag text-[10px]">{sp}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {record.taskType === 'produce' && (
              <DetailField label="图片描述词" value={record.prompt} />
            )}
            {record.taskType === 'describe' && (
              <div className="space-y-1.5">
                <DetailField label="文件名" value={record.uploadedFileName} />
                {record.uploadedFileSize != null && (
                  <DetailField label="文件大小" value={`${(record.uploadedFileSize / 1024).toFixed(1)} KB`} />
                )}
              </div>
            )}
          </DetailSection>

          {/* AI Output Section */}
          <DetailSection title="AI 输出">
            {record.taskType === 'generate' && record.results && (
              <div className="space-y-3">
                {record.results.map((r, i) => (
                  <div key={r.id} className="bg-white rounded-lg border border-[#E5E5EA] p-3 space-y-2">
                    <div className="flex items-start gap-3">
                      {r.mainImageUrl && (
                        <img
                          src={r.mainImageUrl}
                          alt={r.title}
                          className="w-16 h-16 rounded-lg object-cover border border-[#E5E5EA] shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-[#1D1D1F]">{r.title}</p>
                        <p className="text-[11px] text-[#86868B] mt-1 whitespace-pre-wrap line-clamp-3">{r.copy}</p>
                      </div>
                    </div>
                    {r.sellingPoints.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {r.sellingPoints.map((sp, j) => (
                          <span key={j} className="mac-tag text-[10px]">{sp.replace(/^[✨✅]\s*/, '')}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {record.taskType === 'produce' && record.imageUrls && (
              <div>
                {record.imageUrls.length > 0 ? (
                  <div className="grid grid-cols-4 gap-2">
                    {record.imageUrls.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt={`生成图 ${i + 1}`}
                        className="w-full aspect-square rounded-lg object-cover border border-[#E5E5EA]"
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-[#86868B]">（无图片数据）</p>
                )}
              </div>
            )}
            {record.taskType === 'describe' && (
              <div className="space-y-3">
                {record.description && (
                  <div>
                    <p className="text-[10px] font-medium text-[#86868B] mb-1">图片描述</p>
                    <p className="text-[12px] text-[#1D1D1F] bg-white rounded-lg border border-[#E5E5EA] p-2.5 leading-relaxed">
                      {record.description}
                    </p>
                  </div>
                )}
                {record.sellingPoints && record.sellingPoints.length > 0 && (
                  <div>
                    <p className="text-[10px] font-medium text-[#86868B] mb-1">核心卖点</p>
                    <ul className="space-y-1">
                      {record.sellingPoints.map((sp, i) => (
                        <li key={i} className="text-[12px] text-[#1D1D1F] flex items-start gap-2">
                          <span className="text-[#007AFF] font-medium shrink-0">{i + 1}.</span>
                          <span>{sp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {record.keywords && record.keywords.length > 0 && (
                  <div>
                    <p className="text-[10px] font-medium text-[#86868B] mb-1">关键词</p>
                    <div className="flex flex-wrap gap-1">
                      {record.keywords.map((kw, i) => (
                        <span key={i} className="mac-tag text-[10px]">{kw}</span>
                      ))}
                    </div>
                  </div>
                )}
                {record.tags && record.tags.length > 0 && (
                  <div>
                    <p className="text-[10px] font-medium text-[#86868B] mb-1">标签</p>
                    <div className="flex flex-wrap gap-1">
                      {record.tags.map((tag, i) => (
                        <span key={i} className="mac-tag text-[10px]">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DetailSection>

          {/* Bottom actions */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              onClick={onExport}
              className="mac-btn-secondary text-xs px-3 py-1.5 gap-1.5"
            >
              <Download size={12} />
              导出 JSON
            </button>
            <button
              onClick={onDelete}
              className="mac-btn-secondary text-xs px-3 py-1.5 gap-1.5 text-[#FF5F57] hover:bg-[#FFF2F0]"
            >
              <Trash2 size={12} />
              删除
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ──────── Sub Components ──────── */

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-[#86868B] uppercase tracking-wider mb-2">{title}</p>
      {children}
    </div>
  );
}

function DetailField({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <span className="text-[10px] font-medium text-[#86868B]">{label}：</span>
      <span className="text-[11px] text-[#1D1D1F] whitespace-pre-wrap">{value}</span>
    </div>
  );
}
