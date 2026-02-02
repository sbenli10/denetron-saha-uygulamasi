"use server";

import { supabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createTemplateAction(fd: FormData) {
  const name = fd.get("name") as string;
  const is_active = fd.get("is_active") ? true : false;
  const tags = (fd.get("tags") as string)?.split(",").filter(Boolean) || [];
  const fields = JSON.parse(fd.get("fields") as string);

  const supabase = supabaseServerClient();
  const { error } = await supabase
    .from("templates")
    .insert({
      name,
      is_active,
      tags,
      fields,
    });

  if (error) throw new Error("template create: " + error.message);

  revalidatePath("/admin/templates");
}
