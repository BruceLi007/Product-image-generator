import { useRef, useState, DragEvent } from 'react';
import { Upload, X } from 'lucide-react';

interface Props {
  image: File | null;
  previewUrl: string;
  onImageChange: (file: File | null, url: string) => void;
}

const MAX = 5 * 1024 * 1024;
const TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function ImageUploader({ image, previewUrl, onImageChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const validate = (f: File) => {
    if (!TYPES.includes(f.type)) return '仅支持 JPG/PNG/WebP';
    if (f.size > MAX) return '图片不超过 5MB';
    return null;
  };

  const add = (f: File) => { const e = validate(f); if (e) { alert(e); return; } onImageChange(f, URL.createObjectURL(f)); };

  if (image && previewUrl) {
    return (
      <div className="relative group w-fit">
        <div className="w-[140px] h-[140px] rounded-xl overflow-hidden border border-[#E5E5EA]">
          <img src={previewUrl} alt="" className="w-full h-full object-cover" />
        </div>
        <button onClick={() => { if (previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl); onImageChange(null, ''); }}
          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white border border-[#D2D2D7] text-[#86868B] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <X size={11} />
        </button>
        <p className="text-[10px] mt-1 text-[#86868B] truncate max-w-[140px]">{image.name}</p>
      </div>
    );
  }

  return (
    <div onDrop={(e: DragEvent) => { e.preventDefault(); setOver(false); add(e.dataTransfer.files[0]); }}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
      onClick={() => inputRef.current?.click()}
      className={`w-[140px] h-[140px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
        over ? 'border-[#007AFF] bg-[#E5F0FF]' : 'border-[#D2D2D7] hover:border-[#A8A8AD] bg-white'
      }`}>
      <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp" onChange={(e) => { if (e.target.files?.[0]) add(e.target.files[0]); }} className="hidden" />
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${over ? 'bg-[#007AFF] text-white' : 'bg-[#F2F2F7] text-[#86868B]'}`}>
        <Upload size={16} />
      </div>
      <p className="text-[12px] text-[#1D1D1F]">{over ? '释放以上传' : '上传图片'}</p>
      <p className="text-[10px] text-[#86868B]">JPG / PNG / WebP</p>
    </div>
  );
}
