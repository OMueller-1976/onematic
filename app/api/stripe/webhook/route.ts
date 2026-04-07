import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// Supabase Admin-Client (Service Role) — umgeht RLS für serverseitige Updates
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeKey) {
    return NextResponse.json({ error: "STRIPE_SECRET_KEY nicht konfiguriert" }, { status: 500 });
  }

  const stripe = new Stripe(stripeKey);
  const body = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;

  if (webhookSecret && sig) {
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Webhook-Signatur ungültig";
      console.error("[stripe/webhook] Signatur-Fehler:", msg);
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  } else {
    // Lokal ohne Signatur (nur für Entwicklung)
    try {
      event = JSON.parse(body) as Stripe.Event;
    } catch {
      return NextResponse.json({ error: "Ungültiger Request Body" }, { status: 400 });
    }
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const plan = session.metadata?.plan;
    const userId = session.metadata?.userId;

    if (plan && userId) {
      const supabase = getSupabaseAdmin();

      // profiles.plan updaten
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ plan })
        .eq("user_id", userId);

      if (profileError) {
        console.error("[stripe/webhook] profiles update Fehler:", profileError.message);
      }

      // billing.plan + grundgebuehr updaten
      const grundgebuehr = plan === "starter" ? 39 : plan === "growth" ? 99 : 195;

      const { error: billingError } = await supabase
        .from("billing")
        .update({ plan, grundgebuehr })
        .eq("user_id", userId);

      if (billingError) {
        console.error("[stripe/webhook] billing update Fehler:", billingError.message);
        // Fallback: upsert falls noch kein billing-Eintrag existiert
        const { error: upsertError } = await supabase
          .from("billing")
          .upsert({ user_id: userId, plan, grundgebuehr, status: "active", gesamt_monatlich: grundgebuehr }, { onConflict: "user_id" });
        if (upsertError) {
          console.error("[stripe/webhook] billing upsert Fehler:", upsertError.message);
        }
      }

    }
  }

  return NextResponse.json({ received: true });
}
