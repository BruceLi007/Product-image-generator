interface CopyTemplate {
  id: string;
  style: string;
  generateTitle: (name: string, salePrice: number) => string;
  generateCopy: (name: string, salePrice: number, originalPrice: number | null, sellingPoints: string[]) => string;
  generateSellingPoints: (sellingPoints: string[]) => string[];
}

const SAMPLE_PAIN_POINTS = [
  '闷热出汗睡不安稳',
  '空调房干燥不舒服',
  '床单总是跑来跑去',
  '夏天睡觉满身大汗',
  '皮肤敏感容易过敏',
];

const SAMPLE_SELLING_TITLES = [
  '限时特惠',
  '品质之选',
  '爆款推荐',
  '夏季必备',
  '人手一件',
];

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export const COPY_TEMPLATES: CopyTemplate[] = [
  {
    id: 'promotion',
    style: 'promotion',
    generateTitle: (name, salePrice) => {
      const prefix = randomPick(SAMPLE_SELLING_TITLES);
      return `${prefix} | ${name.slice(0, 8)}仅¥${salePrice}`;
    },
    generateCopy: (name, salePrice, _originalPrice, sellingPoints) => {
      const sp1 = sellingPoints[0] || '品质出众';
      const sp2 = sellingPoints[1] || '价格实惠';
      return `【限时抢购】${name}，仅需¥${salePrice}！${sp1}，${sp2}，错过再等一年！`;
    },
    generateSellingPoints: (sellingPoints) => {
      return sellingPoints.slice(0, 3);
    },
  },
  {
    id: 'quality',
    style: 'quality',
    generateTitle: (name, salePrice) => {
      return `${name.slice(0, 6)} | 品质生活 ¥${salePrice}`;
    },
    generateCopy: (name, salePrice, _originalPrice, sellingPoints) => {
      const points = sellingPoints.slice(0, 3).map((s, i) => `✨ ${s}`).join(' · ');
      return `${name} | ${points}，品质之选，¥${salePrice} 带回家`;
    },
    generateSellingPoints: (sellingPoints) => {
      return sellingPoints.slice(0, 3).map(s => `✨ ${s}`);
    },
  },
  {
    id: 'pain-point',
    style: 'pain-point',
    generateTitle: (name, salePrice) => {
      return `告别${randomPick(SAMPLE_PAIN_POINTS).slice(0, 6)}`;
    },
    generateCopy: (name, salePrice, _originalPrice, sellingPoints) => {
      const pain = randomPick(SAMPLE_PAIN_POINTS);
      const sp1 = sellingPoints[0] || '舒适体验';
      return `还在为${pain}烦恼？试试${name}，${sp1}，今日只要¥${salePrice}`;
    },
    generateSellingPoints: (sellingPoints) => {
      return sellingPoints.slice(0, 2);
    },
  },
  {
    id: 'simple',
    style: 'simple',
    generateTitle: (name, salePrice) => {
      return `¥${salePrice} 抢${name.slice(0, 8)}`;
    },
    generateCopy: (name, salePrice, _originalPrice, sellingPoints) => {
      const spList = sellingPoints.slice(0, 4).map(s => `✅ ${s}`).join('\n');
      return `${name}\n${spList}\n🔥 限时特价 ¥${salePrice}`;
    },
    generateSellingPoints: (sellingPoints) => {
      return sellingPoints.slice(0, 4).map(s => `✅ ${s}`);
    },
  },
  {
    id: 'elegant',
    style: 'elegant',
    generateTitle: (name, salePrice) => {
      return `${name.slice(0, 6)} · 精致生活`;
    },
    generateCopy: (name, salePrice, _originalPrice, sellingPoints) => {
      const sp1 = sellingPoints[0] || '精选好物';
      const sp2 = sellingPoints[1] || '优质生活';
      return `▎${name}\n\n${sp1}，${sp2}\n\n让每一天都过得更有品质\n\n仅 ¥${salePrice}`;
    },
    generateSellingPoints: (sellingPoints) => {
      return sellingPoints.slice(0, 2);
    },
  },
];
