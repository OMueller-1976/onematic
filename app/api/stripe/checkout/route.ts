import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const PLAN_PRICES: Record<string, number> = {
  starter: 3900,
  growth: 9900,
  pro: 19500,
  extra_nutzer: 1000,
};

const PLAN_NAMES: Record<string, string> = {
  starter: "ONEmatic Starter",
  growth: "ONEmatic Growth",
  pro: "ONEmatic Pro",
  extra_nutzer: "ONEmatic Zusätzlicher Nutzer",
};

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "STRIPE_SECRET_KEY nicht konfiguriert" },
      { status: 500 }
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-12-18.acacia" as any });

  const { plan, userId } = await req.json();

  const priceInCents = PLAN_PRICES[plan];
  if (!priceInCents) {
    return NextResponse.json({ error: `Unbekannter Plan: ${plan}` }, { status: 400 });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: priceInCents,
          product_data: {
            name: PLAN_NAMES[plan] ?? plan,
            description: `Monatliche Lizenz — ${PLAN_NAMES[plan] ?? plan}`,
          },
        },
      },
    ],
    metadata: { plan, userId: userId ?? "" },
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/dashboard?payment=success&plan=${plan}&redirect=profil`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/dashboard?payment=cancelled`,
  });

  return NextResponse.json({ url: session.url });
}
