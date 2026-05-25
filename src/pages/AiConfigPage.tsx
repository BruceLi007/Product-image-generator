import { useState } from 'react';
import { UserSettings } from '../types';
import { MessageSquareText, Image, ScanSearch, Loader2 } from 'lucide-react';
import { showToast } from '../components/Toast';
import { testTextConnection, testImageConnection, testRecognitionConnection } from '../utils/aiClient';

type ModelType = 'text' | 'image' | 'recognition';

interface Props {
  settings: UserSettings;
  onSave: (s: UserSettings) => void;
}

const MODEL_INFO: Record<ModelType, {
  key: ModelType;
  label: string;
  desc: string;
  icon: React.ReactNode;
  enabledKey: keyof UserSettings;
  endpointKey: keyof UserSettings;
  apiKeyKey: keyof UserSettings;
  modelKey: keyof UserSettings;
  placeholderEndpoint: string;
  placeholderModel: string;
}> = {
  text: {
    key: 'text',
    label: '文字大模型',
    desc: '用于自动生成营销文案、标题和卖点',
    icon: <MessageSquareText size={20} />,
    enabledKey: 'textEnabled',
    endpointKey: 'textEndpoint',
    apiKeyKey: 'textApiKey',
    modelKey: 'textModel',
    placeholderEndpoint: 'https://api.deepseek.com/chat/completions',
    placeholderModel: 'deepseek-v4-pro',
  },
  image: {
    key: 'image',
    label: '图片生成大模型',
    desc: '用于自动生成商品主图和素材图',
    icon: <Image size={20} />,
    enabledKey: 'imageEnabled',
    endpointKey: 'imageEndpoint',
    apiKeyKey: 'imageApiKey',
    modelKey: 'imageModel',
    placeholderEndpoint: 'https://api.openai.com/v1/images/generations',
    placeholderModel: 'dall-e-3',
  },
  recognition: {
    key: 'recognition',
    label: '图像识别大模型',
    desc: '用于识别分析图片内容、生成描述和标签',
    icon: <ScanSearch size={20} />,
    enabledKey: 'recognitionEnabled',
    endpointKey: 'recognitionEndpoint',
    apiKeyKey: 'recognitionApiKey',
    modelKey: 'recognitionModel',
    placeholderEndpoint: 'https://api.deepseek.com/chat/completions',
    placeholderModel: 'deepseek-v4-pro',
  },
};

function ModelSection({
  info,
  values,
  enabled,
  testing,
  onFieldChange,
  onTest,
}: {
  info: (typeof MODEL_INFO)[ModelType];
  values: { endpoint: string; apiKey: string; model: string };
  enabled: boolean;
  testing: boolean;
  onFieldChange: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
  onTest: () => void;
}) {
  const configured = !!(values.endpoint && values.apiKey);

  return (
    <div className={`mac-card p-4 transition-opacity ${!enabled ? 'opacity-60' : ''} ${configured ? '' : 'border-[#E5E5EA]'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${configured ? 'bg-[#E8F8ED] text-[#28C840]' : 'bg-[#F2F2F7] text-[#86868B]'}`}>
            {info.icon}
          </div>
          <div>
            <h3 className="text-[13px] font-semibold text-[#1D1D1F]">{info.label}</h3>
            <p className="text-[10px] text-[#86868B]">{info.desc}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {configured && (
            <span className="text-[10px] font-medium text-[#28C840] bg-[#E8F8ED] px-2 py-0.5 rounded-full">
              已配置
            </span>
          )}
          {/* Toggle switch */}
          <button
            onClick={() => onFieldChange(info.enabledKey, !enabled as UserSettings[typeof info.enabledKey])}
            className={`relative w-9 h-[22px] rounded-full transition-all duration-200 ${
              enabled ? 'bg-[#28C840]' : 'bg-[#C7C7CC]'
            }`}
          >
            <span className={`absolute top-0.5 left-0.5 w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-transform duration-200 ${
              enabled ? 'translate-x-4' : 'translate-x-0'
            }`} />
          </button>
        </div>
      </div>

      {/* Fields */}
      <div className="space-y-3">
        <div>
          <label className="block text-[10px] font-medium text-[#86868B] mb-1">API 地址</label>
          <input
            type="text"
            value={values.endpoint}
            onChange={(e) => onFieldChange(info.endpointKey, e.target.value as UserSettings[typeof info.endpointKey])}
            className="mac-input"
            placeholder={info.placeholderEndpoint}
          />
        </div>
        <div>
          <label className="block text-[10px] font-medium text-[#86868B] mb-1">API Key</label>
          <input
            type="text"
            value={values.apiKey}
            onChange={(e) => onFieldChange(info.apiKeyKey, e.target.value as UserSettings[typeof info.apiKeyKey])}
            className="mac-input"
            placeholder="sk-xxxxxxxxxxxxxxxx"
          />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-[10px] font-medium text-[#86868B] mb-1">模型名称</label>
            <input
              type="text"
              value={values.model}
              onChange={(e) => onFieldChange(info.modelKey, e.target.value as UserSettings[typeof info.modelKey])}
              className="mac-input"
              placeholder={info.placeholderModel}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={onTest}
              disabled={!enabled || testing}
              className="mac-btn-secondary text-xs px-3 py-[9px] gap-1.5 whitespace-nowrap"
            >
              {testing ? <Loader2 size={14} className="animate-spin" /> : null}
              {testing ? '测试中...' : '测试连接'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AiConfigPage({ settings, onSave }: Props) {
  const [testing, setTesting] = useState<ModelType | null>(null);

  const handleChange = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    onSave({ ...settings, [key]: value });
  };

  const handleTest = async (type: ModelType) => {
    const cfg = MODEL_INFO[type];
    const endpoint = settings[cfg.endpointKey] as string;
    const apiKey = settings[cfg.apiKeyKey] as string;
    const model = settings[cfg.modelKey] as string;

    if (!endpoint.trim()) {
      showToast(`请先填写 ${cfg.label} 的 API 地址`, 'error');
      return;
    }
    if (!apiKey.trim()) {
      showToast(`请先填写 ${cfg.label} 的 API Key`, 'error');
      return;
    }

    setTesting(type);
    try {
      if (type === 'text') {
        await testTextConnection(endpoint, apiKey, model);
      } else if (type === 'image') {
        await testImageConnection(endpoint, apiKey, model);
      } else {
        await testRecognitionConnection(endpoint, apiKey, model);
      }
      showToast(`${cfg.label} 连接成功 ✓`, 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '未知错误';
      showToast(`连接失败: ${msg.slice(0, 100)}`, 'error');
    } finally {
      setTesting(null);
    }
  };

  const anyConfigured = !!(settings.textEndpoint && settings.textApiKey);

  return (
    <div className="max-w-2xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1D1D1F]">AI 大模型配置</h1>
          <p className="text-[13px] text-[#86868B] mt-0.5">配置各类 AI 模型来自动生成电商内容</p>
        </div>
        {anyConfigured && (
          <span className="text-[11px] text-[#86868B] bg-[#F2F2F7] px-3 py-1 rounded-full">
            文字模型已配置
          </span>
        )}
      </div>

      {/* Text Model */}
      <ModelSection
        info={MODEL_INFO.text}
        values={{
          endpoint: settings.textEndpoint,
          apiKey: settings.textApiKey,
          model: settings.textModel,
        }}
        enabled={settings.textEnabled}
        testing={testing === 'text'}
        onFieldChange={handleChange}
        onTest={() => handleTest('text')}
      />

      {/* Image Model */}
      <ModelSection
        info={MODEL_INFO.image}
        values={{
          endpoint: settings.imageEndpoint,
          apiKey: settings.imageApiKey,
          model: settings.imageModel,
        }}
        enabled={settings.imageEnabled}
        testing={testing === 'image'}
        onFieldChange={handleChange}
        onTest={() => handleTest('image')}
      />

      {/* Recognition Model */}
      <ModelSection
        info={MODEL_INFO.recognition}
        values={{
          endpoint: settings.recognitionEndpoint,
          apiKey: settings.recognitionApiKey,
          model: settings.recognitionModel,
        }}
        enabled={settings.recognitionEnabled}
        testing={testing === 'recognition'}
        onFieldChange={handleChange}
        onTest={() => handleTest('recognition')}
      />

      <p className="text-[11px] text-[#86868B] text-center">配置信息自动保存，仅存储在本地</p>
    </div>
  );
}
