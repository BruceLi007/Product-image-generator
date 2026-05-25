import { ProductInput, GenerationResult, UserSettings } from '../types';
import { COPY_TEMPLATES } from './templates';
import { renderMainImage } from './canvasRenderer';
import { generateCopyWithAI } from './aiClient';
import { showToast } from '../components/Toast';

function generateId(): string {
  return `result_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function generateResults(input: ProductInput, settings?: UserSettings): Promise<GenerationResult[]> {
  if (!input.image || !input.name) {
    throw new Error('Missing required product information');
  }

  const salePrice = input.salePrice ?? settings?.defaultSalePrice ?? 99;
  const originalPrice = input.originalPrice ?? (salePrice + Math.floor(Math.random() * 100) + 50);
  const sellingPoints = input.sellingPoints.length > 0
    ? input.sellingPoints
    : (settings?.defaultSellingPoints ?? ['品质出众', '价格实惠', '好评如潮']);

  // Use AI generation when configured
  if (settings?.textApiKey && settings?.textEndpoint) {
    try {
      const aiResults = await generateCopyWithAI(
        {
          name: input.name,
          brand: input.brand,
          category: input.category,
          attributes: input.attributes,
          specifications: input.specifications,
          salePrice,
          originalPrice,
          sellingPoints,
          style: settings.preferredStyle || 'random',
        },
        settings.textEndpoint,
        settings.textApiKey,
        settings.textModel,
      );

      const results: GenerationResult[] = [];
      for (const r of aiResults) {
        const mainImageUrl = await renderMainImage(input.image, input.name, salePrice, originalPrice);
        results.push({
          id: generateId(),
          mainImageUrl,
          title: r.title,
          copy: r.copy,
          sellingPoints: r.sellingPoints,
          isFavorited: false,
        });
      }
      return results;
    } catch (err) {
      showToast('AI 生成失败，已切换为本地模板', 'error');
    }
  }

  const shuffled = [...COPY_TEMPLATES].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, 3);

  const results: GenerationResult[] = [];

  for (const template of selected) {
    const title = template.generateTitle(input.name, salePrice);
    const copy = template.generateCopy(input.name, salePrice, originalPrice, sellingPoints);
    const points = template.generateSellingPoints(sellingPoints);

    const mainImageUrl = await renderMainImage(input.image, input.name, salePrice, originalPrice);

    results.push({
      id: generateId(),
      mainImageUrl,
      title,
      copy,
      sellingPoints: points,
      isFavorited: false,
    });
  }

  return results;
}
