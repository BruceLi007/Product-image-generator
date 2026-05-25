import { UserSettings } from '../types';

const STORAGE_KEY = 'ecom_tool_settings';

const defaultSettings: UserSettings = {
  defaultSalePrice: 99,
  defaultOriginalPrice: null,
  defaultSellingPoints: ['品质出众', '价格实惠', '好评如潮'],
  preferredStyle: 'random',
  autoDownload: false,
  savePath: '',
  tabModelPrefs: { analyze: 'text', generate: 'text', produce: 'image', describe: 'recognition' },
  textEnabled: true,
  textEndpoint: 'https://api.deepseek.com/chat/completions',
  textApiKey: '',
  textModel: 'deepseek-v4-pro',
  imageEnabled: true,
  imageEndpoint: '',
  imageApiKey: '',
  imageModel: '',
  recognitionEnabled: true,
  recognitionEndpoint: '',
  recognitionApiKey: '',
  recognitionModel: '',
};

export function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {}
  return { ...defaultSettings };
}

export function saveSettings(s: UserSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {}
}
