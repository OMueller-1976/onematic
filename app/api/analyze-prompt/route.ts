import { NextRequest, NextResponse } from "next/server";
import { parseBudgetFromText } from "../../lib/campaign-parsing";

function dateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isValidDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s));
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY nicht konfiguriert" },
      { status: 500 }
    );
  }

  const { prompt, objective, budget, kpi } = await req.json();

  const today = new Date();
  const todayStr = dateStr(today);
  const fallbackEnd = dateStr(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30));

  const promptText = `${prompt ?? ""} ${objective ?? ""}`;

  // Budget aus Prompt — sucht nach €/Euro/Budget-Keyword, nimmt grösste Zahl
  const { budgetTotal, budgetErkannt } = (() => {
    if (budget && String(budget).trim()) {
      const fromField = parseBudgetFromText(String(budget));
      if (fromField.budgetErkannt) return fromField;
    }
    return parseBudgetFromText(promptText);
  })();

  const userMessage = `
Du bist ein Programmatic Advertising Experte.
Analysiere diesen Kampagnen-Brief und gib eine JSON-Antwort mit empfohlenen Einstellungen.

Heute ist: ${todayStr}
Kampagnen-Brief: "${prompt}"
Ziel (vom User angegeben, kann leer sein): "${objective}"
Budget (vom User angegeben, kann leer sein): "${budget}"
KPI (vom User angegeben, kann leer sein): "${kpi}"

DATUM-ABLEITUNG — Leite campaign_start und campaign_end direkt aus dem Kampagnen-Brief ab.
Erkenne alle Datums-Formulierungen:
- "Juli bis Dezember 2026" → campaign_start: 2026-07-01, campaign_end: 2026-12-31
- "2. Halbjahr 2026" oder "2H 2026" → campaign_start: 2026-07-01, campaign_end: 2026-12-31
- "1. Halbjahr 2026" oder "1H 2026" → campaign_start: 2026-01-01, campaign_end: 2026-06-30
- "Q3 2026" → campaign_start: 2026-07-01, campaign_end: 2026-09-30
- "Q1 2026" → campaign_start: 2026-01-01, campaign_end: 2026-03-31
- "Oktober 2026" → campaign_start: 2026-10-01, campaign_end: 2026-10-31
- "3 Monate ab sofort" → campaign_start: ${todayStr}, campaign_end: heute + 90 Tage
- "bis Ende 2026" → campaign_start: ${todayStr}, campaign_end: 2026-12-31
- "4 Wochen" → campaign_start: ${todayStr}, campaign_end: heute + 28 Tage
Falls kein Datum erkennbar: campaign_start = ${todayStr}, campaign_end = ${fallbackEnd}.
Gib campaign_start und campaign_end IMMER als ISO-Format zurück: YYYY-MM-DD.

Antworte NUR mit diesem JSON (keine Erklärung, kein Markdown, kein \`\`\`):
{
  "kampagnen_name": "Prägnanter Kampagnenname. Format: [Ziel] + [Zielgruppe/Produkt] + [Zeitraum falls genannt]. Beispiele: 'Awareness Mütter Oktober 2026', 'Retargeting DACH Q2 2026', 'Lead Gen B2B Mai-Juni'. Max. 40 Zeichen.",
  "dsp": eines von: "DV360", "The Trade Desk", "Xandr",
  "markt": eines von: "DACH", "Deutschland", "Europa",
  "kanal": eines von: "Programmatic Display", "Display + DOOH", "Display + DOOH + CTV",
  "automationsmodus": eines von: "Assistiert", "Mit manueller Freigabe", "Auto-Optimierung light",
  "bid_strategy": eines von: "Fixed Bid", "Optimized Bid", "Goal-based",
  "bid_price": Zahl (CPM in Euro, z.B. 4.5),
  "bid_adjustment": Zahl (prozentualer Aufschlag/Abschlag: Awareness/Branding +10 bis +20, Performance/Conversions -5 bis 0, Retargeting +15 bis +25, neutral 0),
  "pacing": eines von: "Even", "ASAP",
  "devices": Array aus Kombination von: ["mobile", "desktop", "ctv"],
  "freq_cap_impressions": Zahl (z.B. 3),
  "freq_cap_zeitraum": eines von: "pro Tag", "pro Woche",
  "inventory_type": "open_exchange",
  "begruendung": "Kurze Erklärung auf Deutsch warum diese Einstellungen (max. 2 Sätze)",
  "campaign_start": "YYYY-MM-DD",
  "campaign_end": "YYYY-MM-DD",
  "laufzeit_tage": Zahl (Anzahl Tage zwischen campaign_start und campaign_end),
  "laufzeit_begruendung": "Kurze Erklärung warum diese Laufzeit (1 Satz)",
  "objective": eines von: "Leadgenerierung", "Brand Awareness", "Traffic", "Conversions", "Abverkauf / Sales", "App Install", "Video Views", "Reichweite",
  "primary_kpi": eines von: "CPA", "CPL", "CTR", "ROAS", "CPC", "CPM", "Viewability", "Conversions", "Completion Rate",
  "budget_total": ${budgetErkannt ? budgetTotal : 0},
  "budget_daily": 0,
  "budget_erkannt": ${budgetErkannt}
}

Hinweise:
- kampagnen_name: Kurz, prägnant, beschreibend (z.B. "B2B Lead DACH Q2", "Retail Sommer Push")
- objective und primary_kpi: Falls vom User bereits angegeben, bevorzuge diese Werte
- budget_total und budget_erkannt sind bereits vorberechnet — übernimm die Werte unverändert
- bid_adjustment: Empfehle basierend auf Ziel (Awareness +10 bis +20, Performance -5 bis 0, Retargeting +15 bis +25)
- Mindest-Tagesbudget: 10 €. Berechne budget_daily = budget_total / laufzeit_tage, mindestens 10.
`.trim();

  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: userMessage }],
      temperature: 0.2,
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
  const raw = openaiData.choices?.[0]?.message?.content ?? "";

  try {
    const parsed = JSON.parse(raw);

    // Sicherheitsnetz: falls KI ungültige Datumsfelder zurückgibt → Fallback
    if (!isValidDate(parsed.campaign_start)) parsed.campaign_start = todayStr;
    if (!isValidDate(parsed.campaign_end)) parsed.campaign_end = fallbackEnd;

    // laufzeit_tage aus Datumsfeldern berechnen (kein LLM-Drift)
    const startMs = Date.parse(parsed.campaign_start);
    const endMs = Date.parse(parsed.campaign_end);
    parsed.laufzeit_tage = Math.max(1, Math.round((endMs - startMs) / 86400000) + 1);

    // Budget-Felder server-seitig setzen
    parsed.budget_erkannt = budgetErkannt;
    parsed.budget_total = budgetErkannt ? budgetTotal : (parsed.budget_total ?? 0);
    const computedDaily = parsed.budget_total > 0 && parsed.laufzeit_tage > 0
      ? Math.round(parsed.budget_total / parsed.laufzeit_tage)
      : 0;
    parsed.budget_daily = Math.max(computedDaily, parsed.budget_total > 0 ? 10 : 0);

    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json(
      { error: "OpenAI hat kein gültiges JSON zurückgegeben", raw },
      { status: 500 }
    );
  }
}
