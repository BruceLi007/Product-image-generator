import { useState, useCallback, useRef, DragEvent } from 'react';
import {
  Loader2, Lightbulb, Tags, Copy, Check, Upload, X, Image as ImageIcon, Download,
} from 'lucide-react';
import { ProductInput, GenerationResult, GenerationStatus, UserSettings, PageId } from '../types';
import { generateResults } from '../utils/mockGenerator';
import { generateImage, generateImageDescription } from '../utils/aiClient';
import InputPanel from '../components/InputPanel';
import ResultPanel from '../components/ResultPanel';
import { showToast } from '../components/Toast';
import { saveHistoryRecord, generateHistoryId } from '../utils/history';

type TaskTab = 'generate' | 'produce' | 'describe';

interface Props {
  results: GenerationResult[];
  settings: UserSettings;
  onResultsChange: (r: GenerationResult[]) => void;
  onSettingsChange: (s: UserSettings) => void;
  onNavigate?: (page: PageId) => void;
}

const TABS: { id: TaskTab; label: string }[] = [
  { id: 'generate', label: '主图生成' },
  { id: 'produce', label: '图片生成' },
  { id: 'describe', label: '图片描述' },
];

/* ──────── 模型选择器 ──────── */

const MODEL_PRESETS = [
  { key: 'text', label: '文字' },
  { key: 'image', label: '图片' },
  { key: 'recognition', label: '识图' },
] as const;

function getModelConfig(settings: UserSettings, key: string) {
  return {
    endpoint: settings[`${key}Endpoint` as keyof UserSettings] as string,
    apiKey: settings[`${key}ApiKey` as keyof UserSettings] as string,
    model: settings[`${key}Model` as keyof UserSettings] as string,
  };
}

function isConfigured(settings: UserSettings, key: string) {
  return !!(settings[`${key}Enabled` as keyof UserSettings] && settings[`${key}Endpoint` as keyof UserSettings] && settings[`${key}ApiKey` as keyof UserSettings]);
}

function ModelSelector({
  tabKey, settings, onPrefChange,
}: {
  tabKey: keyof UserSettings['tabModelPrefs'];
  settings: UserSettings;
  onPrefChange: (tab: keyof UserSettings['tabModelPrefs'], key: string) => void;
}) {
  const current = settings.tabModelPrefs[tabKey];
  const available = MODEL_PRESETS.filter((p) => isConfigured(settings, p.key));

  // If current is not configured, auto-switch to first available
  if (available.length > 0 && !isConfigured(settings, current)) {
    onPrefChange(tabKey, available[0].key);
  }

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F2F2F7]">
      <span className="text-[10px] font-medium text-[#86868B]">模型:</span>
      {available.length === 0 ? (
        <span className="text-[11px] text-[#FEBC2E]">没有配置</span>
      ) : (
        available.map((p) => {
          const cfg = getModelConfig(settings, p.key);
          return (
            <button
              key={p.key}
              onClick={() => onPrefChange(tabKey, p.key)}
              className={`text-[11px] px-2 py-0.5 rounded-md font-medium transition-all ${
                current === p.key
                  ? 'bg-[#007AFF] text-white'
                  : 'text-[#636366] hover:bg-[#E5E5EA]'
              }`}
              title={`${p.label} · ${cfg.model || extractHost(cfg.endpoint)}`}
            >
              {p.label}
            </button>
          );
        })
      )}
    </div>
  );
}

function extractHost(url: string): string {
  try { return new URL(url).hostname; } catch { return url; }
}

function ModelLockedBar({ settings, modelKey, label, onNavigate }: {
  settings: UserSettings;
  modelKey: string;
  label: string;
  onNavigate?: (page: PageId) => void;
}) {
  const enabled = !!(settings[`${modelKey}Enabled` as keyof UserSettings]);
  const configured = isConfigured(settings, modelKey);

  let statusText: string;
  let statusColor: string;
  const showConfigBtn = !enabled || !configured;
  if (!enabled) {
    statusText = '未启用';
    statusColor = 'text-[#FEBC2E]';
  } else if (!configured) {
    statusText = '未配置';
    statusColor = 'text-[#FEBC2E]';
  } else {
    statusText = '已启用';
    statusColor = 'text-[#28C840]';
  }

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F2F2F7]">
      <span className="text-[10px] font-medium text-[#86868B]">模型:</span>
      <span className="text-[11px] px-2 py-0.5 rounded-md font-medium bg-[#007AFF] text-white">
        {label}
      </span>
      <span className={`text-[10px] font-medium ${statusColor}`}>
        · {statusText}
      </span>
      {showConfigBtn && onNavigate && (
        <button
          onClick={() => onNavigate('ai-config')}
          className="ml-1 text-[10px] px-2 py-0.5 rounded font-medium text-[#007AFF] hover:bg-[#E5E5EA] transition-colors"
        >
          去配置
        </button>
      )}
    </div>
  );
}

/* ──────── 主图生成 Tab ──────── */

const initialInput: ProductInput = {
  image: null,
  imagePreviewUrl: '',
  name: '',
  brand: '',
  category: '',
  attributes: '',
  specifications: '',
  sellingPoints: [],
  originalPrice: null,
  salePrice: null,
};

const GENERATE_MODEL = 'image';

function GenerateSection({
  settings, results, onResultsChange, onSettingsChange, onNavigate,
}: Props) {
  const [input, setInput] = useState<ProductInput>(initialInput);
  const [status, setStatus] = useState<GenerationStatus>('idle');

  const missingFields = { name: input.name.trim().length === 0 };
  const canGenerate = !missingFields.name;
  const configured = isConfigured(settings, GENERATE_MODEL);

  const handleGenerate = useCallback(async () => {
    if (!canGenerate) return;
    setStatus('generating');

    const effectiveInput = {
      ...input,
      salePrice: input.salePrice ?? settings.defaultSalePrice,
      sellingPoints: input.sellingPoints.length > 0 ? input.sellingPoints : settings.defaultSellingPoints,
    };

    await new Promise((r) => setTimeout(r, 1500 + Math.random() * 500));

    try {
      const generated = await generateResults(effectiveInput, settings);
      onResultsChange(generated);
      setStatus('done');
      showToast('生成成功', 'success');
      saveHistoryRecord({
        id: generateHistoryId(),
        taskType: 'generate',
        timestamp: new Date().toISOString(),
        status: 'success',
        productName: effectiveInput.name,
        brand: effectiveInput.brand,
        category: effectiveInput.category,
        attributes: effectiveInput.attributes,
        specifications: effectiveInput.specifications,
        sellingPoints: effectiveInput.sellingPoints,
        originalPrice: effectiveInput.originalPrice,
        salePrice: effectiveInput.salePrice,
        imageFileName: effectiveInput.image?.name,
        results: generated.map(r => ({
          id: r.id,
          title: r.title,
          copy: r.copy,
          sellingPoints: r.sellingPoints,
        })),
      });
    } catch {
      setStatus('error');
      showToast('生成失败', 'error');
      saveHistoryRecord({
        id: generateHistoryId(),
        taskType: 'generate',
        timestamp: new Date().toISOString(),
        status: 'error',
        errorMessage: '生成失败',
        productName: input.name,
      });
    }
  }, [input, canGenerate, settings, results, onResultsChange]);

  const handleToggleFavorite = useCallback((id: string) => {
    onResultsChange(results.map((r) => (r.id === id ? { ...r, isFavorited: !r.isFavorited } : r)));
  }, [results, onResultsChange]);

  const handleDownloadAll = useCallback(() => {
    results.forEach((r) => {
      const link = document.createElement('a');
      link.href = r.mainImageUrl;
      link.download = `主图_${r.title.slice(0, 10)}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
    showToast('全部下载已开始', 'success');
  }, [results]);

  const handleRegenerate = useCallback(() => {
    onResultsChange(results.filter((r) => r.isFavorited));
    setStatus('idle');
  }, [results, onResultsChange]);

  return (
    <div className="flex gap-0 h-full">
      <div className="w-[320px] min-w-[320px] bg-white border-r border-[#E5E5EA] p-4 overflow-y-auto">
        <ModelLockedBar settings={settings} modelKey={GENERATE_MODEL} label="图片生成" onNavigate={onNavigate} />
        <h3 className="text-[12px] font-semibold text-[#1D1D1F] mt-2 mb-3">商品信息</h3>
        <InputPanel
          input={input} onChange={setInput} onGenerate={handleGenerate}
          isGenerating={status === 'generating'} canGenerate={canGenerate} missingFields={missingFields}
        />
      </div>
      <div className="flex-1 p-4 overflow-y-auto bg-[#FBFBFB]">
        <ResultPanel
          status={status} results={results}
          onToggleFavorite={handleToggleFavorite}
          onDownloadAll={handleDownloadAll} onRegenerate={handleRegenerate}
        />
      </div>
    </div>
  );
}

/* ──────── 图片生产 Tab ──────── */

const PRODUCE_MODEL = 'image';

function ProduceSection({ settings, onSettingsChange, onNavigate }: {
  settings: UserSettings;
  onSettingsChange: Props['onSettingsChange'];
  onNavigate?: Props['onNavigate'];
}) {
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState<'idle' | 'generating' | 'done' | 'error'>('idle');
  const [images, setImages] = useState<string[]>([]);

  const modelKey = PRODUCE_MODEL;
  const modelCfg = getModelConfig(settings, modelKey);
  const configured = isConfigured(settings, modelKey);

  const handleGenerate = async () => {
    if (!prompt.trim()) { showToast('请输入图片描述', 'error'); return; }
    if (!configured) { showToast('所选模型未配置', 'error'); return; }
    setStatus('generating');
    try {
      const urls = await generateImage(prompt.trim(), modelCfg.endpoint, modelCfg.apiKey, modelCfg.model, 2);
      setImages(urls);
      setStatus('done');
      showToast('图片生成完成', 'success');
      saveHistoryRecord({
        id: generateHistoryId(),
        taskType: 'produce',
        timestamp: new Date().toISOString(),
        status: 'success',
        prompt: prompt.trim(),
        imageUrls: urls,
      });
    } catch (err) {
      setStatus('error');
      showToast(err instanceof Error ? err.message : '图片生成失败', 'error');
      saveHistoryRecord({
        id: generateHistoryId(),
        taskType: 'produce',
        timestamp: new Date().toISOString(),
        status: 'error',
        errorMessage: err instanceof Error ? err.message : '图片生成失败',
        prompt: prompt.trim(),
      });
    }
  };

  const handleDownload = (url: string, idx: number) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `商品图_${idx + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('已开始下载', 'success');
  };

  return (
    <div className="space-y-4">
      <ModelLockedBar settings={settings} modelKey={PRODUCE_MODEL} label="图片生成" onNavigate={onNavigate} />

      {/* Prompt */}
      <div>
        <label className="block text-[12px] font-semibold text-[#1D1D1F] mb-1.5">图片描述</label>
        <textarea
          value={prompt} onChange={(e) => setPrompt(e.target.value.slice(0, 500))}
          className="mac-input resize-none" rows={3}
          placeholder="描述你想要生成的商品图片，如：一张白色陶瓷咖啡杯，极简风格，白色背景，俯视图，柔和光线"
        />
        <p className="text-[10px] text-[#86868B] mt-1 text-right">{prompt.length}/500</p>
      </div>

      <button onClick={handleGenerate} disabled={!prompt.trim() || status === 'generating'} className="mac-btn w-full h-10 text-[13px] gap-1.5">
        {status === 'generating' ? (
          <><Loader2 size={16} className="animate-spin" />生成中（约 30 秒）...</>
        ) : (
          <><ImageIcon size={16} />生成图片</>
        )}
      </button>


      {/* Results */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {images.map((url, i) => (
            <div key={i} className="mac-card overflow-hidden">
              <img src={url} alt={`生成图 ${i + 1}`} className="w-full aspect-square object-cover" />
              <div className="p-2.5 flex justify-end">
                <button onClick={() => handleDownload(url, i)} className="mac-btn-secondary text-xs px-3 py-1 gap-1">
                  <Download size={12} />下载
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {status === 'error' && (
        <div className="bg-[#FFF0EE] border border-[#FFC7C2] rounded-lg px-3 py-2 text-[11px] text-[#C41E1E]">
          生成失败，请检查 AI 配置是否正确
        </div>
      )}
    </div>
  );
}

/* ──────── 图片描述 Tab ──────── */

const DESCRIBE_MODEL = 'recognition';

function DescribeSection({ settings, onSettingsChange, onNavigate }: {
  settings: UserSettings;
  onSettingsChange: Props['onSettingsChange'];
  onNavigate?: Props['onNavigate'];
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [over, setOver] = useState(false);
  const [status, setStatus] = useState<'idle' | 'describing' | 'done' | 'error'>('idle');
  const [description, setDescription] = useState('');
  const [sellingPoints, setSellingPoints] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const modelKey = DESCRIBE_MODEL;
  const modelCfg = getModelConfig(settings, modelKey);
  const configured = isConfigured(settings, modelKey);

  const validate = (f: File) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) return '仅支持 JPG/PNG/WebP';
    if (f.size > 5 * 1024 * 1024) return '图片不超过 5MB';
    return null;
  };

  const addFile = (f: File) => {
    const err = validate(f);
    if (err) { showToast(err, 'error'); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setStatus('idle');
    setDescription('');
    setSellingPoints([]);
    setKeywords([]);
    setTags([]);
  };

  const handleClear = () => {
    if (preview.startsWith('blob:')) URL.revokeObjectURL(preview);
    setFile(null); setPreview(''); setStatus('idle');
    setDescription(''); setSellingPoints([]); setKeywords([]); setTags([]);
  };

  const handleDescribe = async () => {
    if (!file) { showToast('请先上传图片', 'error'); return; }
    if (!configured) { showToast('所选模型未配置', 'error'); return; }
    setStatus('describing');
    try {
      const result = await generateImageDescription(file, modelCfg.endpoint, modelCfg.apiKey, modelCfg.model);
      setDescription(result.description);
      setSellingPoints(result.sellingPoints);
      setKeywords(result.keywords);
      setTags(result.tags);
      setStatus('done');
      showToast('描述生成完成', 'success');
      saveHistoryRecord({
        id: generateHistoryId(),
        taskType: 'describe',
        timestamp: new Date().toISOString(),
        status: 'success',
        uploadedFileName: file.name,
        uploadedFileSize: file.size,
        description: result.description,
        sellingPoints: result.sellingPoints,
        keywords: result.keywords,
        tags: result.tags,
      });
    } catch (err) {
      setStatus('error');
      showToast(err instanceof Error ? err.message : '生成失败', 'error');
      saveHistoryRecord({
        id: generateHistoryId(),
        taskType: 'describe',
        timestamp: new Date().toISOString(),
        status: 'error',
        errorMessage: err instanceof Error ? err.message : '生成失败',
        uploadedFileName: file?.name,
      });
    }
  };

  const handleCopyAll = async () => {
    const text = [
      '【图片描述】',
      description,
      '',
      '【核心卖点】',
      ...sellingPoints.map((s) => `• ${s}`),
      '',
      '【关键词】',
      keywords.join('、'),
      '',
      '【标签】',
      tags.join('、'),
    ].join('\n');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    showToast('已复制到剪贴板', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <ModelLockedBar settings={settings} modelKey={DESCRIBE_MODEL} label="图像识别" onNavigate={onNavigate} />

      {/* Upload */}
      {!preview ? (
        <div
          onDrop={(e: DragEvent) => { e.preventDefault(); setOver(false); addFile(e.dataTransfer.files[0]); }}
          onDragOver={(e) => { e.preventDefault(); setOver(true); }}
          onDragLeave={() => setOver(false)}
          onClick={() => inputRef.current?.click()}
          className={`h-40 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2.5 cursor-pointer transition-all ${
            over ? 'border-[#007AFF] bg-[#E5F0FF]' : 'border-[#D2D2D7] hover:border-[#A8A8AD] bg-[#FAFAFA]'
          }`}
        >
          <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp"
            onChange={(e) => e.target.files?.[0] && addFile(e.target.files[0])} className="hidden"
          />
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${over ? 'bg-[#007AFF] text-white' : 'bg-[#F2F2F7] text-[#86868B]'}`}>
            <Upload size={18} />
          </div>
          <div className="text-center">
            <p className="text-[13px] font-medium text-[#1D1D1F]">点击或拖拽上传商品图片</p>
            <p className="text-[10px] text-[#86868B] mt-0.5">JPG / PNG / WebP，不超过 5MB</p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-4">
          <div className="relative group shrink-0">
            <img src={preview} alt="" className="w-24 h-24 rounded-xl object-cover border border-[#E5E5EA]" />
            <button onClick={handleClear}
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white border border-[#D2D2D7] text-[#86868B] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            ><X size={11} /></button>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium text-[#1D1D1F] truncate">{file?.name}</p>
            <p className="text-[10px] text-[#86868B] mt-0.5">{file ? `${(file.size / 1024).toFixed(1)} KB` : ''}</p>
            <button onClick={handleDescribe} disabled={status === 'describing'} className="mac-btn text-xs px-4 py-1.5 gap-1.5 mt-2">
              {status === 'describing' ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
              {status === 'describing' ? '生成中...' : '生成描述'}
            </button>
          </div>
        </div>
      )}


      {/* Description result */}
      {description && (
        <div className="space-y-3">
          <div className="bg-[#F2F2F7] rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <ImageIcon size={14} className="text-[#007AFF]" />
              <span className="text-[12px] font-semibold text-[#1D1D1F]">图片描述</span>
            </div>
            <p className="text-[12px] text-[#1D1D1F] leading-relaxed whitespace-pre-wrap">{description}</p>
          </div>
          {sellingPoints.length > 0 && (
            <div className="bg-[#F2F2F7] rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Lightbulb size={14} className="text-[#FF9500]" />
                <span className="text-[12px] font-semibold text-[#1D1D1F]">核心卖点</span>
              </div>
              <ul className="space-y-1">
                {sellingPoints.map((sp, i) => (
                  <li key={i} className="text-[12px] text-[#1D1D1F] flex items-start gap-2">
                    <span className="text-[#007AFF] font-medium shrink-0">{i + 1}.</span>
                    <span>{sp}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {keywords.length > 0 && (
            <div className="bg-[#F2F2F7] rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Tags size={14} className="text-[#34C759]" />
                <span className="text-[12px] font-semibold text-[#1D1D1F]">关键词</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {keywords.map((kw, i) => (
                  <span key={i} className="px-2.5 py-1 bg-white text-[#1D1D1F] text-[11px] font-medium rounded-full border border-[#E5E5EA]">{kw}</span>
                ))}
              </div>
            </div>
          )}
          {tags.length > 0 && (
            <div className="bg-[#F2F2F7] rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Tags size={14} className="text-[#FF9500]" />
                <span className="text-[12px] font-semibold text-[#1D1D1F]">标签</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag, i) => (
                  <span key={i} className="px-2.5 py-1 bg-white text-[#1D1D1F] text-[11px] font-medium rounded-full border border-[#E5E5EA]">{tag}</span>
                ))}
              </div>
            </div>
          )}
          <button onClick={handleCopyAll} className="mac-btn-secondary text-xs px-3 py-1.5 gap-1">
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? '已复制' : '复制全部'}
          </button>
        </div>
      )}

      {status === 'error' && (
        <div className="bg-[#FFF0EE] border border-[#FFC7C2] rounded-lg px-3 py-2 text-[11px] text-[#C41E1E]">
          生成失败，请确认模型支持图片分析
        </div>
      )}
    </div>
  );
}

/* ──────── 主容器 ──────── */

export default function TaskPage({ results, settings, onResultsChange, onSettingsChange, onNavigate }: Props) {
  const [tab, setTab] = useState<TaskTab>('generate');

  return (
    <div className="h-full flex flex-col">
      {/* Tab bar */}
      <div className="flex gap-1 mb-4 shrink-0">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
              tab === t.id
                ? 'bg-[#007AFF] text-white'
                : 'bg-[#F2F2F7] text-[#86868B] hover:bg-[#E5E5EA]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        {tab === 'generate' && (
          <GenerateSection
            settings={settings}
            results={results}
            onResultsChange={onResultsChange}
            onSettingsChange={onSettingsChange}
            onNavigate={onNavigate}
          />
        )}
        {tab === 'produce' && (
          <ProduceSection settings={settings} onSettingsChange={onSettingsChange} onNavigate={onNavigate} />
        )}
        {tab === 'describe' && (
          <DescribeSection settings={settings} onSettingsChange={onSettingsChange} onNavigate={onNavigate} />
        )}
      </div>
    </div>
  );
}
