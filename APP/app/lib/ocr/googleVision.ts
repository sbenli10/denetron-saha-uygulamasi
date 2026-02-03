import { ImageAnnotatorClient } from "@google-cloud/vision";

let client: ImageAnnotatorClient | null = null;

function getClient(): ImageAnnotatorClient {
  if (!client) {
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64) {
      throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_JSON_BASE64");
    }

    const json = Buffer.from(
      process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64,
      "base64"
    ).toString("utf-8");

    client = new ImageAnnotatorClient({
      credentials: JSON.parse(json),
    });
  }

  return client;
}

export async function runOCR(imageBuffer: Buffer): Promise<{
  text: string;
  avgConfidence: number;
  lowConfidenceRatio: number;
  warnings: string[];
}> {
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

  return {
    text,
    avgConfidence,
    lowConfidenceRatio,
    warnings,
  };
}
