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

export async function runOCR(imageBuffer: Buffer) {
  const visionClient = getClient();
  const [res] = await visionClient.textDetection(imageBuffer);
  return res.fullTextAnnotation?.text ?? "";
}
