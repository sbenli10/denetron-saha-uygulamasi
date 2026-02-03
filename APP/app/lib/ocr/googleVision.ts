// APP/app/lib/ocr/googleVision.ts
import { ImageAnnotatorClient } from "@google-cloud/vision";

/**
 * Side-effect free, build-safe OCR helper
 */

let client: ImageAnnotatorClient | null = null;

/**
 * Lazy init – sadece ilk OCR çağrısında client oluşturulur
 */
function getClient(): ImageAnnotatorClient {
  if (client) return client;

  console.log("[OCR][INIT] googleVision client initialized");

  const base64 = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64;

  if (!base64) {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 env variable is missing"
    );
  }

  let credentials: any;

  try {
    const json = Buffer.from(base64, "base64").toString("utf-8");
    credentials = JSON.parse(json);
  } catch (err) {
    console.error("[OCR][INIT] Failed to decode service account JSON", err);
    throw new Error("Invalid GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 value");
  }

  client = new ImageAnnotatorClient({
    credentials,
  });

  return client;
}

export async function runOCR(
  imageBuffer: Buffer
): Promise<{
  text: string;
  avgConfidence: number;
  lowConfidenceRatio: number;
  warnings: string[];
}> {
  console.log("[OCR][RUN] runOCR çağrıldı");
  console.log("[OCR][RUN] buffer size:", imageBuffer.length);

  const start = Date.now();
  const visionClient = getClient();

  const [res] = await visionClient.textDetection(imageBuffer);
  const annotation = res.fullTextAnnotation;

  const text = annotation?.text ?? "";
  const confidences: number[] = [];

  for (const page of annotation?.pages ?? []) {
    for (const block of page.blocks ?? []) {
      for (const paragraph of block.paragraphs ?? []) {
        for (const word of paragraph.words ?? []) {
          for (const symbol of word.symbols ?? []) {
            if (typeof symbol.confidence === "number") {
              confidences.push(symbol.confidence);
            }
          }
        }
      }
    }
  }

  const avgConfidence =
    confidences.length > 0
      ? confidences.reduce((a, b) => a + b, 0) / confidences.length
      : 0;

  const lowConfidenceRatio =
    confidences.length > 0
      ? confidences.filter((c) => c < 0.75).length / confidences.length
      : 1;

  const warnings: string[] = [];
  if (avgConfidence < 0.75) warnings.push("Belge düşük okunabilirlikte");
  if (lowConfidenceRatio > 0.4) {
    warnings.push("Belgede çok sayıda düşük güvenilir OCR alanı var");
  }

  console.log("[OCR][DONE]", {
    durationMs: Date.now() - start,
    chars: text.length,
    avgConfidence: Number(avgConfidence.toFixed(3)),
    lowConfidenceRatio: Number(lowConfidenceRatio.toFixed(3)),
    warnings,
  });

  return {
    text,
    avgConfidence,
    lowConfidenceRatio,
    warnings,
  };
}
