import { supabase } from "./supabase";

export async function handlePlatformStart(e: React.MouseEvent) {
  e.preventDefault();
  const { data: { session } } = await supabase.auth.getSession();
  window.location.href = session ? "/dashboard" : "/login";
}
