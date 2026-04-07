// ============================================================
// src/lib/api.ts
// Alle Fetch-Aufrufe an n8n / (später Supabase) zentral gekapselt
// ============================================================

import { WEBHOOKS } from "./constants";
import { supabase } from "./supabase";
import type {
  CampaignForm,
  CampaignItem,
  CreativeForm,
  CreativeLibraryItem,
  MediaControlsSuggestion,
  N8nWebhookResponse,
  SavedRuleItem,
  SaveRulePayload,
  TeamInvite,
  UserRole,
} from "./types";

// ----------------------------------------------------------------
// Hilfsfunktion: eingeloggte User-ID abrufen
// ----------------------------------------------------------------
async function getUserId(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) throw new Error("Nicht eingeloggt");
  return session.user.id;
}

// ----------------------------------------------------------------
// n8n Fehlermeldungen — präzise je nach Fehlertyp
// ----------------------------------------------------------------
function n8nErrorMessage(error: unknown, status?: number): string {
  if (error instanceof Error) {
    if (error.name === "AbortError") {
      return "n8n Workflow antwortet nicht. Bitte prüfe ob der Workflow aktiv ist unter app.n8n.cloud.";
    }
    if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
      return "Keine Verbindung zu n8n. Bitte Internetverbindung prüfen.";
    }
  }
  if (status === 404) return "n8n Webhook nicht gefunden. Bitte prüfe die Webhook-URL.";
  if (status === 500) return "n8n Workflow-Fehler. Bitte prüfe die Logs in n8n.";
  if (status !== undefined) return `n8n Fehler ${status}. Bitte prüfe die Konfiguration.`;
  return "Unbekannter Fehler beim n8n Aufruf: " + (error instanceof Error ? error.message : String(error));
}

// ----------------------------------------------------------------
// fetch mit Timeout (10s) und Retry (2 Versuche)
// ----------------------------------------------------------------
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 2
): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
      return res;
    } catch (error) {
      clearTimeout(timeoutId);
      if (i < retries && (error instanceof Error && error.name !== "AbortError")) {
        // retry after 1s
        await new Promise((r) => setTimeout(r, 1000));
      } else {
        throw error;
      }
    }
  }
  // unreachable, but TypeScript needs it
  throw new Error("fetchWithRetry: alle Versuche fehlgeschlagen");
}

// ----------------------------------------------------------------
// n8n POST — Timeout + Retry + präzise Fehler
// ----------------------------------------------------------------
async function n8nPost<T>(url: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetchWithRetry(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (error) {
    throw new Error(n8nErrorMessage(error));
  }

  if (!res.ok) {
    throw new Error(n8nErrorMessage(null, res.status));
  }

  return res.json() as Promise<T>;
}

// ----------------------------------------------------------------
// Hilfsfunktion: sicheres POST (intern, nicht n8n)
// ----------------------------------------------------------------
async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

// ----------------------------------------------------------------
// Kampagne anlegen → n8n
// ----------------------------------------------------------------
export async function createCampaignViaWebhook(
  campaignId: string,
  form: CampaignForm
): Promise<N8nWebhookResponse> {
  return n8nPost<N8nWebhookResponse>(WEBHOOKS.promptStart, {
    campaign_id: campaignId,
    campaign_name: form.kampagnenname,
    objective: form.ziel,
    budget: Number(form.budget),
    kpi: form.kpi,
    prompt: buildCampaignPrompt(form),
  });
}

// ----------------------------------------------------------------
// Creative hochladen → n8n
// ----------------------------------------------------------------
export async function uploadCreativeViaWebhook(
  creativeForm: CreativeForm
): Promise<N8nWebhookResponse> {
  const size = creativeForm.format.split(" – ")[0] || creativeForm.format;

  return n8nPost<N8nWebhookResponse>(WEBHOOKS.creativeUpload, {
    campaign_id: creativeForm.campaign_id,
    name: creativeForm.name,
    type: creativeForm.type,
    format: creativeForm.format,
    size,
    file_url: creativeForm.file_url,
  });
}

// ----------------------------------------------------------------
// Regel speichern → n8n
// Gibt { success: true } zurück oder wirft einen Fehler
// ----------------------------------------------------------------
export async function saveRuleViaWebhook(
  payload: SaveRulePayload
): Promise<{ success: boolean }> {
  const data = await n8nPost<{ success?: boolean }>(WEBHOOKS.saveRule, payload);

  if (!data?.success) {
    throw new Error("n8n hat die Regel nicht bestätigt (success: false).");
  }

  return { success: true };
}

// ----------------------------------------------------------------
// Prompt-Text bauen (isoliert, leicht testbar)
// ----------------------------------------------------------------
export function buildCampaignPrompt(form: CampaignForm): string {
  return `
DSP: ${form.dsp}
Markt: ${form.markt}
Geräte: ${form.geraet}
Kanal: ${form.kanal}
CTV optional: ${form.ctv_aktiv}
Automationsmodus: ${form.automationsmodus}
Maximaler Budget-Shift: ${form.max_shift}
Datenanbieter: ${form.datenanbieter}
Verification: ${form.verification}

Nutzer-Prompt:
${form.prompt}
`.trim();
}

// ----------------------------------------------------------------
// Empfehlung aus n8n-Response extrahieren
// Unterstützt alle bisherigen Response-Formate
// ----------------------------------------------------------------
export function extractRecommendationText(
  response: N8nWebhookResponse | null
): string {
  if (!response) return "";
  if (response.error) return response.error;

  const candidates = [
    response?.recommendation?.recommendation_text,
    response?.recommendation_text,
    response?.data?.recommendation_text,
    response?.message,
    typeof response?.recommendation === "string"
      ? response.recommendation
      : undefined,
    response?.output_text,
  ];

  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }

  return JSON.stringify(response, null, 2);
}

// ----------------------------------------------------------------
// Stripe: Checkout Session erstellen und weiterleiten
// ----------------------------------------------------------------
export async function createStripeCheckout(plan: string, userId: string): Promise<void> {
  const res = await fetch("/api/stripe/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan, userId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "Stripe Checkout fehlgeschlagen");
  }

  const { url } = await res.json();
  if (url) {
    window.location.href = url;
  }
}

// ----------------------------------------------------------------
// ----------------------------------------------------------------
// OpenAI: Rohprompt zu professionellem Kampagnen-Brief ausformulieren
// ----------------------------------------------------------------
export async function expandPrompt(
  rohprompt: string,
  budget: string,
  objective: string,
  kpi: string
): Promise<{ brief: string; kampagnen_name: string }> {
  const res = await fetch("/api/expand-prompt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rohprompt, budget, objective, kpi }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "Brief-Erstellung fehlgeschlagen");
  }

  const data = await res.json() as { brief: string; kampagnen_name: string };
  return { brief: data.brief ?? "", kampagnen_name: data.kampagnen_name ?? "" };
}

// ----------------------------------------------------------------
// OpenAI: Prompt analysieren → Media Controls vorschlagen
// Ruft den eigenen Next.js API-Route auf (OPENAI_API_KEY bleibt server-seitig)
// ----------------------------------------------------------------
export async function analyzePromptForMediaControls(
  prompt: string,
  objective: string,
  budget: string,
  kpi: string
): Promise<MediaControlsSuggestion> {
  const res = await fetch("/api/analyze-prompt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, objective, budget, kpi }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "Analyse fehlgeschlagen");
  }

  return res.json() as Promise<MediaControlsSuggestion>;
}

// ----------------------------------------------------------------
// Supabase: Agentic Optimization aktivieren/deaktivieren
// SQL — run once: ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS agentic_enabled boolean DEFAULT false;
// ----------------------------------------------------------------
export async function updateAgenticEnabled(campaignId: string, enabled: boolean): Promise<void> {
  const { error } = await supabase
    .from("campaigns")
    .update({ agentic_enabled: enabled })
    .eq("id", campaignId);
  if (error) throw new Error(error.message);
}

// ----------------------------------------------------------------
// Supabase: Agentic Logs
// SQL — run once in Supabase SQL editor:
// CREATE TABLE IF NOT EXISTS agentic_logs (
//   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
//   campaign_id uuid REFERENCES campaigns(id),
//   user_id uuid REFERENCES auth.users(id),
//   routine text,
//   analyse text,
//   entscheidung text,
//   aktion jsonb,
//   status text DEFAULT 'vorgeschlagen',
//   created_at timestamptz DEFAULT now()
// );
// CREATE TABLE IF NOT EXISTS reporting (
//   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
//   campaign_id uuid REFERENCES campaigns(id),
//   creative_id uuid,
//   datum date,
//   impressions numeric DEFAULT 0,
//   clicks numeric DEFAULT 0,
//   ctr numeric DEFAULT 0,
//   cpm numeric DEFAULT 0,
//   spend numeric DEFAULT 0,
//   conversions numeric DEFAULT 0,
//   wochentag text,
//   dsp text,
//   created_at timestamptz DEFAULT now()
// );
// ----------------------------------------------------------------
import type { AgenticLog } from "./types";

export async function loadAgenticLogs(campaignId?: string): Promise<AgenticLog[]> {
  const userId = await getUserId();
  let query = supabase
    .from("agentic_logs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (campaignId) query = query.eq("campaign_id", campaignId);
  const { data, error } = await query;
  if (error) return []; // table may not exist yet
  return (data ?? []) as AgenticLog[];
}

export async function updateAgenticLogStatus(
  logId: string,
  status: "angewendet" | "abgelehnt"
): Promise<void> {
  const { error } = await supabase
    .from("agentic_logs")
    .update({ status })
    .eq("id", logId);
  if (error) throw new Error(error.message);
}

// ----------------------------------------------------------------
// Supabase: Kampagnen
// ----------------------------------------------------------------
export async function loadCampaigns(): Promise<CampaignItem[]> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as CampaignItem[];
}

// SQL — run once in Supabase SQL editor to add missing columns:
// ALTER TABLE campaigns
//   ADD COLUMN IF NOT EXISTS kanal text,
//   ADD COLUMN IF NOT EXISTS datenanbieter text,
//   ADD COLUMN IF NOT EXISTS verification text,
//   ADD COLUMN IF NOT EXISTS automationsmodus text,
//   ADD COLUMN IF NOT EXISTS ctv_aktiv boolean DEFAULT false,
//   ADD COLUMN IF NOT EXISTS prompt_text text,
//   ADD COLUMN IF NOT EXISTS dsp text;

export async function saveCampaign(campaign: CampaignItem): Promise<{ success: true; campaign: Record<string, unknown> } | { error: string } | void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) throw new Error("Nicht eingeloggt – user_id fehlt");

  const toNum = (v: unknown): number | null => {
    const n = Number(v);
    return isNaN(n) || n === 0 ? null : n;
  };

  const dailyBudget = toNum(campaign.budget_daily);
  if (dailyBudget !== null && dailyBudget < 10) {
    return { error: "Mindest-Tagesbudget 10 € unterschritten" };
  }

  const payload = {
    name: campaign.name,
    objective: campaign.objective,
    market: campaign.market,
    budget_total: toNum(campaign.budget),
    primary_kpi: campaign.kpi,
    status: campaign.status,
    user_id: session.user.id,
    campaign_start: campaign.campaign_start || null,
    campaign_end: campaign.campaign_end || null,
    budget_daily: toNum(campaign.budget_daily),
    pacing: campaign.pacing || null,
    bid_price: toNum(campaign.bid_price),
    bid_strategy: campaign.bid_strategy || null,
    bid_adjustment: toNum(campaign.bid_adjustment),
    freq_cap_impressions: toNum(campaign.freq_cap_impressions),
    freq_cap_zeitraum: campaign.freq_cap_zeitraum || null,
    inventory_type: campaign.inventory_type || null,
    devices: campaign.devices ?? null,
    // Previously missing fields — require DB migration above
    // ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS referenzkampagne text;
    dsp: (campaign as any).dsp || null,
    kanal: (campaign as any).kanal || null,
    datenanbieter: (campaign as any).datenanbieter || null,
    verification: (campaign as any).verification || null,
    automationsmodus: (campaign as any).automationsmodus || null,
    ctv_aktiv: (campaign as any).ctv_aktiv === "Ja" ? true : false,
    prompt_text: (campaign as any).prompt || null,
    referenzkampagne: (campaign as any).referenzkampagne || null,
  };

  const { data, error } = await supabase
    .from("campaigns")
    .insert(payload)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return { success: true, campaign: data as Record<string, unknown> };
}

export async function uploadCreativeFile(file: File): Promise<string> {
  const path = `uploads/${Date.now()}-${file.name.replace(/\s+/g, "_")}`;

  const { error } = await supabase.storage
    .from("creatives")
    .upload(path, file, { upsert: false });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from("creatives").getPublicUrl(path);
  return data.publicUrl;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function saveCreative(creative: CreativeLibraryItem): Promise<void> {
  const userId = await getUserId();
  const payload = {
    id: creative.id,
    name: creative.name,
    type: creative.type,
    format: creative.format,
    file_url: creative.file_url,
    status: creative.status,
    campaign_id: UUID_REGEX.test(creative.campaign_id) ? creative.campaign_id : null,
    user_id: userId,
    destination_url: creative.destination_url ?? null,
    tracking_url: creative.tracking_url ?? null,
  };
  const { error } = await supabase
    .from("creatives")
    .upsert(payload, { onConflict: "id" });

  if (error) throw new Error(error.message);
}

// ----------------------------------------------------------------
// Supabase: Regeln
// ----------------------------------------------------------------
export async function loadRules(): Promise<SavedRuleItem[]> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from("rules")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as SavedRuleItem[];
}

export async function saveRule(rule: SavedRuleItem): Promise<void> {
  const userId = await getUserId();
  const { error } = await supabase
    .from("rules")
    .upsert({ ...rule, user_id: userId }, { onConflict: "id" });

  if (error) throw new Error(error.message);
}

// ----------------------------------------------------------------
// Supabase: Creatives
// ----------------------------------------------------------------
export async function deleteCreative(creativeId: string): Promise<void> {
  const userId = await getUserId();
  const { error } = await supabase
    .from("creatives")
    .delete()
    .eq("id", creativeId)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export async function loadCreatives(): Promise<CreativeLibraryItem[]> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from("creatives")
    .select("*")
    .eq("user_id", userId)
    .order("id", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as CreativeLibraryItem[];
}

// ----------------------------------------------------------------
// Supabase: Billing berechnen & speichern
// ----------------------------------------------------------------
export async function updateBilling({
  plan,
  totalMediaBudget,
  extraNutzer,
}: {
  plan: string;
  totalMediaBudget: number;
  extraNutzer: number;
}): Promise<void> {
  const userId = await getUserId();

  const grundgebuehr =
    plan === "starter" ? 39 : plan === "growth" ? 99 : 195;
  const mediaFee = ["growth", "pro"].includes(plan)
    ? totalMediaBudget * 0.02
    : 0;
  const extraNutzerKosten = extraNutzer * 10;
  const gesamt = grundgebuehr + mediaFee + extraNutzerKosten;

  const upsertPayload = {
    user_id: userId,
    plan,
    grundgebuehr,
    media_budget_gesamt: totalMediaBudget,
    media_fee: mediaFee,
    extra_nutzer: extraNutzer,
    extra_nutzer_kosten: extraNutzerKosten,
    gesamt_monatlich: gesamt,
  };

  const { error } = await supabase
    .from("billing")
    .upsert(upsertPayload, { onConflict: "user_id" });

  if (error) throw new Error(error.message);
}

// ----------------------------------------------------------------
// Team: Einladungen laden
// ----------------------------------------------------------------
export async function loadTeamInvites(): Promise<TeamInvite[]> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from("team_invites")
    .select("id, invited_email, role, status, created_at")
    .eq("org_user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as TeamInvite[];
}

// ----------------------------------------------------------------
// Team: Einladung versenden
// ----------------------------------------------------------------
export async function sendTeamInvite(
  email: string,
  role: UserRole
): Promise<TeamInvite> {
  const userId = await getUserId();

  // Schritt 1: Supabase Auth Einladung via Server-Route (benötigt Service Role Key)
  const authRes = await fetch("/api/team/invite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, role, orgUserId: userId }),
  });

  if (!authRes.ok) {
    const err = await authRes.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "Einladung fehlgeschlagen");
  }

  // Schritt 2: Einladung in team_invites Tabelle speichern
  const { data, error } = await supabase
    .from("team_invites")
    .insert({ org_user_id: userId, invited_email: email, role, status: "pending" })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as TeamInvite;
}

// ----------------------------------------------------------------
// Team: Einladung löschen / zurückziehen
// ----------------------------------------------------------------
export async function deleteTeamInvite(inviteId: string): Promise<void> {
  const { error } = await supabase
    .from("team_invites")
    .delete()
    .eq("id", inviteId);

  if (error) throw new Error(error.message);
}

// ----------------------------------------------------------------
// Empfehlungstext in Einzel-Items aufteilen
// ----------------------------------------------------------------
export function parseRecommendationItems(text: string): string[] {
  if (!text) return [];

  const cleaned = text
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[=\s\-•\d.)]+/, "").trim())
    .filter(Boolean);

  if (cleaned.length >= 2) return cleaned.slice(0, 6);

  return text
    .split(/(?<=[.!?])\s+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 6);
}
