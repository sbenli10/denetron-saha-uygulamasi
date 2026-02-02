//APP\app\components\operator\PhotoQualityCheck.tsx
export type QualityResult =
  | { ok: true }
  | { ok: false; reason: string };

export async function analyzeQuality(file: Blob): Promise<QualityResult> {
  let img: ImageBitmap;

  try {
    img = await createImageBitmap(file);
  } catch {
    return { ok: false, reason: "Fotoğraf okunamadı." };
  }

  const canvas = new OffscreenCanvas(img.width, img.height);
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return { ok: false, reason: "Görüntü işlenemedi." };
  }

  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, img.width, img.height).data;

  let brightness = 0;
  for (let i = 0; i < data.length; i += 4) {
    brightness += data[i];
  }
  brightness /= data.length / 4;

  if (brightness < 40) {
    return { ok: false, reason: "Fotoğraf çok karanlık." };
  }

  if (img.width < 400 || img.height < 400) {
    return { ok: false, reason: "Fotoğraf çözünürlüğü çok düşük." };
  }

  return { ok: true };
}
