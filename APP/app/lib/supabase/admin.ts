// APP/lib/supabase/admin.ts
import { createClient } from "@supabase/supabase-js";

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // .env'e ekli olmalı
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false, // server tarafında cookie/localStorage yok
    },
  }
);
