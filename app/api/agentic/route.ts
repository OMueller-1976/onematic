import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Server-side Supabase: service role for writes, anon key as fallback
function makeSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

const ROUTINE_LABELS: Record<string, string> = {
  budget_optimierung: "Budget Optimierung",
  creative_rotation: "Creative Rotation",
  dsp_shift: "DSP Performance",
  benchmark_check: "KPI Benchmark",
  referenz_vergleich: "Referenzvergleich",
};

// Generate realistic demo reporting when no real data exists
function generateDemoReporting(
  campaign: Record<string, unknown>
): Record<string, unknown>[] {
  const kpi = String(campaign.primary_kpi ?? campaign.kpi ?? "CTR");
  const dsp = String(campaign.dsp ?? "DV360");
  const wochentage = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
  const baseImpressions = 18000;
  const baseCTR = kpi === "CTR" ? 0.0038 : kpi === "ROAS" ? 0.0055 : 0.003;
  const baseCPM = 2.8;

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dayFactor = [0.75, 0.85, 1.1, 1.2, 1.05, 0.6, 0.55][i] ?? 1;
    const impressions = Math.round(baseImpressions * dayFactor * (0.9 + Math.random() * 0.2));
    const ctr = parseFloat((baseCTR * dayFactor * (0.85 + Math.random() * 0.3)).toFixed(4));
    const clicks = Math.round(impressions * ctr);
    const cpm = parseFloat((baseCPM * (0.95 + Math.random() * 0.1)).toFixed(2));
    const spend = parseFloat(((impressions / 1000) * cpm).toFixed(2));
    return {
      datum: date.toISOString().slice(0, 10),
      impressions,
      clicks,
      ctr,
      cpm,
      spend,
      conversions: Math.round(clicks * 0.012),
      wochentag: wochentage[date.getDay() === 0 ? 6 : date.getDay() - 1],
      dsp,
    };
  });
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY nicht konfiguriert" },
      { status: 500 }
    );
  }

  const { campaign_id, user_id } = await req.json();
  if (!campaign_id) {
    return NextResponse.json({ error: "campaign_id fehlt" }, { status: 400 });
  }

  const db = makeSupabase();

  // 1. Load campaign
  const { data: campaignData, error: campaignErr } = await db
    .from("campaigns")
    .select("*")
    .eq("id", campaign_id)
    .single();

  if (campaignErr || !campaignData) {
    return NextResponse.json(
      { error: "Kampagne nicht gefunden: " + (campaignErr?.message ?? "no data") },
      { status: 404 }
    );
  }

  // 2. Load reporting (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: reportingRaw } = await db
    .from("reporting")
    .select("*")
    .eq("campaign_id", campaign_id)
    .gte("datum", sevenDaysAgo.toISOString().slice(0, 10))
    .order("datum", { ascending: true });

  const reporting =
    reportingRaw && reportingRaw.length > 0
      ? reportingRaw
      : generateDemoReporting(campaignData);

  // 3. Load creatives
  const { data: creativesRaw } = await db
    .from("creatives")
    .select("*")
    .eq("campaign_id", campaign_id);

  const creatives = (creativesRaw ?? []).map((c: Record<string, unknown>) => ({
    name: c.name,
    format: c.format,
    status: c.status,
    impressions: (c as any).impressions ?? 0,
    ctr: (c as any).ctr ?? 0,
  }));

  // 4. Compute averages for benchmarks
  const avgCTR =
    reporting.length > 0
      ? (reporting.reduce((s: number, r: any) => s + (r.ctr ?? 0), 0) / reporting.length).toFixed(4)
      : "n/a";
  const avgCPM =
    reporting.length > 0
      ? (reporting.reduce((s: number, r: any) => s + (r.cpm ?? 0), 0) / reporting.length).toFixed(2)
      : "n/a";
  const totalSpend = reporting.reduce((s: number, r: any) => s + (r.spend ?? 0), 0).toFixed(2);

  const systemPrompt = `Du bist ONEmatic's Agentic AI — ein autonomer Programmatic Advertising Manager.

Deine Aufgabe: Analysiere die folgenden Kampagnendaten vollständig und triff eigenständige Optimierungsentscheidungen.

Du verhältst dich wie ein erfahrener Media Manager:
- Du analysierst Muster in den Performance-Daten
- Du erkennst Probleme und Chancen proaktiv
- Du begründest jede Entscheidung mit Daten
- Du priorisierst nach Kampagnenziel und KPI
- Du denkst DSP-übergreifend
- Du berücksichtigst Budget-Effizienz

Kampagnendaten:
${JSON.stringify({
  name: campaignData.name,
  ziel: campaignData.objective,
  kpi: campaignData.primary_kpi,
  budget_total: campaignData.budget_total,
  budget_daily: campaignData.budget_daily,
  laufzeit: `${campaignData.campaign_start ?? "—"} bis ${campaignData.campaign_end ?? "—"}`,
  dsp: campaignData.dsp,
  bid_strategy: campaignData.bid_strategy,
  freq_cap: `${campaignData.freq_cap_impressions ?? "—"} ${campaignData.freq_cap_zeitraum ?? ""}`,
  datenanbieter: campaignData.datenanbieter,
  verification: campaignData.verification,
  referenzkampagne: campaignData.referenzkampagne ?? null,
}, null, 2)}

Performance-Daten letzte 7 Tage (${reporting.length === 7 ? "real" : "simuliert"}):
Ø CTR: ${avgCTR} | Ø CPM: ${avgCPM}€ | Gesamt-Spend: ${totalSpend}€
${JSON.stringify(reporting, null, 2)}

Creatives Performance:
${creatives.length > 0 ? JSON.stringify(creatives, null, 2) : "Keine Creatives geladen"}

Branchenbenchmarks für ${campaignData.primary_kpi ?? "CTR"}:
- Display CTR Benchmark: 0.35% (0.0035)
- Video CTR Benchmark: 0.8% (0.008)
- CPM Benchmark Display: 2.50€
- Conversion Rate Benchmark: 1.2%
${campaignData.referenzkampagne ? `\nReferenzkampagne "${campaignData.referenzkampagne}" als Vergleichsbasis verwenden.` : ""}

Analysiere und entscheide über: BUDGET OPTIMIERUNG, CREATIVE ROTATION, DSP PERFORMANCE, KPI BENCHMARK CHECK${campaignData.referenzkampagne ? ", REFERENZKAMPAGNE VERGLEICH" : ""}.

Antworte NUR mit diesem JSON (kein Markdown, keine Erklärung):
{
  "gesamtanalyse": "Kurze Zusammenfassung in 2-3 Sätzen mit konkreten Zahlen",
  "performance_score": <number 0-100>,
  "entscheidungen": [
    {
      "routine": "<budget_optimierung|creative_rotation|dsp_shift|benchmark_check|referenz_vergleich>",
      "prioritaet": "<hoch|mittel|niedrig>",
      "analyse": "Warum — mit konkreten Zahlen aus den Daten",
      "entscheidung": "Was genau getan werden soll",
      "aktion": {
        "typ": "<update_campaign|pause_creative|shift_budget|pause_campaign>",
        "feld": "<Feldname der geändert wird>",
        "wert": "<neuer Wert als String>"
      },
      "erwartete_verbesserung": "Konkrete Prognose in %"
    }
  ],
  "naechste_analyse": "<zeitraum, z.B. 'in 24 Stunden' oder 'in 48 Stunden'>"
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
      temperature: 0.25,
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

  let result: Record<string, unknown>;
  try {
    result = JSON.parse(raw);
  } catch {
    return NextResponse.json(
      { error: "OpenAI hat kein gültiges JSON zurückgegeben", raw },
      { status: 500 }
    );
  }

  // 5. Claude verification — Stufe 2 des KI-Waterfalls
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  let verifikation: Record<string, unknown> | null = null;

  if (anthropicKey) {
    try {

      const kampagneDaten = {
        name: campaignData.name,
        ziel: campaignData.objective,
        kpi: campaignData.primary_kpi,
        budget_total: campaignData.budget_total,
        dsp: campaignData.dsp,
        bid_strategy: campaignData.bid_strategy,
      };
      const gptEntscheidungen = Array.isArray(result.entscheidungen) ? result.entscheidungen : [];

      const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-opus-4-5",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `Prüfe diese Optimierungsempfehlungen für eine Programmatic Advertising Kampagne:

Kampagne: ${JSON.stringify(kampagneDaten)}
GPT-4o Empfehlungen: ${JSON.stringify(gptEntscheidungen)}

Antworte NUR mit diesem JSON:
{
  "qualitaets_score": 85,
  "empfehlungen_geprueft": [
    {
      "routine": "gleicher Wert wie GPT",
      "bestaetigt": true,
      "anmerkung": "Kurze Begründung",
      "alternative": "Falls nicht bestätigt"
    }
  ],
  "gesamtbewertung": "1-2 Sätze Fazit"
}`,
          }],
        }),
      });

      if (!claudeRes.ok) {
        const errText = await claudeRes.text();
        console.error("[agentic] Claude API Fehler:", errText);
      } else {
        const claudeData = await claudeRes.json();
        const claudeText: string = claudeData.content?.[0]?.text ?? "{}";
        const claudeVerification = JSON.parse(
          claudeText.replace(/```json\n?|\n?```/g, "").trim()
        );
        verifikation = claudeVerification;
      }
    } catch (claudeError) {
      console.error("[agentic] Claude Exception:", claudeError);
      // Trotzdem weitermachen mit GPT Ergebnis allein
    }
  }

  // Merge Claude verification into each decision
  const entscheidungenRaw = Array.isArray(result.entscheidungen) ? result.entscheidungen as Record<string, unknown>[] : [];
  const geprueft = (verifikation?.empfehlungen_geprueft as Record<string, unknown>[] | undefined) ?? [];

  const entscheidungen = entscheidungenRaw.map((d) => {
    const check = geprueft.find((g) => g.routine === d.routine);
    return {
      ...d,
      verifiziert: check ? !!check.bestaetigt : undefined,
      anmerkung: check ? (check.anmerkung as string | undefined) : undefined,
      alternative: check && !check.bestaetigt ? (check.alternative as string | undefined) : undefined,
    };
  });

  // 6. Persist each decision as agentic_log
  const savedLogs: Record<string, unknown>[] = [];

  for (const decision of entscheidungen as Record<string, unknown>[]) {
    const aktion = decision.aktion as Record<string, unknown> ?? {};

    // Determine whether to auto-apply or keep as vorgeschlagen
    const autoApply =
      (decision.prioritaet === "hoch") &&
      aktion.typ !== "pause_campaign" &&
      aktion.typ !== "pause_creative";

    const logPayload: Record<string, unknown> = {
      campaign_id,
      user_id: user_id ?? null,
      routine: decision.routine ?? "benchmark_check",
      analyse: decision.analyse ?? "",
      entscheidung: decision.entscheidung ?? "",
      aktion: aktion,
      status: autoApply ? "angewendet" : "vorgeschlagen",
      // Claude verification fields
      claude_verifiziert: decision.verifiziert ?? null,
      claude_qualitaets_score: typeof verifikation?.qualitaets_score === "number"
        ? verifikation.qualitaets_score
        : null,
    };

    const { data: logData } = await db
      .from("agentic_logs")
      .insert(logPayload)
      .select()
      .single();

    if (logData) savedLogs.push(logData);

    // 6. Execute auto-applied actions
    if (autoApply && aktion.feld && aktion.wert !== undefined) {
      await db
        .from("campaigns")
        .update({ [String(aktion.feld)]: aktion.wert })
        .eq("id", aktion.campaign_id ?? campaign_id);
    }
  }

  return NextResponse.json({
    campaign_id,
    campaign_name: campaignData.name,
    gesamtanalyse: result.gesamtanalyse ?? "",
    performance_score: typeof result.performance_score === "number" ? result.performance_score : 50,
    entscheidungen,
    naechste_analyse: result.naechste_analyse ?? "in 24 Stunden",
    verifikation: verifikation ?? null,
    logs: savedLogs,
    reporting_source: reportingRaw && reportingRaw.length > 0 ? "real" : "simuliert",
  });
}
