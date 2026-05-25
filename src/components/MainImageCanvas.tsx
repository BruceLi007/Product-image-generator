import { useRef, useEffect } from 'react';

interface MainImageCanvasProps {
  imageUrl: string;
  alt?: string;
}

export default function MainImageCanvas({ imageUrl, alt }: MainImageCanvasProps) {
  const imgRef = useRef<HTMLImageElement>(null);

  // Clean up blob URLs if any
  useEffect(() => {
    return () => {
      if (imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  return (
    <div className="w-full bg-gray-100 rounded-lg overflow-hidden">
      <img
        ref={imgRef}
        src={imageUrl}
        alt={alt || '合成主图'}
        className="w-full h-auto"
        loading="lazy"
      />
    </div>
  );
}
