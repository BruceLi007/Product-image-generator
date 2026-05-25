import { Image, Type, Tag, LayoutGrid, List, Sliders, Wand2, Loader2 } from 'lucide-react';
import { ProductInput } from '../types';
import ImageUploader from './ImageUploader';

interface InputPanelProps {
  input: ProductInput;
  onChange: (input: ProductInput) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  canGenerate: boolean;
  missingFields: { name: boolean };
}

function Label({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 mb-1.5">
      <span className="text-[#86868B]">{icon}</span>
      <span className="text-[12px] font-semibold text-[#1D1D1F]">{label}</span>
    </div>
  );
}

export default function InputPanel({
  input, onChange, onGenerate, isGenerating, canGenerate, missingFields,
}: InputPanelProps) {
  const update = <K extends keyof ProductInput>(key: K, val: ProductInput[K]) => onChange({ ...input, [key]: val });

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-5">
        {/* 商品图片 */}
        <div>
          <Label icon={<Image size={14} />} label="商品图片" />
          <ImageUploader
            image={input.image} previewUrl={input.imagePreviewUrl}
            onImageChange={(f, u) => { onChange({ ...input, image: f, imagePreviewUrl: u }); }}
          />
        </div>

        {/* 商品名称 */}
        <div>
          <Label icon={<Type size={14} />} label="商品名称" />
          <div className="relative">
            <input
              type="text" value={input.name}
              onChange={(e) => update('name', e.target.value.slice(0, 60))}
              placeholder="如：夏季冰丝凉席三件套"
              className={`mac-input pr-12 ${missingFields.name ? 'mac-input-error' : ''}`}
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#C7C7CC] font-medium">
              {input.name.length}/60
            </span>
          </div>
          {missingFields.name && <p className="text-[11px] mt-1 text-[#FF5F57]">请输入商品名称</p>}
        </div>

        {/* 品牌 */}
        <div>
          <Label icon={<Tag size={14} />} label="品牌" />
          <input
            type="text" value={input.brand}
            onChange={(e) => update('brand', e.target.value.slice(0, 30))}
            placeholder="如：网易严选"
            className="mac-input"
          />
        </div>

        {/* 类目 */}
        <div>
          <Label icon={<LayoutGrid size={14} />} label="类目" />
          <input
            type="text" value={input.category}
            onChange={(e) => update('category', e.target.value.slice(0, 20))}
            placeholder="如：家居生活 > 床上用品"
            className="mac-input"
          />
        </div>

        {/* 属性 */}
        <div>
          <Label icon={<List size={14} />} label="属性" />
          <input
            type="text" value={input.attributes}
            onChange={(e) => update('attributes', e.target.value.slice(0, 100))}
            placeholder="材质:棉, 风格:简约, 颜色:白色"
            className="mac-input"
          />
        </div>

        {/* 规格 */}
        <div>
          <Label icon={<Sliders size={14} />} label="规格" />
          <textarea
            value={input.specifications}
            onChange={(e) => update('specifications', e.target.value.slice(0, 200))}
            placeholder={'尺寸:180x200cm\n重量:2.5kg\n颜色:冰丝蓝'}
            className="mac-input resize-none" rows={2}
          />
        </div>
      </div>

      <button onClick={onGenerate} disabled={!canGenerate || isGenerating} className="mac-btn w-full h-10 text-[13px]">
        {isGenerating ? (
          <><Loader2 size={16} className="animate-spin" />生成中...</>
        ) : (
          <><Wand2 size={16} />生成主图与文案</>
        )}
      </button>
    </div>
  );
}
