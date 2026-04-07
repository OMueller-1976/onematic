import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  const { name, email, firma, thema, nachricht } = await req.json();

  if (!name?.trim() || !email?.trim() || !nachricht?.trim()) {
    return NextResponse.json({ error: "Pflichtfelder fehlen" }, { status: 400 });
  }

  const { error } = await supabase.from("contact_requests").insert({
    name: name.trim(),
    email: email.trim(),
    firma: firma?.trim() || null,
    thema: thema || "Sonstiges",
    nachricht: nachricht.trim(),
  });

  if (error) {
    console.error("[contact] supabase error:", error.message);
    return NextResponse.json({ error: "Speichern fehlgeschlagen" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
