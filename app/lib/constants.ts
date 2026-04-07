// ============================================================
// src/lib/constants.ts
// Alle statischen Optionslisten & Konfigurationswerte
// ============================================================

export const ZIEL_OPTIONEN = [
  "Leadgenerierung",
  "Brand Awareness",
  "Traffic",
  "Conversions",
  "Abverkauf / Sales",
  "App Install",
  "Video Views",
  "Reichweite",
] as const;

export const KPI_OPTIONEN = [
  "CPA",
  "CPL",
  "CTR",
  "ROAS",
  "CPC",
  "CPM",
  "Viewability",
  "Conversions",
  "Completion Rate",
] as const;

export const IAB_FORMATE: { label: string; disabled?: boolean }[] = [
  { label: "300x250 – Medium Rectangle" },
  { label: "336x280 – Large Rectangle" },
  { label: "728x90 – Leaderboard" },
  { label: "970x90 – Large Leaderboard" },
  { label: "970x250 – Billboard" },
  { label: "300x600 – Half Page" },
  { label: "160x600 – Wide Skyscraper" },
  { label: "320x50 – Mobile Leaderboard" },
  { label: "320x100 – Large Mobile Banner" },
  { label: "300x50 – Mobile Banner" },
  { label: "1080x1080 – Square Social / Display" },
  { label: "DOOH – Individuelles Format" },
  { label: "1080x1920 – Vertical Video / Story", disabled: true },
  { label: "1920x1080 – Full HD Video", disabled: true },
  { label: "CTV – 1920x1080 Video", disabled: true },
];

export const CREATIVE_TYPE_OPTIONEN: { value: string; label: string; disabled?: boolean }[] = [
  { value: "display", label: "Display" },
  { value: "dooh",    label: "DOOH" },
  { value: "native",  label: "Native" },
  { value: "video",   label: "Video", disabled: true },
  { value: "ctv",     label: "CTV",   disabled: true },
];

export const DATENANBIETER_OPTIONEN: { value: string; label: string; desc: string }[] = [
  { value: "liveramp",    label: "LiveRamp",                 desc: "People-Based Marketing, Identity Resolution" },
  { value: "moat",        label: "MOAT by Oracle",           desc: "Attention Measurement, Viewability" },
  { value: "first_party", label: "Eigene Daten (First Party)", desc: "CRM Upload oder Pixel-Daten" },
];

export const VERIFICATION_OPTIONEN: { value: string; label: string; desc: string; disabled?: boolean }[] = [
  { value: "doubleverify", label: "DoubleVerify",  desc: "Brand Safety, Fraud Detection, Viewability" },
  { value: "comscore",     label: "Comscore",      desc: "Audience Measurement, Brand Protection" },
  { value: "custom",       label: "Custom Setup",  desc: "Eigene Verification-Lösung", disabled: true },
];

export const MENU_ITEMS = [
  "Dashboard",
  "Kampagnen",
  "Creatives",
  "Daten & Verification",
  "Reporting",
  "AI Insights",
  "Profil",
  "Hilfe",
] as const;

export type MenuItem = (typeof MENU_ITEMS)[number];

export const DSP_OPTIONEN = ["DV360", "The Trade Desk", "Xandr"] as const;

export const MARKT_OPTIONEN = ["DACH", "Deutschland", "Europa"] as const;

export const KANAL_OPTIONEN: { value: string; label: string; disabled?: boolean }[] = [
  { value: "Programmatic Display",  label: "Programmatic Display" },
  { value: "DOOH",                  label: "DOOH" },
  { value: "Display + DOOH",        label: "Display + DOOH" },
  { value: "Display + DOOH + CTV",  label: "Display + DOOH + CTV (Coming soon)", disabled: true },
];

export const AUTOMATIONS_OPTIONEN = [
  "Assistiert",
  "Mit manueller Freigabe",
  "Auto-Optimierung light",
] as const;

export const TEAM_ROLLEN = ["Admin", "Editor", "Analyst", "Viewer"] as const;

export const PROMPT_TAGS = [
  "B2B",
  "Prospecting",
  "Retargeting",
  "DOOH",
  "CTV optional",
  "First Party Data",
  "Verification",
] as const;

// ----------------------------------------------------------------
// Webhooks  — nur hier anpassen, nie inline im Code
// ----------------------------------------------------------------
export const WEBHOOKS = {
  promptStart: "https://onetitel.app.n8n.cloud/webhook/prompt-start",
  creativeUpload: "https://onetitel.app.n8n.cloud/webhook/creative-upload",
  saveRule: "https://onetitel.app.n8n.cloud/webhook/save-rule",
} as const;

// ----------------------------------------------------------------
// Default-Werte für Formulare
// ----------------------------------------------------------------
export const PACING_OPTIONEN = ["Even", "ASAP"] as const;

export const BID_STRATEGY_OPTIONEN = [
  "Fixed Bid",
  "Optimized Bid",
  "Goal-based",
] as const;

export const FREQ_CAP_ZEITRAUM_OPTIONEN = [
  "pro Stunde",
  "pro Tag",
  "pro Woche",
] as const;

export const DEVICE_OPTIONEN: { value: string; label: string; disabled?: boolean }[] = [
  { value: "mobile",  label: "Mobile" },
  { value: "desktop", label: "Desktop" },
  { value: "ctv",     label: "CTV", disabled: true },
];

export const DEFAULT_CAMPAIGN_FORM = {
  kampagnenname: "",
  ziel: "",
  budget: "",
  kpi: "",
  prompt: "",
  dsp: "DV360",
  markt: "DACH",
  geraet: "Desktop + Mobile",
  kanal: "Programmatic Display",
  ctv_aktiv: "Nein",
  automationsmodus: "Assistiert",
  max_shift: "15%",
  datenanbieter: "",
  verification: "",
  campaign_start: "",
  campaign_end: "",
  budget_daily: "",
  pacing: "Even",
  bid_price: "",
  bid_strategy: "Fixed Bid",
  bid_adjustment: "",
  freq_cap_impressions: "3",
  freq_cap_zeitraum: "pro Tag",
  inventory_type: "open_exchange",
  devices: ["mobile", "desktop", "ctv"],
  referenzkampagne: "",
};

export const DEFAULT_CREATIVE_FORM = {
  campaign_id: "",
  name: "",
  type: "display",
  format: "",
  file_url: "",
  destination_url: "",
  tracking_url: "",
} as const;

export const DEFAULT_DATA_UPLOAD_FORM = {
  datenname: "",
  datentyp: "CRM / First Party",
  einsatzzweck: "Targeting",
  aktivierung: "Audience Enrichment",
  datei: "",
} as const;

export const DEFAULT_BILLING_FORM = {
  cardholder: "",
  card_last4: "",
  card_expiry: "",
  paypal_email: "",
  payment_status: "nicht verbunden",
} as const;

export const DEFAULT_REPORT_FILTERS = {
  zeitraum: "Letzte 30 Tage",
  dsp: "Alle DSPs",
  kanal: "Alle Kanäle",
  land: "DACH",
  kpi: "CPA",
  attribution: "Last Click",
} as const;

// ----------------------------------------------------------------
// Demo-Daten für leere States  (später durch Supabase ersetzen)
// ----------------------------------------------------------------
export const DEMO_CAMPAIGNS = [
  {
    id: "CMP-20260330-001",
    name: "B2B Lead DACH Q2",
    status: "Aktiv" as const,
    dsp: "DV360",
    kpi: "CPA",
    budget: "25000",
    datenanbieter: "LiveRamp",
    verification: "DoubleVerify",
    objective: "Leadgenerierung",
    prompt: "",
    created_at: "30.03.2026, 10:00",
  },
  {
    id: "CMP-20260330-002",
    name: "Retail Push Sommer",
    status: "Aktiv" as const,
    dsp: "The Trade Desk",
    kpi: "ROAS",
    budget: "40000",
    datenanbieter: "Lotame",
    verification: "doubleverify",
    objective: "Abverkauf / Sales",
    prompt: "",
    created_at: "30.03.2026, 10:05",
  },
] as const;

export const DEMO_INTEGRATIONS = [
  { name: "n8n", status: "Verbunden", last_sync: "vor 5 Min." },
  { name: "Supabase", status: "Verbunden", last_sync: "vor 3 Min." },
  { name: "OpenAI", status: "Verbunden", last_sync: "vor 1 Min." },
  { name: "Stripe", status: "Vorbereitet", last_sync: "noch nicht verbunden" },
  { name: "PayPal", status: "Vorbereitet", last_sync: "noch nicht verbunden" },
] as const;
