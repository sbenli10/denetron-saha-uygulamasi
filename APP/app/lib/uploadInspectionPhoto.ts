// APP/lib/uploadInspectionPhoto.ts
import { supabaseBrowser } from "./supabaseBrowser";

export async function uploadInspectionPhoto(
  file: Blob,
  orgId: string,
  operatorId: string
): Promise<string> {
  const supabase = supabaseBrowser();

  const fileExt = "jpg";
  const fileName = `${orgId}/${operatorId}/${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from("inspection-photos")
    .upload(fileName, file, {
      contentType: "image/jpeg",
      upsert: false,
    });

  if (error || !data) {
    throw error ?? new Error("Fotoğraf yüklenemedi.");
  }

  const {
    data: { publicUrl },
  } = supabase.storage
    .from("inspection-photos")
    .getPublicUrl(data.path);

  return publicUrl;
}
