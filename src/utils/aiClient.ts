interface AIResult {
  title: string;
  copy: string;
  sellingPoints: string[];
}

interface ProductInfo {
  name: string;
  brand: string;
  category: string;
  attributes: string;
  specifications: string;
  salePrice: number;
  originalPrice: number | null;
  sellingPoints: string[];
  style: string;
}

const STYLE_INSTRUCTIONS: Record<string, string> = {
  promotion:
    '文案需体现促销型风格：强调限时优惠、折扣力度、紧迫感，使用"限时抢购"、"仅需"、"错过再等一年"等促销用语。',
  quality:
    '文案需体现品质型风格：强调品质生活、高端体验、精致感，使用"品质之选"、"精致生活"、"匠心"等品质用语。',
  'pain-point':
    '文案需体现痛点型风格：针对用户痛点进行营销，先提问题再给解决方案，使用"告别"、"不再"、"解决"等痛点用语。',
  simple:
    '文案需体现简洁型风格：简洁明了，直击要点，少修饰词，突出价格和核心功能。',
  random: '文案风格：自由发挥，选择最有吸引力的表达方式。',
};

function parseAIResponse(content: string): AIResult[] {
  // Try direct JSON parse
  try {
    const parsed = JSON.parse(content.trim());
    if (parsed.results) return parsed.results;
    if (Array.isArray(parsed)) return parsed;
    return [parsed];
  } catch { /* fall through */ }

  // Try extracting from markdown code block
  const codeMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeMatch) {
    try {
      const parsed = JSON.parse(codeMatch[1].trim());
      if (parsed.results) return parsed.results;
      if (Array.isArray(parsed)) return parsed;
      return [parsed];
    } catch { /* fall through */ }
  }

  throw new Error('无法解析 AI 回复为 JSON 格式，请检查模型是否支持结构化输出');
}

function buildPrompt(product: ProductInfo): { system: string; user: string } {
  const styleInstruction = STYLE_INSTRUCTIONS[product.style] || '';

  const system = `你是一个专业的电商文案撰写专家。根据用户提供的商品信息，生成3组风格统一但各有侧重点的营销文案。

每组文案包括：
1. title: 商品标题（10-20字，吸引眼球）
2. copy: 商品描述（40-80字，突出核心卖点，有感染力）
3. sellingPoints: 卖点列表（2-4个，简洁有力，不需要 emoji 前缀）

${styleInstruction}

必须严格按照 JSON 格式输出，只输出 JSON，不要包含任何其他内容或 markdown 标记：
{"results":[{"title":"...","copy":"...","sellingPoints":["...","..."]}]}`;

  const pointsStr =
    product.sellingPoints.length > 0
      ? product.sellingPoints.map((s) => `- ${s}`).join('\n')
      : '（无特别卖点）';
  const origPriceStr = product.originalPrice
    ? `原价：¥${product.originalPrice}`
    : '原价：无';
  const brandStr = product.brand ? `品牌：${product.brand}` : '';
  const categoryStr = product.category ? `类目：${product.category}` : '';
  const attrStr = product.attributes ? `属性：${product.attributes}` : '';
  const specStr = product.specifications ? `规格：\n${product.specifications}` : '';

  const extra = [brandStr, categoryStr, attrStr].filter(Boolean).join('\n');

  const user = `商品名称：${product.name}
${extra ? `${extra}\n` : ''}${specStr ? `${specStr}\n` : ''}售价：¥${product.salePrice}
${origPriceStr}
卖点：
${pointsStr}`;

  return { system, user };
}

export async function generateCopyWithAI(
  product: ProductInfo,
  endpoint: string,
  apiKey: string,
  model: string
): Promise<AIResult[]> {
  const { system, user } = buildPrompt(product);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      max_tokens: 2000,
      thinking: { type: 'enabled' },
      reasoning_effort: 'high',
      stream: false,
    }),
    signal: AbortSignal.timeout(90000),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => 'Unknown error');
    throw new Error(`API 请求失败 (${response.status}): ${errText.slice(0, 200)}`);
  }

  const data = await response.json();
  const content: string | undefined = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('API 返回为空');

  return parseAIResponse(content);
}

export async function testTextConnection(
  endpoint: string,
  apiKey: string,
  model: string
): Promise<void> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: '回复"连接成功"即可' }],
      max_tokens: 20,
      stream: false,
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => 'Unknown error');
    throw new Error(`HTTP ${response.status}: ${errText.slice(0, 200)}`);
  }
}

export async function testImageConnection(
  endpoint: string,
  apiKey: string,
  model: string
): Promise<void> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      prompt: 'test',
      n: 1,
      size: '1024x1024',
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => 'Unknown error');
    throw new Error(`HTTP ${response.status}: ${errText.slice(0, 200)}`);
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = () => reject(new Error('图片读取失败'));
    reader.readAsDataURL(file);
  });
}

export async function generateImageAnalysis(
  file: File,
  endpoint: string,
  apiKey: string,
  model: string,
): Promise<{ sellingPoints: string[]; keywords: string[] }> {
  const base64 = await fileToBase64(file);
  const mime = file.type;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: '你是一个电商运营专家。请分析这张商品图片，生成以下内容：\n1. 核心卖点：3-5条简短有力的卖点文案（每条10-20字）\n2. 关键词：5-8个商品关键词或标签，用于搜索和分类\n\n必须严格按照 JSON 格式输出，只输出 JSON：\n{"sellingPoints":["卖点1","卖点2","..."],"keywords":["关键词1","关键词2","..."]}',
            },
            { type: 'image_url', image_url: { url: `data:${mime};base64,${base64}` } },
          ],
        },
      ],
      max_tokens: 2000,
      stream: false,
    }),
    signal: AbortSignal.timeout(90000),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => 'Unknown error');
    throw new Error(`AI 分析请求失败 (${response.status}): ${err.slice(0, 200)}`);
  }

  const data = await response.json();
  const content: string | undefined = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('AI 返回为空，请确认模型支持图片分析');

  // Parse JSON from response
  const codeMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  const jsonStr = codeMatch ? codeMatch[1] : content;
  try {
    const parsed = JSON.parse(jsonStr.trim());
    return {
      sellingPoints: parsed.sellingPoints ?? [],
      keywords: parsed.keywords ?? [],
    };
  } catch {
    throw new Error('AI 返回格式无法解析，请确认模型支持 JSON 格式输出');
  }
}

export async function generateImageDescription(
  file: File,
  endpoint: string,
  apiKey: string,
  model: string,
): Promise<{ description: string; tags: string[]; sellingPoints: string[]; keywords: string[] }> {
  const base64 = await fileToBase64(file);
  const mime = file.type;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: '你是一个专业的电商图片分析专家。请分析这张商品图片，生成以下内容：\n1. 图片描述：详细描述图片中的商品，包括商品名称和类型、外观特征（颜色、形状、材质、尺寸等）、场景背景、整体风格\n2. 核心卖点：3-5条简短有力的卖点文案（每条10-20字）\n3. 关键词：5-8个商品关键词或标签，用于搜索和分类\n4. 标签：5-8个相关标签\n\n必须严格按照 JSON 格式输出，只输出 JSON：\n{"description":"详细的商品描述...","sellingPoints":["卖点1","卖点2","..."],"keywords":["关键词1","关键词2","..."],"tags":["标签1","标签2","..."]}',
            },
            { type: 'image_url', image_url: { url: `data:${mime};base64,${base64}` } },
          ],
        },
      ],
      max_tokens: 2000,
      stream: false,
    }),
    signal: AbortSignal.timeout(90000),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => 'Unknown error');
    throw new Error(`AI 请求失败 (${response.status}): ${err.slice(0, 200)}`);
  }

  const data = await response.json();
  const content: string | undefined = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('AI 返回为空，请确认模型支持图片分析');

  const codeMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  const jsonStr = codeMatch ? codeMatch[1] : content;
  try {
    const parsed = JSON.parse(jsonStr.trim());
    return {
      description: parsed.description ?? '',
      sellingPoints: parsed.sellingPoints ?? [],
      keywords: parsed.keywords ?? [],
      tags: parsed.tags ?? [],
    };
  } catch {
    throw new Error('AI 返回格式无法解析，请确认模型支持 JSON 格式输出');
  }
}

export async function generateImage(
  prompt: string,
  endpoint: string,
  apiKey: string,
  model: string,
  n: number = 1,
): Promise<string[]> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, prompt, n, size: '1024x1024' }),
    signal: AbortSignal.timeout(120000),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => 'Unknown error');
    throw new Error(`图片生成失败 (${response.status}): ${err.slice(0, 200)}`);
  }

  const data = await response.json();
  const items = data.data ?? [];
  const urls: string[] = [];
  for (const item of items) {
    if (item.url) urls.push(item.url);
    else if (item.b64_json) urls.push(`data:image/png;base64,${item.b64_json}`);
  }
  if (urls.length === 0) throw new Error('图片生成返回为空');
  return urls;
}

export async function testRecognitionConnection(
  endpoint: string,
  apiKey: string,
  model: string
): Promise<void> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: '回复"连接成功"即可' }],
      max_tokens: 20,
      stream: false,
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => 'Unknown text' );
    throw new Error(`HTTP ${response.status}: ${errText.slice(0, 200)}`);
  }
}
