export interface ProductInput {
  image: File | null;
  imagePreviewUrl: string;
  name: string;
  brand: string;
  category: string;
  attributes: string;
  specifications: string;
  sellingPoints: string[];
  originalPrice: number | null;
  salePrice: number | null;
}

export interface GenerationResult {
  id: string;
  mainImageUrl: string;
  title: string;
  copy: string;
  sellingPoints: string[];
  isFavorited: boolean;
}

export type GenerationStatus = 'idle' | 'generating' | 'done' | 'error';

export type PageId = 'home' | 'tasks' | 'templates' | 'history' | 'ai-config' | 'settings';

export interface ConversationRecord {
  id: string;
  taskType: 'generate' | 'produce' | 'describe';
  timestamp: string;
  status: 'success' | 'error';
  errorMessage?: string;

  // Input
  productName?: string;
  brand?: string;
  category?: string;
  attributes?: string;
  specifications?: string;
  sellingPoints?: string[];
  originalPrice?: number | null;
  salePrice?: number | null;
  imageFileName?: string;
  prompt?: string;
  uploadedFileName?: string;
  uploadedFileSize?: number;

  // Output
  results?: {
    id: string;
    title: string;
    copy: string;
    sellingPoints: string[];
    mainImageUrl?: string;
  }[];
  imageUrls?: string[];
  description?: string;
  keywords?: string[];
  tags?: string[];
}

export interface UserSettings {
  defaultSalePrice: number;
  defaultOriginalPrice: number | null;
  defaultSellingPoints: string[];
  preferredStyle: string;
  autoDownload: boolean;
  savePath: string;

  // Per-tab model selection: which preset to use ('text' | 'image' | 'recognition')
  tabModelPrefs: {
    analyze: string;
    generate: string;
    produce: string;
    describe: string;
  };

  // AI Model Configurations
  textEnabled: boolean;
  textEndpoint: string;
  textApiKey: string;
  textModel: string;
  imageEnabled: boolean;
  imageEndpoint: string;
  imageApiKey: string;
  imageModel: string;
  recognitionEnabled: boolean;
  recognitionEndpoint: string;
  recognitionApiKey: string;
  recognitionModel: string;
}
