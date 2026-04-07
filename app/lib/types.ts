// ============================================================
// src/lib/types.ts
// Zentrale Typdefinitionen für ONEmatic
// ============================================================

export type CampaignStatus = "Aktiv" | "Pausiert" | "Entwurf" | "Beendet" | "draft" | "active" | "paused";

export type RuleStatus = "aktiv" | "pausiert";

export type CreativeStatus = "Aktiv" | "Pausiert" | "Entwurf";

export type TeamRole = "Admin" | "Editor" | "Analyst" | "Viewer";
export type UserRole = "admin" | "manager" | "user" | "viewer";

export type TeamMemberStatus = "aktiv" | "eingeladen";

export type TeamInvite = {
  id: string;
  invited_email: string;
  role: UserRole;
  status: "pending" | "accepted" | "declined";
  created_at: string;
};

export type ProfileSubPage =
  | "Profil"
  | "Billing"
  | "Team & Rollen"
  | "Sicherheit"
  | "Integrationen";

// ----------------------------------------------------------------
// Campaign
// ----------------------------------------------------------------
export type CampaignItem = {
  id: string;
  supabase_id?: string; // echte Supabase UUID, gesichert beim Laden
  name: string;
  status: CampaignStatus;
  dsp: string;
  kpi: string;
  budget: string;
  datenanbieter: string;
  verification: string;
  objective: string;
  prompt: string;
  created_at: string;
  user_id?: string;
  // Extended media-controls fields (optional, saved when present)
  market?: string;
  campaign_start?: string;
  campaign_end?: string;
  budget_daily?: string;
  pacing?: string;
  bid_price?: string;
  bid_strategy?: string;
  bid_adjustment?: string;
  freq_cap_impressions?: string;
  freq_cap_zeitraum?: string;
  inventory_type?: string;
  devices?: string[];
};

// ----------------------------------------------------------------
// Rule
// ----------------------------------------------------------------
export type SavedRuleItem = {
  id: string;
  text: string;
  status: RuleStatus;
  campaign_id?: string;
  created_at: string;
  user_id?: string;
};

// ----------------------------------------------------------------
// Creative
// ----------------------------------------------------------------
export type CreativeLibraryItem = {
  id: string;
  campaign_id: string;
  name: string;
  type: string;
  format: string;
  file_url: string;
  status: CreativeStatus;
  user_id?: string;
  destination_url?: string;
  tracking_url?: string;
};

// ----------------------------------------------------------------
// Team
// ----------------------------------------------------------------
export type TeamMemberItem = {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  status: TeamMemberStatus;
};

// ----------------------------------------------------------------
// Integration
// ----------------------------------------------------------------
export type IntegrationItem = {
  name: string;
  status: string;
  last_sync: string;
};

// ----------------------------------------------------------------
// Forms
// ----------------------------------------------------------------
export type CampaignForm = {
  kampagnenname: string;
  ziel: string;
  budget: string;
  kpi: string;
  prompt: string;
  dsp: string;
  markt: string;
  geraet: string;
  kanal: string;
  ctv_aktiv: string;
  automationsmodus: string;
  max_shift: string;
  datenanbieter: string;
  verification: string;
  // Laufzeit
  campaign_start: string;
  campaign_end: string;
  // Budget
  budget_daily: string;
  pacing: string;
  // Bidding
  bid_price: string;
  bid_strategy: string;
  bid_adjustment: string;
  // Frequency Cap
  freq_cap_impressions: string;
  freq_cap_zeitraum: string;
  // Inventory
  inventory_type: string;
  // Devices
  devices: string[];
  // A/B Testing
  referenzkampagne: string;
};

export type CreativeForm = {
  campaign_id: string;
  name: string;
  type: string;
  format: string;
  file_url: string;
  destination_url: string;
  tracking_url: string;
};

export type DataUploadForm = {
  datenname: string;
  datentyp: string;
  einsatzzweck: string;
  aktivierung: string;
  datei: string;
};

export type BillingForm = {
  cardholder: string;
  card_last4: string;
  card_expiry: string;
  paypal_email: string;
  payment_status: string;
};

export type ReportFilters = {
  zeitraum: string;
  dsp: string;
  kanal: string;
  land: string;
  kpi: string;
  attribution: string;
};

// ----------------------------------------------------------------
// Agentic AI Layer
// ----------------------------------------------------------------
export type AgenticDecision = {
  routine: "budget_optimierung" | "creative_rotation" | "dsp_shift" | "benchmark_check" | "referenz_vergleich" | string;
  prioritaet: "hoch" | "mittel" | "niedrig";
  analyse: string;
  entscheidung: string;
  aktion: {
    typ: "update_campaign" | "pause_creative" | "shift_budget" | "pause_campaign" | string;
    feld: string;
    wert: string;
    campaign_id?: string;
  };
  erwartete_verbesserung: string;
  // Claude verification fields (added in Stufe 2)
  verifiziert?: boolean;
  anmerkung?: string;
  alternative?: string;
};

export type ClaudeVerification = {
  verifiziert: boolean;
  qualitaets_score: number;
  empfehlungen_geprueft: Array<{
    routine: string;
    bestaetigt: boolean;
    anmerkung: string;
    alternative?: string;
  }>;
  zusaetzliche_optimierung: {
    gefunden: boolean;
    beschreibung?: string;
  };
  gesamtbewertung: string;
};

export type AgenticResult = {
  gesamtanalyse: string;
  performance_score: number;
  entscheidungen: AgenticDecision[];
  naechste_analyse: string;
  verifikation?: ClaudeVerification;
};

export type AgenticLog = {
  id: string;
  campaign_id: string;
  user_id?: string;
  routine: string;
  analyse: string;
  entscheidung: string;
  aktion: Record<string, unknown>;
  status: "vorgeschlagen" | "angewendet" | "abgelehnt";
  created_at: string;
};

// ----------------------------------------------------------------
// AI Recommendations (from /api/recommendations)
// ----------------------------------------------------------------
export type Recommendation = {
  titel: string;
  beschreibung: string;
  aktion: string;
  feld: string;
  wert: string;
};

// ----------------------------------------------------------------
// AI Media Controls Suggestion
// ----------------------------------------------------------------
export type MediaControlsSuggestion = {
  // Media Controls
  dsp: string;
  markt: string;
  kanal: string;
  automationsmodus: string;
  bid_strategy: string;
  bid_price: number;
  pacing: string;
  devices: string[];
  freq_cap_impressions: number;
  freq_cap_zeitraum: string;
  inventory_type: string;
  begruendung: string;
  // Laufzeit
  campaign_start: string;
  campaign_end: string;
  laufzeit_tage: number;
  laufzeit_begruendung: string;
  // Prompt Center
  kampagnen_name: string;
  objective: string;
  primary_kpi: string;
  budget_total: number;
  budget_daily: number;
  budget_erkannt: boolean;
  bid_adjustment: number;
};

// ----------------------------------------------------------------
// API Responses  (erweiterbar für Supabase / n8n)
// ----------------------------------------------------------------
export type N8nWebhookResponse = {
  success?: boolean;
  recommendation?: {
    recommendation_text?: string;
  };
  recommendation_text?: string;
  data?: {
    recommendation_text?: string;
  };
  message?: string;
  output_text?: string;
  error?: string;
  [key: string]: unknown;
};

export type SaveRulePayload = {
  id: string;
  text: string;
  status: RuleStatus;
  campaign_id: string;
};
