import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY nicht konfiguriert" },
      { status: 500 }
    );
  }

  const campaign = await req.json();

  const systemPrompt = `Du bist ein Programmatic Advertising Experte.
Analysiere diese Kampagne und gib GENAU 2 konkrete, umsetzbare Empfehlungen.

Kampagnendaten:
- Briefing: ${campaign.prompt_text || campaign.prompt || "—"}
- Ziel: ${campaign.objective || campaign.ziel || "—"}
- Budget: ${campaign.budget || "—"} €
- Laufzeit: ${campaign.campaign_start || "—"} bis ${campaign.campaign_end || "—"}
- DSP: ${campaign.dsp || "—"}
- KPI: ${campaign.kpi || "—"}
- Datenanbieter: ${campaign.datenanbieter || "—"}
- Verification: ${campaign.verification || "—"}
- Bid Strategy: ${campaign.bid_strategy || "—"}
- Frequency Cap: ${campaign.freq_cap_impressions || "—"} ${campaign.freq_cap_zeitraum || ""}${campaign.referenzkampagne ? `\n- Referenzkampagne: ${campaign.referenzkampagne} — nutze diese als Vergleichsbasis für A/B-Testing Empfehlungen` : ""}

Regeln:
- Empfehlungen müssen DIREKT auf die Kampagnendaten eingehen — keine generischen Ratschläge
- Jede Empfehlung muss einen konkreten Wert nennen, z.B. 'Erhöhe Frequency Cap von 3 auf 5 pro Tag' oder 'Wechsle von CPM zu Optimized Bid für CTR-Ziel'
- Empfehlung muss im aktuellen Setup umsetzbar sein
- feld muss eines dieser exakten Werte sein: bid_strategy, freq_cap_impressions, freq_cap_zeitraum, pacing, bid_price, bid_adjustment, datenanbieter, verification, kanal, automationsmodus

Antworte NUR mit diesem JSON (kein Markdown, keine Erklärung):
{
  "empfehlungen": [
    {
      "titel": "Kurzer Titel (max 5 Wörter)",
      "beschreibung": "Konkrete Empfehlung mit Werten — erkläre warum",
      "aktion": "Was genau geändert werden soll",
      "feld": "welches Feld in Media Controls betroffen ist",
      "wert": "empfohlener neuer Wert als String"
    }
  ]
}`;

  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: systemPrompt }],
      temperature: 0.3,
    }),
  });

  if (!openaiRes.ok) {
    const err = await openaiRes.text();
    return NextResponse.json(
      { error: `OpenAI Fehler: ${openaiRes.status}`, detail: err },
      { status: 502 }
    );
  }

  const openaiData = await openaiRes.json();
  const raw: string = openaiData.choices?.[0]?.message?.content ?? "";

  try {
    const parsed = JSON.parse(raw);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json(
      { error: "OpenAI hat kein gültiges JSON zurückgegeben", raw },
      { status: 500 }
    );
  }
}
