const CANVAS_SIZE = 800;

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export async function renderMainImage(
  imageFile: File,
  name: string,
  salePrice: number,
  originalPrice: number | null
): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  // Load image
  const img = await loadImage(imageFile);

  // Draw background image - cover fill
  const imgRatio = img.width / img.height;
  let drawW: number, drawH: number, drawX: number, drawY: number;
  if (imgRatio > 1) {
    drawW = CANVAS_SIZE;
    drawH = CANVAS_SIZE / imgRatio;
    drawX = 0;
    drawY = (CANVAS_SIZE - drawH) / 2;
  } else {
    drawH = CANVAS_SIZE;
    drawW = CANVAS_SIZE * imgRatio;
    drawX = (CANVAS_SIZE - drawW) / 2;
    drawY = 0;
  }
  ctx.drawImage(img, drawX, drawY, drawW, drawH);

  // Semi-transparent gradient overlay at bottom
  const gradient = ctx.createLinearGradient(0, CANVAS_SIZE - 200, 0, CANVAS_SIZE);
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(1, 'rgba(0,0,0,0.7)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, CANVAS_SIZE - 200, CANVAS_SIZE, 200);

  // Product name (bottom left, above price)
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 30px "PingFang SC", "Microsoft YaHei", sans-serif';
  const maxTextWidth = CANVAS_SIZE - 60;
  let displayName = name;
  if (ctx.measureText(displayName).width > maxTextWidth) {
    while (ctx.measureText(displayName + '…').width > maxTextWidth && displayName.length > 0) {
      displayName = displayName.slice(0, -1);
    }
    displayName += '…';
  }
  ctx.fillText(displayName, 30, CANVAS_SIZE - 130);

  // Sale price (yellow, large)
  ctx.textBaseline = 'bottom';
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 48px "PingFang SC", "Microsoft YaHei", sans-serif';
  const priceText = `¥${salePrice}`;
  ctx.fillText(priceText, 30, CANVAS_SIZE - 60);

  // Original price (white, strikethrough, right of sale price)
  if (originalPrice && originalPrice > salePrice) {
    const origText = `¥${originalPrice}`;
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px "PingFang SC", "Microsoft YaHei", sans-serif';
    const origX = 30 + ctx.measureText(priceText).width + 20;
    ctx.fillText(origText, origX, CANVAS_SIZE - 70);

    // Strikethrough line
    const origWidth = ctx.measureText(origText).width;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(origX, CANVAS_SIZE - 78);
    ctx.lineTo(origX + origWidth, CANVAS_SIZE - 78);
    ctx.stroke();
  }

  // "限时优惠" badge (top right)
  const badgeText = '限时优惠';
  ctx.font = 'bold 22px "PingFang SC", "Microsoft YaHei", sans-serif';
  const badgePadding = 14;
  const badgeHeight = 44;
  const badgeWidth = ctx.measureText(badgeText).width + badgePadding * 2;
  const badgeX = CANVAS_SIZE - badgeWidth - 20;
  const badgeY = 20;

  ctx.fillStyle = '#E53935';
  drawRoundedRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 8);
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(badgeText, badgeX + badgeWidth / 2, badgeY + badgeHeight / 2);

  return canvas.toDataURL('image/png');
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}
