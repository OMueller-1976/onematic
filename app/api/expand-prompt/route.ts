import { NextRequest, NextResponse } from "next/server";
import { parseBudgetFromText } from "../../lib/campaign-parsing";

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY nicht konfiguriert" },
      { status: 500 }
    );
  }

  const { rohprompt, budget, objective, kpi } = await req.json();

  // ── Server-seitige Vorberechnungen ────────────────────────────
  const promptText = `${rohprompt ?? ""} ${objective ?? ""} ${budget ?? ""}`;

  // Budget: zuerst aus übergebenem budget-Feld, dann aus Rohtext
  const { budgetTotal, budgetErkannt } = (() => {
    if (budget && String(budget).trim()) {
      const fromField = parseBudgetFromText(String(budget));
      if (fromField.budgetErkannt) return fromField;
    }
    return parseBudgetFromText(promptText);
  })();

  const budgetLabel = budgetErkannt ? `${budgetTotal.toLocaleString("de-DE")} €` : (budget ? String(budget) : "nach Absprache");

  const systemPrompt = `Du bist ein Programmatic Advertising Experte.
Schreibe einen kurzen internen Kampagnen-Brief (max. 80 Wörter) und einen Kampagnennamen.
KEIN Briefkopf, KEINE Anrede, KEINE Grußformel.

Antworte NUR mit diesem JSON (kein Markdown, kein \`\`\`):
{
  "brief": "Wir möchten [Ziel] erreichen, indem wir [Zielgruppe] über [Kanal/Strategie] ansprechen.\\nZielgruppe: [Beschreibung]\\nBudget & Laufzeit: [Budget] / [Zeitraum]\\nStrategie: [Kurze Strategie]\\nKPI-Fokus: [KPI]",
  "kampagnen_name": "Format: [Ziel] [Zielgruppe/Produkt] [Monat/Jahr]. Beispiele: 'Awareness Mütter Oktober 2026', 'Retargeting DACH Q2 2026'. Max. 40 Zeichen."
}`;

  const userMessage = `Rohprompt: "${rohprompt}"
Ziel: ${objective || "nicht angegeben"}
Budget: ${budgetLabel}
KPI: ${kpi || "nicht angegeben"}`;

  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.4,
    }),
  });

  if (!openaiRes.ok) {
    const err = await openaiRes.text();
    return NextResponse.json(
      { error: `OpenAI Fehler: ${openaiRes.status}`, detail: err },
      { status: 502 }
    );
  }

  const data = await openaiRes.json();
  const raw = data.choices?.[0]?.message?.content ?? "";

  try {
    const parsed = JSON.parse(raw);
    return NextResponse.json({
      brief: parsed.brief ?? raw,
      kampagnen_name: parsed.kampagnen_name ?? "",
    });
  } catch {
    // Fallback: wenn kein gültiges JSON, raw als brief zurückgeben
    return NextResponse.json({ brief: raw, kampagnen_name: "" });
  }
}
