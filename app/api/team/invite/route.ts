import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { error: "Server-Konfiguration fehlt (SUPABASE_SERVICE_ROLE_KEY nicht gesetzt)" },
      { status: 500 }
    );
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { email, role, orgUserId } = await req.json();

  if (!email || !orgUserId) {
    return NextResponse.json({ error: "email und orgUserId sind Pflichtfelder" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${supabaseUrl.replace("supabase.co", "").replace(/\/$/, "")}/dashboard?invite=accepted`,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, user: data?.user });
}
