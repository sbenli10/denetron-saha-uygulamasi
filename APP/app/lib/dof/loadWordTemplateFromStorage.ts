import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase Storage'dan Word template indirir
 * ve Buffer olarak döner.
 *
 * ❗ fs.readFileSync KULLANILMAZ
 */
export async function loadWordTemplateFromStorage(
  supabase: SupabaseClient,
  bucket: string,
  filePath: string
): Promise<Buffer> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .download(filePath);

  if (error || !data) {
    throw new Error(
      `Word template indirilemedi: ${filePath}`
    );
  }

  return Buffer.from(await data.arrayBuffer());
}
