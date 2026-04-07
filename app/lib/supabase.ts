// ============================================================
// app/lib/supabase.ts
// Supabase-Client — cookie-basiert via @supabase/ssr
// damit server-seitige Session-Prüfung (proxy.ts) funktioniert
// ============================================================

import { createBrowserClient } from "@supabase/ssr";

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
