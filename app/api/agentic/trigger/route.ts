import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function makeSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  const { user_id } = await req.json().catch(() => ({}));

  const db = makeSupabase();

  // Load all agentic-enabled campaigns for this user
  let query = db
    .from("campaigns")
    .select("id, name, dsp, primary_kpi, objective")
    .eq("agentic_enabled", true);

  if (user_id) query = query.eq("user_id", user_id);

  const { data: campaigns, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!campaigns || campaigns.length === 0) {
    return NextResponse.json({
      message: "Keine agentic-aktivierten Kampagnen gefunden.",
      results: [],
    });
  }

  const base =
    process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  // Run analysis for each campaign sequentially
  const results: Record<string, unknown>[] = [];
  for (const campaign of campaigns) {
    try {
      const res = await fetch(`${base}/api/agentic`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaign_id: campaign.id, user_id }),
      });
      const data = await res.json();
      results.push({ campaign_id: campaign.id, campaign_name: campaign.name, ...data });
    } catch (err) {
      results.push({
        campaign_id: campaign.id,
        campaign_name: campaign.name,
        error: err instanceof Error ? err.message : "Analyse fehlgeschlagen",
      });
    }
  }

  const totalDecisions = results.reduce(
    (sum, r) => sum + (Array.isArray((r as any).entscheidungen) ? (r as any).entscheidungen.length : 0),
    0
  );

  return NextResponse.json({
    analysiert: results.length,
    entscheidungen_gesamt: totalDecisions,
    results,
  });
}
