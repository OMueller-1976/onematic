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
  const { aktion, campaign_id, log_id } = await req.json();

  if (!aktion || !campaign_id) {
    return NextResponse.json({ error: "aktion und campaign_id erforderlich" }, { status: 400 });
  }

  const db = makeSupabase();
  const targetId: string = aktion.campaign_id ?? campaign_id;

  // Execute the action
  switch (aktion.typ) {
    case "update_campaign":
    case "shift_budget": {
      if (aktion.feld && aktion.wert !== undefined) {
        const { error } = await db
          .from("campaigns")
          .update({ [String(aktion.feld)]: aktion.wert })
          .eq("id", targetId);
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
      }
      break;
    }
    case "pause_creative": {
      const creativeId = aktion.creative_id ?? aktion.wert;
      if (creativeId) {
        await db
          .from("creatives")
          .update({ status: "Pausiert" })
          .eq("id", creativeId);
      }
      break;
    }
    case "pause_campaign": {
      await db
        .from("campaigns")
        .update({ status: "Pausiert" })
        .eq("id", targetId);
      break;
    }
  }

  // Mark log as applied
  if (log_id) {
    await db
      .from("agentic_logs")
      .update({ status: "angewendet" })
      .eq("id", log_id);
  }

  // Return updated campaign
  const { data: updatedCampaign } = await db
    .from("campaigns")
    .select("*")
    .eq("id", campaign_id)
    .single();

  return NextResponse.json({ success: true, campaign: updatedCampaign ?? null });
}
