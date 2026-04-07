"use client"
import { useEffect, useMemo, useRef, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend, ResponsiveContainer } from "recharts"
import { supabase } from "../lib/supabase"
import type { CampaignStatus, CampaignItem, SavedRuleItem, CreativeLibraryItem, TeamMemberItem, ProfileSubPage, CampaignForm, CreativeForm, DataUploadForm, BillingForm, ReportFilters, N8nWebhookResponse, Recommendation, AgenticLog, AgenticResult } from "../lib/types";
import { DATENANBIETER_OPTIONEN, VERIFICATION_OPTIONEN, MENU_ITEMS, DEFAULT_CAMPAIGN_FORM, DEFAULT_CREATIVE_FORM, DEFAULT_DATA_UPLOAD_FORM, DEFAULT_BILLING_FORM, DEFAULT_REPORT_FILTERS } from "../lib/constants";
import { createCampaignViaWebhook, saveRuleViaWebhook, extractRecommendationText, parseRecommendationItems, loadCampaigns, loadRules, loadCreatives, saveCampaign, saveCreative, saveRule, uploadCreativeFile, updateBilling, analyzePromptForMediaControls, expandPrompt, createStripeCheckout, loadTeamInvites, sendTeamInvite, deleteTeamInvite, updateAgenticEnabled, loadAgenticLogs, updateAgenticLogStatus, deleteCreative } from "../lib/api";
import type { TeamInvite, UserRole } from "../lib/types";
import type { MediaControlsSuggestion } from "../lib/types";
import { DarkCard, LightCard } from "../components/ui";
import DashboardView from "../components/Dashboard";
import KampagnenView from "../components/Kampagnen";
import CreativesView from "../components/Creatives";
import AIInsightsView from "../components/AIInsights";

export default function Home() {
  const [activePage, setActivePage] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("activePage") || "Dashboard";
    }
    return "Dashboard";
  });

  const generateCreativeName = (campaignName: string, format: string, creativeId: string) => {
    const shortName = campaignName.split(" ").slice(0, 3).join(" ");
    const shortId = creativeId.replace(/-/g, "").substring(0, 4).toUpperCase();
    const formatPart = format && format !== "—" ? ` · ${format}` : "";
    return `${shortName}${formatPart} · #${shortId}`;
  };

  const autoCreativeId = useRef(Math.random().toString(36).substring(2, 6).toUpperCase());

  const handleKampagneStarten = async () => {
    if (!lastCampaignId) return;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(lastCampaignId)) return;

    const { error } = await supabase
      .from("campaigns")
      .update({ status: "Aktiv" })
      .eq("id", lastCampaignId);

    if (!error) {
      setCampaigns((prev) =>
        prev.map((c) =>
          c.supabase_id === lastCampaignId ? { ...c, status: "Aktiv" } : c
        )
      );
      setSelectedCampaign((prev) =>
        prev?.supabase_id === lastCampaignId ? { ...prev, status: "Aktiv" } : prev
      );
      setStatusMessage("✓ Kampagne wurde gestartet und ist jetzt Aktiv");
    } else {
      setStatusMessage("⚠ Fehler beim Starten der Kampagne: " + error.message);
    }
  };

  const handleGoToCreatives = () => {
    // Resolve UUID — prefer lastCampaignId if it's a real UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const validUUID = lastCampaignId && uuidRegex.test(lastCampaignId) ? lastCampaignId : "";

    const currentCampaign = validUUID
      ? campaigns.find((c) => c.supabase_id === validUUID || c.id === validUUID)
      : selectedCampaign ?? campaigns[0] ?? null;

    const shortId = validUUID.replace(/-/g, "").substring(0, 4).toUpperCase();
    const shortName = currentCampaign?.name?.split(" ").slice(0, 3).join(" ") ?? "";
    const autoName = shortName ? `${shortName} · #${shortId}` : "";

    // Full reset — no stale URLs or values from previous creatives
    setCreativeForm({
      campaign_id: validUUID,
      name: autoName,
      type: "display",
      format: "",
      file_url: "",
      destination_url: "",
      tracking_url: "",
    });

    localStorage.setItem("activePage", "Creatives");
    setActivePage("Creatives");
  };

  const handleSetActivePage = (page: string) => {
    localStorage.setItem("activePage", page);
    if (page === "Creatives") {
      const campaignName = selectedCampaign?.name ?? campaigns[0]?.name ?? "";
      // Only set campaign_id if lastCampaignId is a real UUID (not CMP-xxx)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const validUUID = lastCampaignId && uuidRegex.test(lastCampaignId) ? lastCampaignId : "";
      if (campaignName && (!creativeForm.name || creativeForm.name === "Neues Creative")) {
        autoCreativeId.current = Math.random().toString(36).substring(2, 6).toUpperCase();
        setCreativeForm((prev) => ({
          ...prev,
          campaign_id: validUUID || prev.campaign_id,
          name: generateCreativeName(campaignName, prev.format, autoCreativeId.current),
        }));
      } else if (validUUID && !creativeForm.campaign_id) {
        setCreativeForm((prev) => ({ ...prev, campaign_id: validUUID }));
      }
    }
    setActivePage(page);
  };
  const [userEmail, setUserEmail] = useState("");
  const creativeFileInputRef = useRef<HTMLInputElement>(null);
  const TIPPS = [
    "First-Party-Daten für besseres Targeting nutzen",
    "Creatives A/B-testen für höhere CTR",
    "CTV erreicht 40% mehr Aufmerksamkeit",
    "Frequency Cap auf 3–5 pro Woche limitieren",
    "Automatisierungsregeln sparen bis zu 30% Budget",
    "Lookalike Audiences steigern Conversion Rates",
    "Viewability-Score über 70% anstreben",
    "Retargeting-Fenstergröße auf 14 Tage testen",
    "DSP-Vergleich: DV360 vs TTD für deinen Kanal",
    "Tagesbudget gleichmäßig auf alle Placements verteilen",
    "Brand Safety Filter für Premium-Inventar aktivieren",
    "KI-Regeln auf Basis von CPA statt CTR setzen",
    "Dayparting: Hauptzielgruppe zwischen 18–21 Uhr",
  ];
  const [tippIndex, setTippIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTippIndex((i) => (i + 1) % TIPPS.length), 5000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        window.location.href = "/login";
        return;
      }
      if (session.user?.email) setUserEmail(session.user.email);

      // Stripe Rückkehr auswerten
      const urlParams = new URLSearchParams(window.location.search);
      const paymentStatus = urlParams.get("payment");
      const redirect = urlParams.get("redirect");
      if (paymentStatus === "success") {
        const paidPlan = urlParams.get("plan");
        if (paidPlan) setProfileData((p) => ({ ...p, plan: paidPlan }));
        if (redirect === "profil") {
          handleSetActivePage("Profil");
          setProfileSubPage("Billing");
        }
        const msg = `Zahlung erfolgreich! Dein Plan wurde aktiviert.`;
        setProfileSaveMsg({ type: "success", text: msg });
        setTimeout(() => setProfileSaveMsg(null), 5000);
        window.history.replaceState({}, "", "/dashboard");
      } else if (paymentStatus === "cancelled") {
        setStatusMessage("Zahlung abgebrochen. Dein aktueller Plan bleibt unverändert.");
        window.history.replaceState({}, "", "/dashboard");
      } else if (redirect === "billing") {
        // After onboarding: direct user to plan selection
        handleSetActivePage("Profil");
        setProfileSubPage("Billing");
        setStatusMessage("Bitte wähle ein Paket um ONEmatic zu nutzen.");
        window.history.replaceState({}, "", "/dashboard");
      }

      /*
       * SQL für Supabase (manuell ausführen):
       *
       * ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan text DEFAULT 'starter';
       * ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan_kampagnen_limit int DEFAULT 3;
       * ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan_nutzer_limit int DEFAULT 1;
       *
       * -- ALTER TABLE campaigns
       * --   ADD COLUMN IF NOT EXISTS campaign_start date,
       * --   ADD COLUMN IF NOT EXISTS campaign_end date,
       * --   ADD COLUMN IF NOT EXISTS budget_daily numeric,
       * --   ADD COLUMN IF NOT EXISTS pacing text DEFAULT 'Even',
       * --   ADD COLUMN IF NOT EXISTS bid_price numeric,
       * --   ADD COLUMN IF NOT EXISTS bid_strategy text DEFAULT 'Fixed Bid',
       * --   ADD COLUMN IF NOT EXISTS bid_adjustment numeric DEFAULT 0,
       * --   ADD COLUMN IF NOT EXISTS freq_cap_impressions int,
       * --   ADD COLUMN IF NOT EXISTS freq_cap_zeitraum text DEFAULT 'pro Tag',
       * --   ADD COLUMN IF NOT EXISTS inventory_type text DEFAULT 'open_exchange',
       * --   ADD COLUMN IF NOT EXISTS devices text[] DEFAULT ARRAY['mobile','desktop','ctv'];
       *
       * CREATE TABLE IF NOT EXISTS public.billing (
       *   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
       *   user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
       *   plan text DEFAULT 'starter',
       *   status text DEFAULT 'active',
       *   periode_start timestamptz,
       *   periode_end timestamptz,
       *   media_budget_fee numeric DEFAULT 0,
       *   created_at timestamptz DEFAULT now()
       * );
       * ALTER TABLE public.billing ENABLE ROW LEVEL SECURITY;
       * CREATE POLICY "eigenes_billing" ON public.billing
       *   FOR ALL USING (auth.uid() = user_id);
       */

      setUserId(session.user.id);

      // Agentic Logs laden (silent, Tabelle muss noch nicht existieren)
      loadAgenticLogs().then(setAgenticLogs).catch(() => {});

      // Rolle laden (unabhängig, beeinflusst kein Billing)
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .single()
        .then(({ data }) => { if (data?.role) setUserRole(data.role); });

      // Agentic logs parallel laden (silent if table missing)
      supabase
        .from("agentic_logs")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(20)
        .then(({ data }) => { if (data) setAgenticLogs(data as any); }, () => {});

      // Alles parallel laden — erst dann triggerBillingUpdate mit korrekten Werten
      Promise.all([
        loadCampaigns(),
        loadRules(),
        loadCreatives(),
        supabase.from("profiles").select("*").eq("user_id", session.user.id).single(),
        supabase.from("billing").select("plan, status, periode_end, grundgebuehr, media_budget_gesamt, media_fee, extra_nutzer_kosten, gesamt_monatlich").eq("user_id", session.user.id).single(),
      ])
        .then(([loadedCampaigns, loadedRules, loadedCreatives, profileResult, billingResult]) => {
          // Kampagnen mappen
          const today = new Date().toISOString().split("T")[0];
          const mapped = loadedCampaigns.map((c: any) => ({
            ...c,
            supabase_id: c.id,          // echte UUID explizit sichern
            id: c.id,                   // bleibt UUID, wird nie überschrieben
            budget: c.budget ?? c.budget_total ?? "—",
            kpi: c.kpi ?? c.primary_kpi ?? "—",
            dsp: c.dsp ?? "—",
            // Automatisch auf 'Beendet' setzen wenn campaign_end abgelaufen
            status: c.status === "Aktiv" && c.campaign_end && c.campaign_end < today
              ? "Beendet"
              : (c.status ?? "draft"),
          }));
          setCampaigns(mapped);

          // Abgelaufene aktive Kampagnen in Supabase archivieren
          const abgelaufen = mapped.filter(
            (c: any) => c.status === "Beendet" &&
              loadedCampaigns.find((raw: any) => raw.id === c.id)?.status === "Aktiv"
          );
          if (abgelaufen.length > 0) {
            supabase
              .from("campaigns")
              .update({ status: "Beendet" })
              .eq("user_id", session.user.id)
              .eq("status", "Aktiv")
              .lt("campaign_end", today)
              .then(({ error }) => {
                if (error) console.error("[dashboard] Auto-Archivierung Fehler:", error.message);
              });
          }
          setSavedRules(loadedRules);
          setCreativeLibrary(loadedCreatives);

          // Profil setzen
          const profileData = profileResult.data;
          if (profileData) {
            setProfileData({
              name: profileData.name ?? "",
              email: profileData.email ?? session.user.email ?? "",
              firma: profileData.firma ?? "",
              branche: profileData.branche ?? "",
              rolle: profileData.rolle ?? "",
              plan: profileData.plan ?? "starter",
              plan_kampagnen_limit: profileData.plan_kampagnen_limit ?? 3,
              plan_nutzer_limit: profileData.plan_nutzer_limit ?? 1,
            });
          } else {
            setProfileData((p) => ({ ...p, email: session.user.email ?? "" }));
          }

          // Billing setzen
          const billingData = billingResult.data;
          if (billingData) setBillingData(billingData);

          // Plan auflösen — billing hat Vorrang
          const resolvedPlan = billingData?.plan || profileData?.plan || "starter";
          setCurrentPlan(resolvedPlan);

          // triggerBillingUpdate mit allen bekannten Werten — kein State-Race
          const totalMediaBudget = mapped
            .filter((c) => c.status === "Aktiv")
            .reduce((sum, c) => sum + (Number((c as any).budget_total) || 0), 0);
          triggerBillingUpdate(mapped, resolvedPlan, totalMediaBudget);
        })
        .catch((err) => {
          console.error("[dashboard] Fehler beim Laden:", err?.message ?? err);
          setStatusMessage("⚠ Daten konnten nicht geladen werden.");
        });
    });
  }, []);

  const triggerBillingUpdate = (updatedCampaigns?: typeof campaigns, overridePlan?: string, overrideBudget?: number) => {
    const activeCampaigns = (updatedCampaigns ?? campaigns).filter((c) => c.status === "Aktiv");
    const totalMediaBudget = overrideBudget ?? activeCampaigns.reduce(
      (sum, c) => sum + (Number((c as any).budget_total) || 0),
      0
    );
    const plan = overridePlan || currentPlan || profileData.plan || "starter";
    const inkludiertNutzer = plan === "growth" ? 3 : plan === "pro" ? 10 : 1;
    const extraNutzer = Math.max(0, teamMembers.length - inkludiertNutzer);

    updateBilling({ plan, totalMediaBudget, extraNutzer })
      .then(() =>
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (!session) return;
          return supabase
            .from("billing")
            .select("*")
            .eq("user_id", session.user.id)
            .single()
            .then(({ data }) => { if (data) setBillingData(data); });
        })
      )
      .catch(() => {/* silent */});
  };

  const handleProfileSave = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { error } = await supabase
      .from("profiles")
      .update({
        name: profileData.name,
        firma: profileData.firma,
        branche: profileData.branche,
      })
      .eq("user_id", session.user.id);
    if (error) {
      setProfileSaveMsg({ type: "error", text: "Fehler beim Speichern: " + error.message });
    } else {
      setProfileSaveMsg({ type: "success", text: "Profil erfolgreich gespeichert." });
      triggerBillingUpdate();
    }
    setTimeout(() => setProfileSaveMsg(null), 4000);
  };

  const handlePlanUpgrade = async (newPlan: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { error } = await supabase
      .from("profiles")
      .update({ plan: newPlan })
      .eq("user_id", session.user.id);
    if (error) {
      setStatusMessage("Fehler beim Plan-Update: " + error.message);
      return;
    }
    setProfileData((p) => ({ ...p, plan: newPlan }));
    setStatusMessage(`Plan auf ${newPlan} aktualisiert.`);
    triggerBillingUpdate();
  };

  const handleStripeCheckout = async (plan: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      setStatusMessage("⚠ Bitte zuerst einloggen.");
      return;
    }
    try {
      await createStripeCheckout(plan, session.user.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
      setStatusMessage("⚠ Stripe Checkout fehlgeschlagen: " + msg);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };
  const [profileSubPage, setProfileSubPage] = useState<
    "Profil" | "Billing" | "Team & Rollen" | "Sicherheit"
  >("Profil");

  const [form, setForm] = useState<import("../lib/types").CampaignForm>(DEFAULT_CAMPAIGN_FORM);

  const [creativeForm, setCreativeForm] = useState<CreativeForm>({
    campaign_id: "",
    name: "",
    type: "display",
    format: "",
    file_url: "",
    destination_url: "",
    tracking_url: "",
  });

  const [dataUploadForm, setDataUploadForm] = useState({
    datenname: "",
    datentyp: "CRM / First Party",
    einsatzzweck: "Targeting",
    aktivierung: "Audience Enrichment",
    datei: "",
  });
  const [firstPartyMode, setFirstPartyMode] = useState<"file" | "url" | null>(null);
  const [firstPartyPixelUrl, setFirstPartyPixelUrl] = useState("");
  const firstPartyFileRef = useRef<HTMLInputElement>(null);

  const [billingForm, setBillingForm] = useState({
    payment_method: "card" as "card" | "paypal",
    cardholder: "",
    card_number: "",
    card_expiry: "",
    card_cvv: "",
    paypal_email: "",
  });

  const [response, setResponse] = useState<any>(null);
  const [dataResponse, setDataResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false);
  const [promptStatus, setPromptStatus] = useState<"idle" | "expanding" | "analyzing" | "done">("idle");
  const [aiSuggestion, setAiSuggestion] = useState<{ begruendung: string; fields: string[] } | null>(null);
  const [aiHighlightedFields, setAiHighlightedFields] = useState<string[]>([]);
  const [creativeLoading, setCreativeLoading] = useState(false);
  const [fileUploadLoading, setFileUploadLoading] = useState(false);
  const [creativesUploaded, setCreativesUploaded] = useState(false);
  const [rulesAdded, setRulesAdded] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const [savedRules, setSavedRules] = useState<SavedRuleItem[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignItem | null>(null);
  const [aiRecommendations, setAiRecommendations] = useState<Recommendation[]>([]);
  const [agenticLogs, setAgenticLogs] = useState<AgenticLog[]>([]);
  const [agenticResults, setAgenticResults] = useState<Record<string, AgenticResult>>({});
  const [agenticTriggerLoading, setAgenticTriggerLoading] = useState(false);
  const [userId, setUserId] = useState<string>("");
  // Agentic Activation Modal (separate from analysis modal)
  const [agenticActivateModal, setAgenticActivateModal] = useState(false);
  // Agentic Analysis Modal
  const [agenticModalOpen, setAgenticModalOpen] = useState(false);
  const [agenticModalLoading, setAgenticModalLoading] = useState(false);
  const [agenticModalData, setAgenticModalData] = useState<(AgenticResult & { campaign_id: string; campaign_name: string }) | null>(null);
  const [agenticModalApplied, setAgenticModalApplied] = useState<Record<number, boolean>>({});
  const [creativeLibrary, setCreativeLibrary] = useState<CreativeLibraryItem[]>([]);
  const [selectedCreative, setSelectedCreative] = useState<CreativeLibraryItem | null>(null);
  const [lastCampaignId, setLastCampaignId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [currentPlan, setCurrentPlan] = useState("starter");

  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    firma: "",
    branche: "",
    rolle: "",
    plan: "starter",
    plan_kampagnen_limit: 3,
    plan_nutzer_limit: 1,
  });
  const [profileSaveMsg, setProfileSaveMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [extraNutzerInput, setExtraNutzerInput] = useState(0);

  const [userRole, setUserRole] = useState<string>("user");

  const [billingData, setBillingData] = useState<{
    plan: string;
    status: string;
    periode_end: string | null;
    grundgebuehr: number;
    media_budget_gesamt: number;
    media_fee: number;
    extra_nutzer_kosten: number;
    gesamt_monatlich: number;
  } | null>(null);

  useEffect(() => {
    if (!statusMessage) return;
    const timer = setTimeout(() => setStatusMessage(""), 4000);
    return () => clearTimeout(timer);
  }, [statusMessage]);

  // Team-Einladungen laden wenn Tab geöffnet wird
  useEffect(() => {
    if (profileSubPage === "Team & Rollen") {
      loadTeamInvites()
        .then(setTeamInvites)
        .catch(() => { /* Tabelle noch nicht angelegt → leer lassen */ });
    }
  }, [profileSubPage]);

  const [teamMembers, setTeamMembers] = useState<TeamMemberItem[]>([
    {
      id: "USR-001",
      name: "Oliver Müller",
      email: "oliver@example.com",
      role: "Admin",
      status: "aktiv",
    },
    {
      id: "USR-002",
      name: "Anna Becker",
      email: "anna@example.com",
      role: "Analyst",
      status: "eingeladen",
    },
  ]);

  const [teamInvites, setTeamInvites] = useState<TeamInvite[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("user");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [reportFilters, setReportFilters] = useState({
    zeitraum: "Letzte 30 Tage",
    dsp: "Alle DSPs",
    kanal: "Alle Kanäle",
    land: "DACH",
    kpi: "CPA",
    attribution: "Last Click",
  });

  const [reportData] = useState({
    spend: "64.200 €",
    impressions: "14,8 Mio.",
    clicks: "182.400",
    conversions: "1.248",
    data_cost: "6.420 €",
    verification_rate: "98,7 %",
  });

  const generateCampaignId = () => {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const random = String(Math.floor(Math.random() * 1000)).padStart(3, "0");
    return `CMP-${date}-${random}`;
  };
const generateRuleId = () => {
  return `RUL-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
};

  const generateCreativeId = () => crypto.randomUUID();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleDeviceToggle = (device: string) => {
    setForm((prev) => {
      const current = prev.devices ?? [];
      const next = current.includes(device)
        ? current.filter((d) => d !== device)
        : [...current, device];
      return { ...prev, devices: next.length > 0 ? next : current }; // min 1
    });
  };

  const handleCreativeChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === "format") {
      const campaignName = selectedCampaign?.name ?? campaigns[0]?.name ?? "";
      const currentName = creativeForm.name;
      const isAutoName = !currentName || currentName.includes(" · #");
      if (campaignName && isAutoName) {
        setCreativeForm((prev) => ({
          ...prev,
          format: value,
          name: generateCreativeName(campaignName, value, autoCreativeId.current),
        }));
        return;
      }
    }
    setCreativeForm({ ...creativeForm, [name]: value });
  };

  const handleCreativeFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileUploadLoading(true);
    setStatusMessage("");
    try {
      const url = await uploadCreativeFile(file);
      setCreativeForm((prev) => ({ ...prev, file_url: url }));
      setStatusMessage("Datei hochgeladen.");
    } catch {
      setStatusMessage("⚠ Datei-Upload fehlgeschlagen.");
    } finally {
      setFileUploadLoading(false);
    }
  };

  const handleDataUploadChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setDataUploadForm({ ...dataUploadForm, [e.target.name]: e.target.value });
  };

  const handleBillingChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setBillingForm({ ...billingForm, [e.target.name]: e.target.value });
  };

  const handleReportFilterChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setReportFilters({ ...reportFilters, [e.target.name]: e.target.value });
  };

  const handleReset = () => {
    setForm({ ...DEFAULT_CAMPAIGN_FORM });
    setResponse(null);
    setSubmitAttempted(false);
    setStatusMessage("Formular zurückgesetzt.");
  };

  const handleSaveDraft = async () => {
    if (!form.kampagnenname) {
      setStatusMessage("⚠ Bitte mindestens einen Kampagnennamen eingeben.");
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      setStatusMessage("⚠ Nicht eingeloggt.");
      return;
    }

    // If campaign was already saved to Supabase, update its status to 'draft'
    if (lastCampaignId) {
      const { error } = await supabase
        .from("campaigns")
        .update({ status: "draft" })
        .eq("id", lastCampaignId);
      if (error) {
        setStatusMessage("⚠ Entwurf konnte nicht gespeichert werden: " + error.message);
        return;
      }
      setCampaigns((prev) =>
        prev.map((c) => (c.supabase_id === lastCampaignId ? { ...c, status: "draft" } : c))
      );
      setStatusMessage("Kampagne als Entwurf gespeichert — du findest sie unter Kampagnen");
      return;
    }

    // Campaign not yet in Supabase — create it as draft
    const campaignId = generateCampaignId();
    const draft: CampaignItem = {
      id: campaignId,
      name: form.kampagnenname,
      status: "draft",
      dsp: form.dsp || "—",
      kpi: form.kpi || "—",
      budget: form.budget || "—",
      datenanbieter: form.datenanbieter || "—",
      verification: form.verification || "—",
      objective: form.ziel || "—",
      prompt: form.prompt || "",
      created_at: new Date().toLocaleString("de-DE"),
      user_id: session.user.id,
    };
    const { error } = await supabase.from("campaigns").insert(draft);
    if (error) {
      setStatusMessage("⚠ Entwurf konnte nicht gespeichert werden: " + error.message);
      return;
    }
    setCampaigns((prev) => [draft, ...prev]);
    setStatusMessage("Kampagne als Entwurf gespeichert — du findest sie unter Kampagnen");
  };

  const applyMediaControlsSuggestion = (suggestion: MediaControlsSuggestion) => {

    const applied: string[] = [];

    setForm((prev) => {
      const next = { ...prev };

      const apply = (key: keyof typeof next, value: string | string[]) => {
        (next as Record<string, unknown>)[key] = value;
        applied.push(key);
      };

      // Media Controls
      if (suggestion.dsp) apply("dsp", suggestion.dsp);
      if (suggestion.markt) apply("markt", suggestion.markt);
      if (suggestion.kanal) apply("kanal", suggestion.kanal);
      if (suggestion.automationsmodus) apply("automationsmodus", suggestion.automationsmodus);
      if (suggestion.bid_strategy) apply("bid_strategy", suggestion.bid_strategy);
      if (suggestion.bid_price) apply("bid_price", String(suggestion.bid_price));
      if (suggestion.pacing) apply("pacing", suggestion.pacing);
      if (Array.isArray(suggestion.devices) && suggestion.devices.length > 0) {
        apply("devices", suggestion.devices);
      }
      if (suggestion.freq_cap_impressions) {
        apply("freq_cap_impressions", String(suggestion.freq_cap_impressions));
      }
      if (suggestion.freq_cap_zeitraum) apply("freq_cap_zeitraum", suggestion.freq_cap_zeitraum);

      // Laufzeit — immer setzen, prev als Fallback damit nie leer überschrieben wird
      const newStart = suggestion.campaign_start ?? prev.campaign_start ?? "";
      const newEnd = suggestion.campaign_end ?? prev.campaign_end ?? "";
      apply("campaign_start", newStart);
      apply("campaign_end", newEnd);

      // Kampagnenname: Badge immer setzen wenn KI einen hat; Wert nur wenn Feld noch leer
      if (suggestion.kampagnen_name) {
        applied.push("kampagnenname");
        if (!prev.kampagnenname) (next as Record<string, unknown>)["kampagnenname"] = suggestion.kampagnen_name;
      }
      // Objective + KPI: Prompt hat Vorrang — immer setzen
      if (suggestion.objective) apply("ziel", suggestion.objective);
      if (suggestion.primary_kpi) apply("kpi", suggestion.primary_kpi);
      // Budget: Prompt hat Vorrang wenn KI es erkannt hat
      if (suggestion.budget_erkannt && suggestion.budget_total) {
        apply("budget", String(suggestion.budget_total));
      }
      if (suggestion.budget_daily) {
        apply("budget_daily", String(suggestion.budget_daily));
      }
      if (suggestion.bid_adjustment !== undefined && suggestion.bid_adjustment !== null) {
        apply("bid_adjustment", String(suggestion.bid_adjustment));
      }

      return next;
    });

    const begruendungParts = [
      suggestion.begruendung,
      suggestion.laufzeit_begruendung,
    ].filter(Boolean).join(" — ");

    setAiSuggestion({ begruendung: begruendungParts, fields: applied });
    setAiHighlightedFields(applied);

    // Highlight nach 8 Sekunden ausblenden
    setTimeout(() => setAiHighlightedFields([]), 8000);
  };

  const handleSubmit = async () => {
    setSubmitAttempted(true);

    // Wenn Prompt ausgefüllt (>10 Zeichen): KI übernimmt Name/objective/kpi/budget
    const hasPrompt = (form.prompt ?? "").length > 10;
    const missingFields = [
      // Name nur Pflichtfeld wenn KEIN Prompt — sonst generiert KI den Namen
      !hasPrompt && !form.kampagnenname && "Kampagnenname",
      !hasPrompt && !form.ziel    && "Kampagnenziel",
      !hasPrompt && !form.kpi     && "KPI",
      !hasPrompt && !form.budget  && "Budget",
    ].filter(Boolean);

    if (missingFields.length > 0) {
      setStatusMessage(`⚠ Bitte folgende Felder ausfüllen: ${missingFields.join(", ")}`);
      return;
    }

    // Kampagnen-Limit prüfen
    const activePlan = profileData.plan || "starter";
    const planLimit = activePlan === "growth" ? 10 : activePlan === "pro" ? null : 3;
    const activeCount = campaigns.filter((c) => c.status === "Aktiv").length;
    if (planLimit !== null && activeCount >= planLimit) {
      setStatusMessage(`⚠ Upgrade erforderlich: Dein ${activePlan}-Plan erlaubt nur ${planLimit} aktive Kampagnen. Bitte upgrade auf Growth oder Pro.`);
      return;
    }

    setLoading(true);
    setResponse(null);
    setStatusMessage("");

    // uuidRegex muss VOR dem expandPrompt-Block stehen (wird dort für isResubmit verwendet)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    // Schritt 1: Rohprompt zu professionellem Brief ausformulieren
    // kampagnenNameFinal als lokale Variable — damit saveCampaign sofort den KI-Namen nutzt
    let expandedPrompt = form.prompt;
    let kampagnenNameFinal = form.kampagnenname;
    if (hasPrompt) {
      setPromptStatus("expanding");
      try {
        const { brief, kampagnen_name } = await expandPrompt(form.prompt, form.budget, form.ziel, form.kpi);
        if (brief) {
          expandedPrompt = brief;
          if (kampagnen_name) {
            // On re-submit (existing campaign): always refresh name from new prompt
            // On first submit: use AI name only if field is empty
            const isResubmit = !!(lastCampaignId && uuidRegex.test(lastCampaignId));
            if (isResubmit || !form.kampagnenname) {
              kampagnenNameFinal = kampagnen_name;
              setAiHighlightedFields((prev) => [...prev, "kampagnenname"]);
            }
          }
          setForm((prev) => ({
            ...prev,
            prompt: brief,
            kampagnenname: kampagnenNameFinal || prev.kampagnenname,
          }));
        }
      } catch (err) {
        console.warn("[expand-prompt] Fehler:", err);
        // Weiter mit Originaltext
      }
    }

    // Schritt 2a: Wenn Kampagne bereits in Supabase — nur updaten, keine neue anlegen
    if (lastCampaignId && uuidRegex.test(lastCampaignId) && kampagnenNameFinal) {
      const { error: updateError } = await supabase
        .from("campaigns")
        .update({ name: kampagnenNameFinal, prompt: expandedPrompt ?? form.prompt })
        .eq("id", lastCampaignId);
      if (!updateError) {
        setForm((prev) => ({ ...prev, kampagnenname: kampagnenNameFinal ?? prev.kampagnenname }));
        setCampaigns((prev) => prev.map((c) =>
          c.supabase_id === lastCampaignId ? { ...c, name: kampagnenNameFinal ?? c.name } : c
        ));
        setSelectedCampaign((prev) =>
          prev?.supabase_id === lastCampaignId ? { ...prev, name: kampagnenNameFinal ?? prev.name } : prev
        );
        setStatusMessage("Kampagne aktualisiert.");
      } else {
        console.warn("[submit] update error:", updateError.message);
      }
      // Continue to media controls analysis with updated prompt
      setPromptStatus("analyzing");
      setAiAnalysisLoading(true);
      analyzePromptForMediaControls(expandedPrompt ?? form.prompt, form.ziel, form.budget, form.kpi)
        .then((suggestion) => { applyMediaControlsSuggestion(suggestion); setPromptStatus("done"); })
        .catch((err) => { console.warn("[analyze-prompt] Fehler:", err?.message ?? err); setPromptStatus("idle"); })
        .finally(() => setAiAnalysisLoading(false));
      setLoading(false);
      return;
    }

    // Schritt 2: Kampagne speichern (mit KI-generiertem Namen)
    const campaignId = generateCampaignId();
    setLastCampaignId(campaignId);

    const newCampaign: CampaignItem = {
      id: campaignId,
      name: kampagnenNameFinal || "Neue Kampagne",
      status: "Aktiv",
      dsp: form.dsp,
      kpi: form.kpi || "—",
      budget: form.budget || "—",
      datenanbieter: form.datenanbieter || "—",
      verification: form.verification || "—",
      objective: form.ziel || "—",
      prompt: expandedPrompt || "",
      created_at: new Date().toLocaleString("de-DE"),
    };

    try {
      const saveResult = await saveCampaign(newCampaign);
      if (saveResult && "error" in saveResult) {
        setStatusMessage(`Fehler: ${saveResult.error}`);
        return;
      }
      const supabaseId = (saveResult && "campaign" in saveResult ? saveResult.campaign?.id as string : undefined) ?? undefined;

      const savedCampaign: CampaignItem = supabaseId
        ? { ...newCampaign, supabase_id: supabaseId }
        : newCampaign;

      if (supabaseId) setLastCampaignId(supabaseId);

      const updatedCampaigns = [savedCampaign, ...campaigns];
      setCampaigns(updatedCampaigns);
      setSelectedCampaign(savedCampaign);
      // Use Supabase UUID for campaign_id so creatives match Dashboard filter
      setCreativeForm((prev) => ({ ...prev, campaign_id: supabaseId ?? campaignId }));
      setStatusMessage("Kampagne gespeichert.");
      const totalMediaBudget = updatedCampaigns
        .filter((c) => c.status === "Aktiv")
        .reduce((sum, c) => sum + (Number((c as any).budget_total) || 0), 0);
      triggerBillingUpdate(updatedCampaigns, currentPlan, totalMediaBudget);

      // n8n Webhook async (blockiert nicht — App läuft bei Fehler weiter)
      createCampaignViaWebhook(campaignId, form)
        .then((data) => {
          setResponse(data);
          const n8nMediaControls = (data as any)?.media_controls as MediaControlsSuggestion | undefined;
          if (n8nMediaControls && typeof n8nMediaControls === "object") {
            applyMediaControlsSuggestion(n8nMediaControls);
          }
        })
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : "n8n Verbindungsfehler";
          console.warn("[n8n] createCampaignViaWebhook:", msg);
          setStatusMessage("⚠ " + msg);
        });

      // Schritt 3: Media Controls aus ausformuliertem Brief analysieren
      setPromptStatus("analyzing");
      setAiAnalysisLoading(true);
      analyzePromptForMediaControls(expandedPrompt, form.ziel, form.budget, form.kpi)
        .then((suggestion) => {
          applyMediaControlsSuggestion(suggestion);
          setPromptStatus("done");
        })
        .catch((err) => {
          console.warn("[analyze-prompt] Fehler:", err?.message ?? err);
          setPromptStatus("idle");
        })
        .finally(() => setAiAnalysisLoading(false));

      // Schritt 4: KI-Empfehlungen für die Kampagne laden
      fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt_text: expandedPrompt,
          objective: form.ziel,
          budget: form.budget,
          campaign_start: form.campaign_start,
          campaign_end: form.campaign_end,
          dsp: form.dsp,
          kpi: form.kpi,
          datenanbieter: form.datenanbieter,
          verification: form.verification,
          bid_strategy: form.bid_strategy,
          freq_cap_impressions: form.freq_cap_impressions,
          freq_cap_zeitraum: form.freq_cap_zeitraum,
          referenzkampagne: form.referenzkampagne || "",
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data.empfehlungen)) {
            setAiRecommendations(data.empfehlungen.slice(0, 2));
          }
        })
        .catch((err) => console.warn("[recommendations] Fehler:", err?.message ?? err));

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
      setStatusMessage("⚠ Kampagne konnte nicht gespeichert werden: " + msg);
      setPromptStatus("idle");
    } finally {
      setLoading(false);
    }
  };

  const handleCreativeSubmit = async () => {
    if (creativeLoading) return;

    setCreativeLoading(true);
    setStatusMessage("");

    const newCreative: CreativeLibraryItem = {
      id: generateCreativeId(),
      // lastCampaignId is the Supabase UUID — prefer it over the form value which may be CMP-xxx
      campaign_id: lastCampaignId || creativeForm.campaign_id || "",
      name: creativeForm.name || "Neues Creative",
      type: creativeForm.type,
      format: creativeForm.format || "—",
      file_url: creativeForm.file_url || "",
      status: "Aktiv",
      destination_url: creativeForm.destination_url || undefined,
      tracking_url: creativeForm.tracking_url || undefined,
    };

    setCreativeLibrary((prev) => [newCreative, ...prev]);
    setSelectedCreative(newCreative);
    setCreativeForm({ ...DEFAULT_CREATIVE_FORM, campaign_id: lastCampaignId || "", destination_url: creativeForm.destination_url });
    setCreativesUploaded(true);
    setStatusMessage("Creative gespeichert und Bibliothek vorbereitet.");
    setCreativeLoading(false);

    saveCreative(newCreative).catch(() => {
      setStatusMessage("Creative gespeichert, Supabase-Sync fehlgeschlagen.");
    });
  };

  const recommendationText = useMemo(() => extractRecommendationText(response), [response]);
  const recommendationItems = useMemo(() => parseRecommendationItems(recommendationText), [recommendationText]);

  // Step 4 is done when the library has at least one creative for the active campaign
  const creativesForCampaign = useMemo(() => {
    if (lastCampaignId) {
      return creativeLibrary.some((c) => c.campaign_id === lastCampaignId);
    }
    // Fall back to the upload flag if no UUID yet
    return creativesUploaded;
  }, [creativeLibrary, lastCampaignId, creativesUploaded]);

  const workflowStepsDone = useMemo(() => [
    !!(form.kampagnenname && form.ziel && form.budget && form.kpi),
    !!(form.kampagnenname && form.ziel && form.budget && form.kpi && form.dsp && form.markt && form.kanal),
    !!(response && !response.error),
    creativesForCampaign,
  ], [form, response, creativesForCampaign]);

  // currentStep: 1-4 active, 5 = all done (all steps show ✓)
  const currentStep = useMemo(() => {
    const [s1, s2, s3, s4] = workflowStepsDone;
    if (s4) return 5;
    if (s3) return 4;
    if (s2) return 3;
    if (s1) return 2;
    return 1;
  }, [workflowStepsDone]);

  const openRecommendationCount = Math.max(
    aiRecommendations.length - savedRules.filter((rule) => rule.status === "aktiv").length,
    0
  );

  const handleSaveRule = async (item: string) => {
    const existingRule = savedRules.some((rule) => rule.text === item);
    if (existingRule) return;

    const newRule = {
      id: generateRuleId(),
      text: item,
      status: "aktiv" as const,
      campaign_id: selectedCampaign?.id || lastCampaignId || "",
      created_at: new Date().toLocaleString("de-DE"),
    };

    setSavedRules((current) => [...current, newRule]);
    setRulesAdded(true);
    setStatusMessage("Regel gespeichert.");

    saveRuleViaWebhook(newRule).catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : "n8n-Sync fehlgeschlagen";
      console.warn("[n8n] saveRuleViaWebhook:", msg);
      setStatusMessage("Regel gespeichert. ⚠ " + msg);
    });

    saveRule(newRule).catch(() => {
      setStatusMessage("Regel lokal gespeichert, Supabase-Sync fehlgeschlagen.");
    });
  };

  const handleRuleStatusToggle = (ruleId: string) => {
    setSavedRules((current) =>
      current.map((rule) =>
        rule.id === ruleId
          ? {
              ...rule,
              status: rule.status === "aktiv" ? "pausiert" : "aktiv",
            }
          : rule
      )
    );
  };

  const handleRuleRemove = (ruleId: string) => {
    setSavedRules((current) => current.filter((rule) => rule.id !== ruleId));
  };

  const handleCampaignOpen = (campaign: CampaignItem) => {
    setSelectedCampaign(campaign);
    handleSetActivePage("Kampagnen");
  };

  const handleAgenticEnable = async (campaignId: string) => {
    setCampaigns((prev) =>
      prev.map((c) => c.id === campaignId || c.supabase_id === campaignId ? { ...c, agentic_enabled: true } as any : c)
    );
    await supabase.from("campaigns").update({ agentic_enabled: true }).eq("id", campaignId);
  };

  const handleAgenticStop = async (campaignId: string) => {
    // Optimistic update
    setCampaigns((current) =>
      current.map((c) => c.id === campaignId ? { ...c, agentic_enabled: false } as any : c)
    );
    await supabase
      .from("campaigns")
      .update({ agentic_enabled: false })
      .eq("id", campaignId);
  };

  const handleAgenticAnalyse = async (campaignId?: string) => {
    // Open modal IMMEDIATELY — user sees loading spinner right away
    setAgenticModalOpen(true);
    setAgenticModalLoading(true);
    setAgenticModalData(null);
    setAgenticModalApplied({});
    setAgenticTriggerLoading(true);

    // Resolve campaign object
    const targetCampaign =
      campaigns.find((c) => c.id === campaignId || c.supabase_id === campaignId) ||
      campaigns.find((c) => c.id === selectedCampaign?.id) ||
      campaigns.find((c) => c.id === lastCampaignId) ||
      campaigns.find((c) => !!(c as any).agentic_enabled) ||
      campaigns[0];

    if (!targetCampaign) {
      setAgenticModalLoading(false);
      setAgenticTriggerLoading(false);
      setAgenticModalData({
        campaign_id: "", campaign_name: "Keine Kampagne",
        gesamtanalyse: "⚠ Bitte zuerst eine Kampagne auswählen oder erstellen.",
        performance_score: 0, entscheidungen: [], naechste_analyse: "",
      });
      return;
    }

    // Use supabase_id (set during mapping) or fall back to id
    const uuid = targetCampaign.supabase_id || targetCampaign.id;

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}/.test(uuid ?? "");
    if (!isUUID) {
      console.error("[agentic] Keine UUID gefunden! id =", targetCampaign.id);
      setAgenticModalLoading(false);
      setAgenticTriggerLoading(false);
      setAgenticModalData({
        campaign_id: targetCampaign.id,
        campaign_name: targetCampaign.name,
        gesamtanalyse: "⚠ Diese Kampagne hat noch keine Supabase-UUID. Bitte die Seite neu laden — dann wird die echte UUID geladen.",
        performance_score: 0, entscheidungen: [], naechste_analyse: "",
      });
      return;
    }

    try {
      const res = await fetch("/api/agentic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaign_id: uuid, user_id: userId }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const result = {
        campaign_id: uuid,
        campaign_name: data.campaign_name ?? targetCampaign.name ?? "",
        gesamtanalyse: data.gesamtanalyse ?? "",
        performance_score: data.performance_score ?? 50,
        entscheidungen: data.entscheidungen ?? [],
        naechste_analyse: data.naechste_analyse ?? "",
        verifikation: data.verifikation ?? undefined,
      };
      setAgenticModalData(result);
      setAgenticResults((prev) => ({ ...prev, [uuid]: result }));
      loadAgenticLogs().then(setAgenticLogs).catch(() => {});
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
      setAgenticModalData({
        campaign_id: uuid,
        campaign_name: targetCampaign.name,
        gesamtanalyse: `⚠ Analyse fehlgeschlagen: ${msg}`,
        performance_score: 0, entscheidungen: [], naechste_analyse: "",
      });
    } finally {
      setAgenticModalLoading(false);
      setAgenticTriggerLoading(false);
    }
  };

  const handleAgenticApplyDecision = async (idx: number) => {
    if (!agenticModalData) return;
    const decision = agenticModalData.entscheidungen[idx];
    if (!decision) return;

    try {
      const res = await fetch("/api/agentic/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aktion: decision.aktion,
          campaign_id: agenticModalData.campaign_id,
          log_id: null,
        }),
      });
      const data = await res.json();
      if (data.campaign) {
        setCampaigns((prev) =>
          prev.map((c) => c.id === data.campaign.id ? { ...c, ...data.campaign } : c)
        );
      }
    } catch {/* optimistic — no rollback */}

    setAgenticModalApplied((prev) => ({ ...prev, [idx]: true }));
    loadAgenticLogs().then(setAgenticLogs).catch(() => {});
  };

  const handleAgenticApplyAll = async () => {
    if (!agenticModalData) return;
    for (let i = 0; i < agenticModalData.entscheidungen.length; i++) {
      if (!agenticModalApplied[i]) {
        await handleAgenticApplyDecision(i);
      }
    }
  };

  const handleAgenticApprove = async (logId: string) => {
    await updateAgenticLogStatus(logId, "angewendet").catch(() => {});
    setAgenticLogs((prev) =>
      prev.map((l) => l.id === logId ? { ...l, status: "angewendet" as const } : l)
    );
  };

  const handleCampaignStatusChange = async (campaignId: string, nextStatus: CampaignStatus) => {

    // Lokalen State sofort aktualisieren (optimistic update)
    setCampaigns((current) =>
      current.map((c) => c.id === campaignId ? { ...c, status: nextStatus } : c)
    );
    setSelectedCampaign((current) =>
      current && current.id === campaignId ? { ...current, status: nextStatus } : current
    );

    // Supabase persistieren
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return;

    const { error } = await supabase
      .from("campaigns")
      .update({ status: nextStatus })
      .eq("id", campaignId)
      .eq("user_id", session.user.id);

    if (error) setStatusMessage("⚠ Status konnte nicht gespeichert werden: " + error.message);
  };

  const handleBulkCampaignStatusChange = async (ids: string[], nextStatus: CampaignStatus) => {

    // Optimistic update
    setCampaigns((current) =>
      current.map((c) => ids.includes(c.id) ? { ...c, status: nextStatus } : c)
    );

    // Alle parallel in Supabase updaten
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return;

    const results = await Promise.all(
      ids.map((id) =>
        supabase
          .from("campaigns")
          .update({ status: nextStatus })
          .eq("id", id)
          .eq("user_id", session.user.id)
      )
    );

    const failed = results.filter((r) => r.error);
    if (failed.length > 0) {
      setStatusMessage(`⚠ ${failed.length} von ${ids.length} Updates fehlgeschlagen.`);
    }
  };

  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviteLoading(true);
    setInviteMsg(null);
    try {
      const invite = await sendTeamInvite(inviteEmail.trim(), inviteRole);
      setTeamInvites((prev) => [invite, ...prev]);
      setInviteEmail("");
      setInviteMsg({ type: "success", text: `Einladung an ${invite.invited_email} gesendet.` });
    } catch (err) {
      setInviteMsg({ type: "error", text: err instanceof Error ? err.message : "Fehler beim Einladen" });
    } finally {
      setInviteLoading(false);
    }
  };

  const handleDeleteInvite = async (inviteId: string) => {
    try {
      await deleteTeamInvite(inviteId);
      setTeamInvites((prev) => prev.filter((i) => i.id !== inviteId));
    } catch (err) {
      setStatusMessage("Einladung konnte nicht gelöscht werden: " + (err instanceof Error ? err.message : ""));
    }
  };

  const handleCreativeDelete = (id: string) => {
    // Update local state immediately — no reload from Supabase
    setCreativeLibrary((prev) => prev.filter((c) => c.id !== id));
    // Delete from Supabase in the background
    deleteCreative(id).catch((err: unknown) => {
      console.warn("[handleCreativeDelete] Supabase error:", err);
    });
  };

  const handleCreativeStatusChange = (id: string, status: import("../lib/types").CreativeStatus) => {
    setCreativeLibrary((prev) =>
      prev.map((c) => c.id === id ? { ...c, status } : c)
    );
  };

  const handleCampaignDuplicate = (campaign: CampaignItem) => {
    const duplicatedCampaign: CampaignItem = {
      ...campaign,
      id: generateCampaignId(),
      name: `${campaign.name} (Kopie)`,
      status: "Entwurf",
      created_at: new Date().toLocaleString("de-DE"),
    };

    setCampaigns((current) => [duplicatedCampaign, ...current]);
    setSelectedCampaign(duplicatedCampaign);
  };
  const renderDashboard = () => (
    <DashboardView
      campaigns={campaigns}
      creativeLibrary={creativeLibrary}
      selectedCampaign={selectedCampaign}
      form={form}
      loading={loading}
      aiAnalysisLoading={aiAnalysisLoading}
      promptStatus={promptStatus}
      aiSuggestion={aiSuggestion}
      aiHighlightedFields={aiHighlightedFields}
      response={response}
      aiRecommendations={aiRecommendations}
      savedRules={savedRules}
      submitAttempted={submitAttempted}
      lastCampaignId={lastCampaignId}
      statusMessage={statusMessage}
      currentTipp={TIPPS[tippIndex]}
      currentStep={currentStep}
      workflowStepsDone={workflowStepsDone}
      handleChange={handleChange}
      handleDeviceToggle={handleDeviceToggle}
      handleSubmit={handleSubmit}
      handleSaveDraft={handleSaveDraft}
      handleReset={handleReset}
      handleLogout={handleLogout}
      handleSaveRule={handleSaveRule}
      setAiSuggestion={setAiSuggestion}
      setActivePage={handleSetActivePage}
      onGoToCreatives={handleGoToCreatives}
      onKampagneStarten={handleKampagneStarten}
      setForm={setForm}
      handleAgenticStop={handleAgenticStop}
      handleAgenticAnalyse={handleAgenticAnalyse}
      handleAgenticEnable={handleAgenticEnable}
      onAgenticActivate={() => setAgenticActivateModal(true)}
      handleAgenticApprove={handleAgenticApprove}
      agenticLogs={agenticLogs}
      agenticResults={agenticResults}
      agenticTriggerLoading={agenticTriggerLoading}
    />
  );

  const renderKampagnen = () => (
    <KampagnenView
      campaigns={campaigns}
      selectedCampaign={selectedCampaign}
      currentPlan={currentPlan}
      handleReset={handleReset}
      handleCampaignOpen={handleCampaignOpen}
      handleCampaignStatusChange={handleCampaignStatusChange}
      handleBulkCampaignStatusChange={handleBulkCampaignStatusChange}
      handleCampaignDuplicate={handleCampaignDuplicate}
      setStatusMessage={setStatusMessage}
      onAgenticAnalyse={handleAgenticAnalyse}
      onCampaignUpdate={(updated) => {
        setCampaigns((prev) => prev.map((c) =>
          (c.id === updated.id || c.supabase_id === updated.supabase_id) ? updated : c
        ));
        setSelectedCampaign(updated);
      }}
    />
  );

  const renderCreatives = () => (
    <CreativesView
      campaigns={campaigns}
      creativeLibrary={creativeLibrary}
      selectedCreative={selectedCreative}
      creativeForm={creativeForm}
      creativeFileInputRef={creativeFileInputRef}
      fileUploadLoading={fileUploadLoading}
      creativeLoading={creativeLoading}
      loading={loading}
      lastCampaignId={lastCampaignId}
      onCreativeFormUpdate={(updates) => setCreativeForm((prev) => ({ ...prev, ...updates }))}
      handleCreativeChange={handleCreativeChange}
      handleCreativeFileChange={handleCreativeFileChange}
      onFormatDetected={(format) => setCreativeForm((prev) => ({ ...prev, format }))}
      onBundleSaved={async () => {
        const fresh = await loadCreatives();
        setCreativeLibrary(fresh);
        return fresh;
      }}
      onCreativeCampaignAssigned={(creativeId, campaignId) => {
        setCreativeLibrary((prev) =>
          prev.map((c) => c.id === creativeId ? { ...c, campaign_id: campaignId } : c)
        );
      }}
      onCreativeUpdate={(id, updates) => {
        setCreativeLibrary((prev) =>
          prev.map((c) => c.id === id ? { ...c, ...updates } : c)
        );
      }}
      handleCreativeSubmit={handleCreativeSubmit}
      handleCreativeDelete={handleCreativeDelete}
      handleCreativeStatusChange={handleCreativeStatusChange}
      setSelectedCreative={setSelectedCreative}
      handleSaveDraft={handleSaveDraft}
      handleSubmit={handleSubmit}
      setActivePage={handleSetActivePage}
      onBackToDashboard={async () => {
        // Associate any unassigned creatives (campaign_id: null) with the last campaign
        if (lastCampaignId) {
          try {
            await supabase
              .from("creatives")
              .update({ campaign_id: lastCampaignId })
              .eq("user_id", userId)
              .is("campaign_id", null);
          } catch {
            // Non-critical — continue
          }
        }
        // Reload creatives from Supabase so Dashboard filter is up-to-date
        try {
          const fresh = await loadCreatives();
          setCreativeLibrary(fresh);
        } catch {
          // Fallback: keep existing library
        }
        handleSetActivePage("Dashboard");
      }}
    />
  );

  const renderDataVerification = () => (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        <DarkCard title="Datenanbieter" subtitle="Data">
          <div className="text-3xl font-bold">3</div>
          <div className="text-sm text-slate-300 mt-2">verfügbar</div>
        </DarkCard>
        <DarkCard title="Verification Partner" subtitle="Safety">
          <div className="text-3xl font-bold">2</div>
          <div className="text-sm text-slate-300 mt-2">aktiv auswählbar</div>
        </DarkCard>
        <DarkCard title="Eigene Daten" subtitle="First Party">
          <div className="text-3xl font-bold">{form.datenanbieter === "first_party" ? "1" : "0"}</div>
          <div className="text-sm text-slate-300 mt-2">konfiguriert</div>
        </DarkCard>
        <DarkCard title="Aktives Setup" subtitle="Aktuell">
          <div className="text-sm font-semibold text-slate-100 mt-1 truncate">
            {DATENANBIETER_OPTIONEN.find((o) => o.value === form.datenanbieter)?.label || "—"}
          </div>
          <div className="text-xs text-slate-400 mt-1 truncate">
            {VERIFICATION_OPTIONEN.find((o) => o.value === form.verification)?.label || "—"}
          </div>
        </DarkCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Datenanbieter */}
        <LightCard title="Datenanbieter" subtitle="Campaign Data Setup">
          <div className="space-y-3">
            {DATENANBIETER_OPTIONEN.map((opt) => {
              const isActive = form.datenanbieter === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setForm((prev) => ({ ...prev, datenanbieter: opt.value }))}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    isActive
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                  }`}
                >
                  <div className="font-semibold text-sm">{opt.label}</div>
                  <div className={`text-xs mt-1 ${isActive ? "text-slate-300" : "text-slate-500"}`}>
                    {opt.desc}
                  </div>
                  {isActive && (
                    <div className="mt-2 text-[10px] font-bold uppercase tracking-wider text-teal-400">
                      Aktiv
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </LightCard>

        {/* Verification */}
        <DarkCard title="Verification" subtitle="Brand Safety">
          <div className="space-y-3">
            {VERIFICATION_OPTIONEN.map((opt) => {
              const isActive = form.verification === opt.value;
              return (
                <button
                  key={opt.value}
                  disabled={opt.disabled}
                  onClick={() => !opt.disabled && setForm((prev) => ({ ...prev, verification: opt.value }))}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    opt.disabled
                      ? "border-slate-700 bg-slate-800 opacity-50 cursor-not-allowed"
                      : isActive
                      ? "border-teal-500 bg-teal-900/30 text-white"
                      : "border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm">{opt.label}</span>
                    {opt.disabled && (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 border border-slate-600 rounded-full px-2 py-0.5 shrink-0">
                        Coming soon
                      </span>
                    )}
                    {isActive && !opt.disabled && (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-teal-400">Aktiv</span>
                    )}
                  </div>
                  <div className="text-xs mt-1 text-slate-400">{opt.desc}</div>
                </button>
              );
            })}
          </div>
        </DarkCard>

        {/* First Party Data */}
        <LightCard title="Eigene Daten (First Party)" subtitle="Upload / Pixel">
          {form.datenanbieter !== "first_party" ? (
            <div className="flex flex-col items-center justify-center h-40 text-center text-sm text-slate-400 space-y-2">
              <div className="text-2xl">📂</div>
              <div>Wähle links <strong className="text-slate-600">Eigene Daten</strong> als Datenanbieter, um deinen Upload zu konfigurieren.</div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">Wie möchtest du deine Daten einbinden?</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setFirstPartyMode("file")}
                  className={`rounded-2xl border p-3 text-sm font-medium text-left transition ${
                    firstPartyMode === "file"
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
                  }`}
                >
                  <div className="text-base mb-1">📄</div>
                  Datei hochladen
                  <div className="text-[10px] mt-0.5 opacity-70">CSV, max. 10 MB</div>
                </button>
                <button
                  onClick={() => setFirstPartyMode("url")}
                  className={`rounded-2xl border p-3 text-sm font-medium text-left transition ${
                    firstPartyMode === "url"
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
                  }`}
                >
                  <div className="text-base mb-1">🔗</div>
                  Pixel URL
                  <div className="text-[10px] mt-0.5 opacity-70">Tag oder Endpoint</div>
                </button>
              </div>

              {firstPartyMode === "file" && (
                <div className="space-y-2">
                  <input
                    ref={firstPartyFileRef}
                    type="file"
                    accept=".csv,.txt"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setStatusMessage(`Datei ausgewählt: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
                    }}
                  />
                  <button
                    onClick={() => firstPartyFileRef.current?.click()}
                    className="w-full rounded-2xl border-2 border-dashed border-slate-300 py-6 text-sm text-slate-500 hover:border-slate-400 hover:text-slate-700 transition text-center"
                  >
                    CSV-Datei auswählen
                    <div className="text-xs mt-1 text-slate-400">oder per Drag & Drop</div>
                  </button>
                </div>
              )}

              {firstPartyMode === "url" && (
                <div className="space-y-2">
                  <input
                    type="url"
                    placeholder="https://pixel.example.com/tag?id=..."
                    value={firstPartyPixelUrl}
                    onChange={(e) => setFirstPartyPixelUrl(e.target.value)}
                    className="w-full border border-slate-200 rounded-2xl p-3 bg-slate-50 text-sm"
                  />
                  <button
                    onClick={() => {
                      if (firstPartyPixelUrl) {
                        setStatusMessage("Pixel URL gespeichert. Wird beim nächsten Campaign-Setup verwendet.");
                      }
                    }}
                    disabled={!firstPartyPixelUrl}
                    className="w-full rounded-2xl bg-slate-900 text-white py-2.5 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    URL speichern
                  </button>
                </div>
              )}
            </div>
          )}
        </LightCard>
      </div>

      {/* SQL Comment for Supabase migration */}
      {/* -- ALTER TABLE campaigns
          --   ADD COLUMN IF NOT EXISTS first_party_url text,
          --   ADD COLUMN IF NOT EXISTS first_party_file text; */}
    </div>
  );

  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);

  const buildReportingData = () => ({
    generatedAt: new Date().toISOString(),
    filters: reportFilters,
    summary: reportData,
    campaigns: campaigns.map((c) => ({
      id: c.id, name: c.name, status: c.status,
      dsp: c.dsp, kpi: c.kpi, budget: c.budget,
    })),
    creatives: creativeLibrary.map((c) => ({
      id: c.id, name: c.name, type: c.type, format: c.format, status: c.status,
    })),
  });

  const handleReportPrint = () => window.print();

  const handleReportSave = () => {
    const data = buildReportingData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "onematic-reporting.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleReportExport = (format: string) => {
    setExportDropdownOpen(false);
    const data = buildReportingData();
    if (format === "json") { handleReportSave(); return; }
    if (format === "pdf") { window.print(); return; }
    // CSV / XLSX
    const rows = [
      ["ID", "Name", "Status", "DSP", "KPI", "Budget"],
      ...data.campaigns.map((c) => [c.id, c.name, c.status, c.dsp, c.kpi, c.budget]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `onematic-reporting.${format === "xlsx" ? "xlsx" : "csv"}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderReporting = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-6 gap-4">
        <DarkCard title="Spend" subtitle="Reporting">
          <div className="text-2xl font-bold">{reportData.spend}</div>
          <div className="text-sm text-slate-300 mt-2">im gewählten Zeitraum</div>
        </DarkCard>
        <DarkCard title="Impressions" subtitle="Reporting">
          <div className="text-2xl font-bold">{reportData.impressions}</div>
          <div className="text-sm text-slate-300 mt-2">über alle Kanäle</div>
        </DarkCard>
        <DarkCard title="Clicks" subtitle="Reporting">
          <div className="text-2xl font-bold">{reportData.clicks}</div>
          <div className="text-sm text-slate-300 mt-2">CTR stabil</div>
        </DarkCard>
        <DarkCard title="Conversions" subtitle="Reporting">
          <div className="text-2xl font-bold">{reportData.conversions}</div>
          <div className="text-sm text-slate-300 mt-2">attributionsbasiert</div>
        </DarkCard>
        <DarkCard title="Data Cost" subtitle="Reporting">
          <div className="text-2xl font-bold">{reportData.data_cost}</div>
          <div className="text-sm text-slate-300 mt-2">Data Fees</div>
        </DarkCard>
        <DarkCard title="Verification Rate" subtitle="Safety">
          <div className="text-2xl font-bold">{reportData.verification_rate}</div>
          <div className="text-sm text-slate-300 mt-2">safe impressions</div>
        </DarkCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <LightCard title="Reporting Filter" subtitle="Auswahl">
          <div className="space-y-4">
            <select
              name="zeitraum"
              value={reportFilters.zeitraum}
              onChange={handleReportFilterChange}
              className="w-full border border-slate-200 rounded-2xl p-3 bg-slate-50"
            >
              <option>Heute</option>
              <option>Gestern</option>
              <option>Letzte 7 Tage</option>
              <option>Letzte 30 Tage</option>
              <option>Dieser Monat</option>
              <option>Letztes Quartal</option>
            </select>

            <select
              name="dsp"
              value={reportFilters.dsp}
              onChange={handleReportFilterChange}
              className="w-full border border-slate-200 rounded-2xl p-3 bg-slate-50"
            >
              <option>Alle DSPs</option>
              <option>DV360</option>
              <option>The Trade Desk</option>
              <option>Xandr</option>
            </select>

            <select
              name="kanal"
              value={reportFilters.kanal}
              onChange={handleReportFilterChange}
              className="w-full border border-slate-200 rounded-2xl p-3 bg-slate-50"
            >
              <option>Alle Kanäle</option>
              <option>Display</option>
              <option>DOOH</option>
              <option>CTV</option>
              <option>Video</option>
              <option>Native</option>
            </select>

            <select
              name="kpi"
              value={reportFilters.kpi}
              onChange={handleReportFilterChange}
              className="w-full border border-slate-200 rounded-2xl p-3 bg-slate-50"
            >
              <option>CPA</option>
              <option>ROAS</option>
              <option>CTR</option>
              <option>CPM</option>
              <option>Viewability</option>
            </select>

            <select
              name="attribution"
              value={reportFilters.attribution}
              onChange={handleReportFilterChange}
              className="w-full border border-slate-200 rounded-2xl p-3 bg-slate-50"
            >
              <option>Last Click</option>
              <option>Data Driven</option>
              <option>First Touch</option>
              <option>Linear</option>
            </select>

            <button
              disabled
              className="w-full rounded-2xl bg-[#334155]/50 text-white/50 py-3 font-medium cursor-not-allowed flex items-center justify-center gap-2"
              title="Coming soon"
            >
              Reporting laden
              <span className="text-[9px] font-bold uppercase tracking-wider border border-white/20 rounded-full px-1.5 py-0.5">Soon</span>
            </button>
          </div>
        </LightCard>

        <DarkCard title="Breakdowns" subtitle="Reporting Optionen">
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              "Nach DSP",
              "Nach Kanal",
              "Nach Land",
              "Nach Device",
              "Nach Creative",
              "Nach Audience",
              "Nach Datenanbieter",
              "Nach Verification",
            ].map((item) => (
              <div key={item} className="rounded-2xl bg-slate-800 p-4">
                {item}
              </div>
            ))}
          </div>
        </DarkCard>

        <LightCard title="Exports & Ansichten" subtitle="Reporting Tools">
          <div className="space-y-3 text-sm">
            <button
              onClick={() => setStatusMessage("CSV Export vorbereitet. Backend folgt.")}
              className="w-full text-left rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:bg-slate-100"
            >
              CSV Export
            </button>
            <button
              onClick={() => setStatusMessage("PDF Report als Dummy vorbereitet. Später wird hier die echte PDF-Logik angebunden.")}
              className="w-full text-left rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:bg-slate-100"
            >
              PDF Report
            </button>
            {[
              "Executive Summary",
              "Creative Report",
              "Data Cost Report",
              "Verification Report",
              "CTV Completion Report",
              "Client Share Link",
            ].map((item) => (
              <button
                key={item}
                className="w-full text-left rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:bg-slate-100"
              >
                {item}
              </button>
            ))}
          </div>
        </LightCard>
      </div>

      {/* ── Charts ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <LightCard title="Kampagnen nach Status" subtitle="Übersicht">
          {campaigns.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-slate-400">Noch keine Daten vorhanden</div>
          ) : (() => {
            const statusCounts = ["Aktiv", "draft", "Pausiert", "Entwurf", "Beendet"].map((s) => ({
              status: s === "draft" ? "Entwurf" : s,
              count: campaigns.filter((c) => c.status === s).length,
            })).filter((d) => d.count > 0);
            return (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={statusCounts} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <XAxis dataKey="status" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                  <Bar dataKey="count" name="Kampagnen" fill="#334155" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            );
          })()}
        </LightCard>

        <LightCard title="Creatives nach Typ" subtitle="Übersicht">
          {creativeLibrary.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-slate-400">Noch keine Daten vorhanden</div>
          ) : (() => {
            const COLORS = ["#334155", "#64748b", "#94a3b8", "#cbd5e1", "#0f172a"];
            const typeCounts = ["display", "video", "native", "dooh", "ctv"].map((t) => ({
              name: t,
              value: creativeLibrary.filter((c) => c.type === t).length,
            })).filter((d) => d.value > 0);
            return (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={typeCounts} dataKey="value" nameKey="name" cx="40%" cy="50%" outerRadius={75} label={false}>
                    {typeCounts.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend layout="vertical" align="right" verticalAlign="middle"
                    formatter={(value) => <span style={{ fontSize: 12, color: "#64748b" }}>{value}</span>} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            );
          })()}
        </LightCard>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleReportPrint}
          className="flex-1 rounded-2xl border border-slate-300 bg-white text-slate-700 py-3 text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          Reporting drucken
        </button>
        <button
          onClick={handleReportSave}
          className="flex-1 rounded-2xl border border-slate-300 bg-white text-slate-700 py-3 text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          Reporting speichern
        </button>
        <div className="relative flex-1">
          <button
            onClick={() => setExportDropdownOpen((o) => !o)}
            className="w-full rounded-2xl bg-slate-900 text-white py-3 text-sm font-medium hover:opacity-90 transition-colors"
          >
            Reporting exportieren ▾
          </button>
          {exportDropdownOpen && (
            <div className="absolute bottom-full mb-2 left-0 right-0 bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden z-10">
              {[
                { label: "Als CSV exportieren", value: "csv" },
                { label: "Als PDF exportieren", value: "pdf" },
                { label: "Als XLSX exportieren", value: "xlsx" },
                { label: "Als JSON exportieren", value: "json" },
              ].map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => handleReportExport(value)}
                  className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderAIInsights = () => (
    <div suppressHydrationWarning>
      <AIInsightsView
        recommendationItems={recommendationItems}
        savedRules={savedRules}
        handleSaveRule={handleSaveRule}
        handleRuleStatusToggle={handleRuleStatusToggle}
        handleRuleRemove={handleRuleRemove}
        form={form}
        setForm={setForm}
        selectedCampaign={selectedCampaign}
        currentPlan={currentPlan}
        agenticLogs={agenticLogs}
        handleAgenticApprove={handleAgenticApprove}
        handleAgenticAnalyse={handleAgenticAnalyse}
        campaigns={campaigns}
      />
    </div>
  );


  const renderProfil = () => {
    const PLAN_CONFIG: { key: string; label: string; price: number; kampagnen: string; nutzer: string; features: string[]; recommended?: boolean }[] = [
      { key: "starter", label: "Starter", price: 39,  kampagnen: "5",          nutzer: "1",  features: ["1 Nutzer", "Bis 5 Kampagnen", "Basic AI Empfehlungen", "2% Media Fee"] },
      { key: "growth",  label: "Growth",  price: 99,  kampagnen: "20",         nutzer: "3",  features: ["Bis 3 Nutzer", "Bis 20 Kampagnen", "Erweiterte AI Empfehlungen", "Agentic Layer Basic", "2% Media Fee"] },
      { key: "pro",     label: "Pro",     price: 195, kampagnen: "Unbegrenzt", nutzer: "10", features: ["Bis 10 Nutzer", "Unbegrenzte Kampagnen", "Voller Agentic AI Layer", "Priority Support", "2% Media Fee"], recommended: true },
      { key: "extra_nutzer", label: "Zusätzlicher Nutzer", price: 10, kampagnen: "—", nutzer: "+1", features: ["Pro extra Nutzer über Plan-Limit", "Alle Rollen verfügbar", "Ab Growth-Plan"] },
    ];
    const activePlan = currentPlan || profileData.plan || "starter";
    const activePlanLimit = activePlan === "growth" ? 10 : activePlan === "pro" ? null : 3;
    const activeCampaignCount = campaigns.filter((c) => c.status === "Aktiv").length;

    return (
      <div className="space-y-6">
        {/* Sub-page tabs */}
        <div className="flex gap-2 flex-wrap">
          {(["Profil", "Billing", "Team & Rollen", "Sicherheit"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setProfileSubPage(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                profileSubPage === tab
                  ? "bg-slate-800 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ============================================================ */}
        {/* PROFIL TAB                                                    */}
        {/* ============================================================ */}
        {profileSubPage === "Profil" && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Nutzerdaten */}
            <LightCard title="Profil bearbeiten" subtitle="Persönliche Daten">
              <div className="space-y-4">
                {profileSaveMsg && (
                  <div className={`rounded-xl px-4 py-3 text-sm ${profileSaveMsg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                    {profileSaveMsg.text}
                  </div>
                )}
                {[
                  { label: "Name",    key: "name",    type: "text",  readOnly: false },
                  { label: "E-Mail",  key: "email",   type: "email", readOnly: true  },
                  { label: "Firma",   key: "firma",   type: "text",  readOnly: false },
                  { label: "Branche", key: "branche", type: "text",  readOnly: false },
                ].map(({ label, key, type, readOnly }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
                    <input
                      type={type}
                      value={(profileData as any)[key]}
                      readOnly={readOnly}
                      onChange={readOnly ? undefined : (e) => setProfileData((p) => ({ ...p, [key]: e.target.value }))}
                      className={`w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400/40 ${readOnly ? "bg-slate-50 text-slate-400 cursor-default" : ""}`}
                    />
                  </div>
                ))}
                <button
                  onClick={handleProfileSave}
                  className="w-full rounded-2xl bg-slate-900 text-white py-2.5 text-sm font-medium hover:opacity-90 transition-colors"
                >
                  Speichern
                </button>
              </div>
            </LightCard>

            {/* Rolle & Zugriff */}
            <DarkCard title="Rolle & Zugriff" subtitle="Plan & Limits">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wider text-slate-400">Plan</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white/10 text-white capitalize">{activePlan}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wider text-slate-400">Rolle</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white/10 text-white capitalize">{profileData.rolle || userRole}</span>
                </div>
                <div className="pt-2 border-t border-slate-700">
                  <div className="text-xs text-slate-400 mb-1">Aktive Kampagnen</div>
                  <div className="text-2xl font-bold">{activeCampaignCount} <span className="text-sm font-normal text-slate-400">/ {activePlanLimit ?? "∞"}</span></div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-1">Team-Mitglieder</div>
                  <div className="text-2xl font-bold">{teamMembers.length} <span className="text-sm font-normal text-slate-400">/ {profileData.plan_nutzer_limit ?? 1}</span></div>
                </div>
              </div>
            </DarkCard>

            {/* Persönliche Einstellungen */}
            <LightCard title="Persönliche Einstellungen" subtitle="Benachrichtigungen & Präferenzen">
              <div className="space-y-3 text-sm">
                {[
                  "E-Mail-Benachrichtigungen",
                  "Wöchentlicher Report",
                  "AI Insight Alerts",
                  "Sprache / Locale",
                  "Dark Mode",
                ].map((item) => (
                  <div
                    key={item}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left opacity-50 cursor-not-allowed flex items-center justify-between"
                    title="Coming soon"
                  >
                    <span>{item}</span>
                    <span className="text-[9px] font-bold uppercase tracking-wider border border-slate-300 text-slate-400 rounded-full px-1.5 py-0.5">Soon</span>
                  </div>
                ))}
              </div>
            </LightCard>
          </div>
        )}

        {/* ============================================================ */}
        {/* BILLING TAB                                                   */}
        {/* ============================================================ */}
        {profileSubPage === "Billing" && (
          <div className="space-y-6">
            {/* Row 1: Tarifkacheln */}
            <LightCard title="Tarif wählen" subtitle="Upgrade / Downgrade">
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
                {PLAN_CONFIG.map((cfg) => {
                  const isActive = activePlan === cfg.key;
                  return (
                    <div
                      key={cfg.key}
                      className={`relative rounded-2xl border p-4 flex flex-col gap-2 transition-all ${
                        isActive
                          ? "border-green-500 bg-green-50"
                          : cfg.recommended
                          ? "border-slate-800 bg-slate-900 text-white"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      {cfg.recommended && !isActive && (
                        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-600 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                          Empfohlen
                        </div>
                      )}
                      {isActive && (
                        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-green-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                          Aktuell
                        </div>
                      )}
                      <div className={`font-semibold text-sm ${cfg.recommended && !isActive ? "text-white" : "text-slate-800"}`}>{cfg.label}</div>
                      <div className={`text-2xl font-bold ${isActive ? "text-green-600" : cfg.recommended && !isActive ? "text-white" : "text-slate-900"}`}>
                        {cfg.price > 0 ? `${cfg.price} €` : "Kostenlos"}
                        {cfg.price > 0 && <span className={`text-xs font-normal ml-1 ${cfg.recommended && !isActive ? "text-slate-400" : "text-slate-400"}`}>/Monat</span>}
                      </div>
                      <ul className={`text-xs space-y-1 flex-1 ${cfg.recommended && !isActive ? "text-slate-300" : "text-slate-500"}`}>
                        {cfg.features.map((f) => (
                          <li key={f}>• {f}</li>
                        ))}
                      </ul>
                      {isActive ? (
                        <div className="text-xs font-medium text-green-600 text-center py-1.5 border border-green-300 rounded-xl bg-green-50">
                          Aktiver Plan
                        </div>
                      ) : cfg.key === "extra_nutzer" ? (
                        <div className="text-xs text-slate-400 text-center py-1.5">wird automatisch berechnet</div>
                      ) : (
                        <button
                          onClick={() => handleStripeCheckout(cfg.key)}
                          className={`text-xs rounded-xl py-1.5 transition-colors ${
                            cfg.recommended
                              ? "bg-white text-slate-900 hover:bg-slate-100"
                              : "bg-slate-900 text-white hover:opacity-90"
                          }`}
                        >
                          Upgrade
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </LightCard>

            {/* Row 2: Zahlungsmethode + Abrechnung Status + Sicherheit */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* A) Zahlungsmethode */}
              <LightCard title="Zahlungsmethode" subtitle="Kreditkarte oder PayPal">
                <div className="space-y-4">
                  {/* Tabs */}
                  <div className="flex rounded-xl border border-slate-200 overflow-hidden text-sm">
                    {(["Kreditkarte", "PayPal"] as const).map((method) => (
                      <button
                        key={method}
                        onClick={() => setBillingForm((f) => ({ ...f, payment_method: method === "Kreditkarte" ? "card" : "paypal" }))}
                        className={`flex-1 py-2 text-center font-medium transition-colors ${
                          (billingForm.payment_method === "card" && method === "Kreditkarte") ||
                          (billingForm.payment_method === "paypal" && method === "PayPal")
                            ? "bg-slate-900 text-white"
                            : "text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>

                  {billingForm.payment_method === "card" ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Kartenhalter</label>
                        <input
                          type="text"
                          placeholder="Max Mustermann"
                          value={billingForm.cardholder}
                          onChange={(e) => setBillingForm((f) => ({ ...f, cardholder: e.target.value }))}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400/40"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Kartennummer</label>
                        <input
                          type="text"
                          placeholder="•••• •••• •••• ••••"
                          value={billingForm.card_number}
                          onChange={(e) => setBillingForm((f) => ({ ...f, card_number: e.target.value }))}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400/40"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Ablaufdatum</label>
                          <input
                            type="text"
                            placeholder="MM / JJ"
                            value={billingForm.card_expiry}
                            onChange={(e) => setBillingForm((f) => ({ ...f, card_expiry: e.target.value }))}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400/40"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">CVV</label>
                          <input
                            type="password"
                            placeholder="•••"
                            value={billingForm.card_cvv}
                            onChange={(e) => setBillingForm((f) => ({ ...f, card_cvv: e.target.value }))}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400/40"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">PayPal E-Mail</label>
                      <input
                        type="email"
                        placeholder="paypal@example.com"
                        value={billingForm.paypal_email}
                        onChange={(e) => setBillingForm((f) => ({ ...f, paypal_email: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400/40"
                      />
                    </div>
                  )}

                  <button className="w-full rounded-2xl bg-slate-900 text-white py-2.5 text-sm font-medium hover:opacity-90 transition-colors">
                    Zahlungsmethode speichern
                  </button>
                </div>
              </LightCard>

              {/* B) Abrechnung Status */}
              <DarkCard title="Abrechnung Status" subtitle="Zahlungsübersicht">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Zahlungsanbieter</span>
                    <span className="font-medium">Stripe</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Letzter Checkout</span>
                    <span className="bg-green-500/20 text-green-400 text-xs font-bold px-2 py-0.5 rounded-full border border-green-500/30">Erfolgreich</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Zahlungsmethode</span>
                    <span className="font-medium">Karte via Stripe</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                    <span className="text-slate-400">Sicherheit</span>
                    <div className="flex gap-1">
                      <span className="bg-slate-700 text-slate-300 text-[10px] px-1.5 py-0.5 rounded">SSL</span>
                      <span className="bg-slate-700 text-slate-300 text-[10px] px-1.5 py-0.5 rounded">PCI</span>
                    </div>
                  </div>
                  {billingData?.periode_end && (
                    <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                      <span className="text-slate-400">Nächste Abrechnung</span>
                      <span className="font-medium">{billingData.periode_end}</span>
                    </div>
                  )}
                </div>
              </DarkCard>

              {/* C) Sicherheit Hinweis */}
              <LightCard title="Datensicherheit" subtitle="Stripe Sicherheitsstandard">
                <div className="space-y-3 text-sm text-slate-600">
                  <p>
                    Alle Zahlungen werden sicher über <strong>Stripe</strong> abgewickelt. ONEmatic speichert keine Kreditkartendaten auf eigenen Servern.
                  </p>
                  <p>
                    Stripe ist PCI DSS Level 1 zertifiziert — der höchste Sicherheitsstandard für Kartenzahlungen. Alle Übertragungen erfolgen SSL/TLS-verschlüsselt.
                  </p>
                  <div className="flex gap-2 flex-wrap pt-2">
                    {["PCI DSS Level 1", "SSL/TLS", "3D Secure", "DSGVO-konform"].map((badge) => (
                      <span key={badge} className="text-[10px] font-medium rounded-full border border-slate-300 px-2 py-0.5 text-slate-500">
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              </LightCard>
            </div>

            {/* Row 3: D) Aktueller Tarif & Kostenübersicht */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <DarkCard title="Aktueller Tarif" subtitle="Nutzung & Limits">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">Aktive Kampagnen</span>
                    <span className="font-bold">{activeCampaignCount} <span className="text-slate-400 font-normal">/ {activePlanLimit ?? "∞"}</span></span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">Aktive Nutzer</span>
                    <span className="font-bold">{teamMembers.length} <span className="text-slate-400 font-normal">/ {profileData.plan_nutzer_limit ?? 1}</span></span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                    <span className="text-slate-400 text-sm">Plan</span>
                    <span className="font-bold capitalize">{billingData?.plan || activePlan}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">Status</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${billingData?.status === "aktiv" ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-slate-700 text-slate-300"}`}>
                      {billingData?.status || "—"}
                    </span>
                  </div>
                  {billingData?.periode_end && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-sm">Nächste Abrechnung</span>
                      <span className="font-medium">{billingData.periode_end}</span>
                    </div>
                  )}
                </div>
              </DarkCard>

              <LightCard title="Kostenübersicht" subtitle="Monatliche Abrechnung">
                <div className="space-y-2 text-sm">
                  {[
                    { label: "Grundgebühr",            value: billingData?.grundgebuehr != null ? `${billingData.grundgebuehr} €` : "—" },
                    { label: "Media Budget gesamt",    value: billingData?.media_budget_gesamt != null ? `${billingData.media_budget_gesamt.toLocaleString("de-DE")} €` : "—" },
                    { label: "2 % Technologie-Fee",    value: billingData?.media_fee != null ? `${billingData.media_fee.toLocaleString("de-DE")} €` : "—" },
                    { label: "Zusätzliche Nutzer",     value: billingData?.extra_nutzer_kosten != null ? `${billingData.extra_nutzer_kosten} €` : "—" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">{label}</span>
                      <span className="font-medium text-slate-700">{value}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-2">
                    <span className="font-semibold text-slate-800">Gesamt monatlich</span>
                    <span className="text-lg font-bold text-slate-900">
                      {billingData?.gesamt_monatlich != null ? `${billingData.gesamt_monatlich.toLocaleString("de-DE")} €` : "—"}
                    </span>
                  </div>
                  <div className="pt-3">
                    <div className="text-xs font-medium text-slate-500 mb-2">Zusätzliche Nutzer buchen (à 10 €/Monat)</div>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min={0}
                        value={extraNutzerInput}
                        onChange={(e) => setExtraNutzerInput(Number(e.target.value))}
                        className="w-20 rounded-xl border border-slate-200 px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-slate-400/40"
                      />
                      <span className="text-sm text-slate-500">= {extraNutzerInput * 10} €/Monat</span>
                    </div>
                  </div>
                </div>
              </LightCard>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TEAM & ROLLEN TAB                                             */}
        {/* ============================================================ */}
        {profileSubPage === "Team & Rollen" && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <LightCard title="Team-Mitglieder" subtitle="Nutzer & Rollen">
              <div className="space-y-2">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm">
                    <div>
                      <div className="font-medium">{member.name}</div>
                      <div className="text-xs text-slate-400">{member.email}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs rounded-full bg-white border border-slate-200 px-2 py-0.5">{member.role}</span>
                      <span className={`text-xs rounded-full px-2 py-0.5 ${member.status === "aktiv" ? "bg-green-50 text-green-600 border border-green-200" : "bg-yellow-50 text-yellow-600 border border-yellow-200"}`}>
                        {member.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </LightCard>

            <LightCard title="Nutzer einladen" subtitle="Team erweitern">
              <div className="space-y-4">
                {inviteMsg && (
                  <div className={`rounded-xl px-4 py-3 text-sm ${inviteMsg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                    {inviteMsg.text}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">E-Mail-Adresse</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="nutzer@firma.de"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Rolle</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as UserRole)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400/40"
                  >
                    {["user", "analyst", "editor", "admin"].map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleSendInvite}
                  disabled={inviteLoading}
                  className="w-full rounded-2xl bg-slate-900 text-white py-2.5 text-sm font-medium hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {inviteLoading ? "Wird gesendet…" : "Einladen"}
                </button>

                {teamInvites.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Ausstehende Einladungen</div>
                    {teamInvites.map((invite) => (
                      <div key={invite.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-sm">
                        <div>
                          <div className="font-medium">{invite.invited_email}</div>
                          <div className="text-xs text-slate-400">{invite.role}</div>
                        </div>
                        <button
                          onClick={() => {
                            deleteTeamInvite(invite.id);
                            setTeamInvites((prev) => prev.filter((i) => i.id !== invite.id));
                          }}
                          className="text-xs text-red-400 hover:text-red-600 transition-colors"
                        >
                          Entfernen
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </LightCard>
          </div>
        )}

        {/* ============================================================ */}
        {/* SICHERHEIT TAB                                                */}
        {/* ============================================================ */}
        {profileSubPage === "Sicherheit" && (
          <LightCard title="Sicherheit" subtitle="Passwort & Zugang">
            <div className="space-y-3 text-sm">
              {[
                "Passwort ändern",
                "Zwei-Faktor-Authentifizierung",
                "Aktive Sessions verwalten",
                "Audit Log",
                "Konto löschen",
              ].map((item) => (
                <div
                  key={item}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left opacity-50 cursor-not-allowed flex items-center justify-between"
                  title="Coming soon"
                >
                  <span>{item}</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider border border-slate-300 text-slate-400 rounded-full px-1.5 py-0.5">Soon</span>
                </div>
              ))}
            </div>
          </LightCard>
        )}

      </div>
    );
  };

  const [wikiOpen, setWikiOpen] = useState<Record<string, boolean>>({});
  const toggleWiki = (key: string) =>
    setWikiOpen((prev) => ({ ...prev, [key]: !prev[key] }));

  const [geleseneTipps, setGeleseneTipps] = useState<number[]>(() => {
    if (typeof window !== "undefined") {
      return JSON.parse(localStorage.getItem("geleseneTipps") || "[]");
    }
    return [];
  });
  const markTippGelesen = (idx: number) => {
    if (geleseneTipps.includes(idx)) return;
    const next = [...geleseneTipps, idx];
    setGeleseneTipps(next);
    localStorage.setItem("geleseneTipps", JSON.stringify(next));
  };

  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    { role: "assistant", content: "Hallo, ich bin ONEella — deine Ansprechpartnerin für alles rund um Programmatic Advertising. Kampagnen, DSPs, Creatives, KPIs — frag mich. Alles andere liegt außerhalb meines Inventars." },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [ellaWobble, setEllaWobble] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const sendChatMessage = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    const userMsg = { role: "user" as const, content: text };
    const updated = [...chatMessages, userMsg];
    setChatMessages(updated);
    setChatInput("");
    setChatLoading(true);
    try {
      const res = await fetch("/api/support-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated }),
      });
      const data = await res.json();
      setChatMessages((prev) => [...prev, { role: "assistant", content: data.reply || "Fehler beim Laden der Antwort." }]);
    } catch {
      setChatMessages((prev) => [...prev, { role: "assistant", content: "Verbindungsfehler. Bitte versuche es erneut." }]);
    } finally {
      setChatLoading(false);
      setEllaWobble(true);
      setTimeout(() => setEllaWobble(false), 600);
    }
  };

  const HILFE_TIPPS = [
    {
      title: "First-Party-Daten einrichten",
      tipp: TIPPS[0],
      beschreibung:
        'Verbinde deine CRM- oder Kundendaten direkt in ONEmatic. Gehe zu "Daten & Verification", wähle Datentyp "CRM / First Party" und lade deine Zielgruppenliste hoch. Nach der Aktivierung steht sie dir für Targeting und Audience Enrichment zur Verfügung.',
    },
    {
      title: "Creatives optimieren — Best Practices",
      tipp: TIPPS[1],
      beschreibung:
        "Lade mindestens zwei Varianten deines Creatives hoch (z.B. verschiedene Headlines oder Bildmotive). ONEmatic erkennt automatisch bessere Performer. Nutze die IAB-Standardformate 300×250 und 728×90 als Basis — sie erzielen die höchsten Reichweiten.",
    },
    {
      title: "CTV Kampagnen Setup",
      tipp: TIPPS[2],
      beschreibung:
        'Wähle beim Kampagnen-Setup den Kanal "Display + DOOH + CTV" und aktiviere die CTV-Option. Verwende das Format "CTV – 1920×1080 Video" im Creative Upload. CTV-Placements werden über DV360 und The Trade Desk ausgespielt und erzielen hohe Completion Rates.',
    },
    {
      title: "Frequency Cap richtig setzen",
      tipp: TIPPS[3],
      beschreibung:
        "Ein zu hoher Frequency Cap führt zu Ad Fatigue und sinkender CTR. Empfehlung: 3–5 Impressionen pro Nutzer pro Woche für Display, 2–3 für CTV. Passe den Cap im Laufe der Kampagne an — ONEmatic zeigt dir die durchschnittliche Frequency in den AI Insights.",
    },
    {
      title: "Automatisierungsregeln erstellen",
      tipp: TIPPS[4],
      beschreibung:
        'Nutze den Bereich "Regeln & Automation", um KI-gesteuerte Regeln anzulegen. Beispiel: "Wenn CPA > 15 €, Bid um 10% senken". ONEmatic überprüft deine Regeln täglich und passt Gebote und Budgets automatisch an — ohne manuellen Eingriff.',
    },
    {
      title: "Lookalike Audiences aufbauen",
      tipp: TIPPS[5],
      beschreibung:
        'Lade eine Seed-Audience (z.B. deine besten Käufer) unter "Daten & Verification" hoch. ONEmatic generiert daraus automatisch eine Lookalike-Audience mit ähnlichen Nutzern. Setze die Ähnlichkeitsschwelle auf 70–80% für die beste Balance zwischen Reichweite und Relevanz.',
    },
    {
      title: "Viewability maximieren",
      tipp: TIPPS[6],
      beschreibung:
        "Wähle im Kampagnen-Setup Inventory-Typ \"Premium\" für höhere Viewability-Raten. Vermeide Below-the-Fold-Placements und setze im Creative auf starke erste Frames. Ein Viewability-Score über 70% verbessert deinen Quality Score und senkt langfristig deinen CPM.",
    },
    {
      title: "Retargeting Strategien",
      tipp: TIPPS[7],
      beschreibung:
        "Definiere Retargeting-Fenster passend zum Sales Cycle: 7 Tage für Impulskäufe, 14–30 Tage für Überlegungs-Käufe. Segmentiere nach Tiefe des Engagements — Warenkorbabbrecher bekommen eine andere Message als reine Produktseitenbesucher.",
    },
    {
      title: "DSP Auswahl — DV360 vs. The Trade Desk",
      tipp: TIPPS[8],
      beschreibung:
        "DV360 eignet sich besonders für YouTube-Integration und Google-Inventar. The Trade Desk (TTD) punktet bei Premium-Publishern und CTV. Für maximale Reichweite kannst du in ONEmatic beide DSPs parallel aktivieren — das System optimiert die Budgetverteilung automatisch.",
    },
    {
      title: "Tagesbudget und Pacing optimieren",
      tipp: TIPPS[9],
      beschreibung:
        "Verteile das Tagesbudget gleichmäßig über den Tag (\"Even Pacing\"), es sei denn, deine Zielgruppe ist nachweislich zu bestimmten Zeiten aktiver. Nutze Dayparting in Kombination mit \"Front-Loaded Pacing\" bei zeitkritischen Kampagnen wie Events oder Flash Sales.",
    },
    {
      title: "Brand Safety konfigurieren",
      tipp: TIPPS[10],
      beschreibung:
        'Aktiviere den Brand Safety Filter unter den Kampagnen-Einstellungen. Wähle aus den Kategorien, die du ausschließen möchtest (z.B. \"Adult Content\", \"Fake News\", \"Gewalt\"). ONEmatic nutzt IAS und DoubleVerify für automatisches Content Screening auf allen Placements.',
    },
    {
      title: "KI-Regeln auf CPA-Basis",
      tipp: TIPPS[11],
      beschreibung:
        "CTR-basierte Regeln optimieren Klicks, nicht Conversions. Setze deinen Ziel-CPA als primären KPI und lasse ONEmatic Gebote danach ausrichten. Kombiniere CPA-Regeln mit Viewability-Mindest-Schwellen, um Qualitäts-Traffic zu sichern ohne Conversions zu opfern.",
    },
    {
      title: "Dayparting für maximale Effizienz",
      tipp: TIPPS[12],
      beschreibung:
        "Analysiere in den AI Insights, zu welchen Tageszeiten deine Conversions gehäuft auftreten. Erhöhe Gebote in Hochzeiten um 15–25% und senke sie in schwachen Stunden. Besonders B2C-Kampagnen profitieren von Abend-Peaks (18–21 Uhr), B2B von Morgen-Peaks (8–10 Uhr).",
    },
  ];

  const WIKI_EINTRAEGE: { kategorie: string; eintraege: { term: string; erklaerung: string }[] }[] = [
    {
      kategorie: "Grundbegriffe",
      eintraege: [
        { term: "CPM (Cost per Mille)", erklaerung: "Kosten pro 1.000 Impressionen. Der Standardpreis im Programmatic Advertising. Ein CPM von 3,50 € bedeutet: du zahlst 3,50 € dafür, dass deine Anzeige 1.000 Mal angezeigt wird." },
        { term: "CTR (Click-Through-Rate)", erklaerung: "Anteil der Nutzer, die nach einer Impression geklickt haben. CTR = Klicks / Impressionen × 100. Typische Display-CTRs liegen bei 0,05–0,3%." },
        { term: "CPC (Cost per Click)", erklaerung: "Tatsächliche Kosten pro Klick. CPC = Gesamtkosten / Anzahl Klicks. Relevant bei performance-orientierten Kampagnen mit Landingpage-Ziel." },
        { term: "CPA (Cost per Action)", erklaerung: "Kosten pro definierter Conversion-Aktion (Kauf, Registrierung, Download). Der effizienteste KPI für Performance-Kampagnen mit messbarem Ziel." },
        { term: "Viewability", erklaerung: "Eine Impression gilt als viewable, wenn ≥50% des Werbemittels für ≥1 Sekunde (Display) bzw. ≥2 Sekunden (Video) sichtbar war. MRC-Standard. Zielwert: >70%." },
        { term: "Frequency Cap", erklaerung: "Maximale Anzahl an Impressionen pro Nutzer in einem definierten Zeitraum. Verhindert Ad Fatigue und schützt das Mediabudget vor Übersättigung bei einzelnen Nutzern." },
        { term: "Pacing", erklaerung: "Steuerung, wie schnell das Budget verausgabt wird. 'Even' = gleichmäßig über den Tag verteilt. 'Front-loaded' = Budget wird früh im Tag eingesetzt." },
        { term: "Attribution", erklaerung: "Zuordnung einer Conversion zur auslösenden Anzeige. Modelle: Last Click (Standard), First Click, Linear, Time Decay, Data-Driven (empfohlen für Programmatic)." },
      ],
    },
    {
      kategorie: "Formate (IAB Standard)",
      eintraege: [
        { term: "300×250 Medium Rectangle", erklaerung: "Häufigstes Display-Format. Hohe Reichweite auf Desktop und Mobile. Ideal für Retargeting und Branding. Empfohlene Dateigröße: max. 150 KB." },
        { term: "728×90 Leaderboard", erklaerung: "Klassisches Header-Format auf Desktops. Hohe Sichtbarkeit above the fold. Weniger effektiv auf Mobile. Gut für Brand Awareness Kampagnen." },
        { term: "320×50 Mobile Banner", erklaerung: "Standard-Mobilformat. Erscheint am oberen oder unteren Bildschirmrand. Geringe Störwirkung, hohe Reichweite. Ideal für App-Kampagnen." },
        { term: "160×600 Wide Skyscraper", erklaerung: "Vertikales Seitenleisten-Format. Sichtbar beim Scrollen. Gute Performance auf Content-Seiten und Nachrichtenportalen." },
        { term: "970×250 Billboard", erklaerung: "Großformatiges Desktop-Display. Hohe Aufmerksamkeit und starke Brand Impact. Nur auf Premium-Publishern verfügbar. CPM meist 2–3× höher als 300×250." },
        { term: "1920×1080 CTV Video", erklaerung: "Connected TV Full-HD Format. 15–30 Sekunden Video (non-skippable empfohlen). Hohe Completion Rates (>90%). Ausgespielt auf Smart TVs über DV360/TTD." },
        { term: "DOOH Formate", erklaerung: "Digital Out-of-Home: variiert nach Standort (Citylight: 1080×1920, Billboard: 1920×1080). Programmatic DOOH über ONEmatic erlaubt kontextuelle Trigger (Wetter, Zeit, Events)." },
      ],
    },
    {
      kategorie: "Targeting",
      eintraege: [
        { term: "Kontextuelles Targeting", erklaerung: "Anzeigen werden passend zum Inhalt der Seite ausgespielt — ohne Cookies. Beispiel: Sportartikel-Werbung auf Sportswebseiten. Datenschutzkonform und zukunftssicher (cookieless)." },
        { term: "Behaviorales Targeting", erklaerung: "Nutzersegmentierung nach beobachtetem Online-Verhalten (besuchte Seiten, Suchanfragen, Kaufhistorie). Erfordert Consent-Management. Hohe Relevanz, aber regulatorisch eingeschränkt." },
        { term: "Lookalike Audiences", erklaerung: "Algorithmisch generierte Zielgruppe, die deiner Seed-Audience (z.B. Bestandskunden) ähnelt. ONEmatic analysiert 200+ Signale. Ähnlichkeitsschwelle 60–80% empfohlen." },
        { term: "Retargeting", erklaerung: "Wiederansprache von Nutzern, die bereits mit deiner Marke oder Website interagiert haben. Segmentierung nach Engagement-Tiefe erhöht die Relevanz erheblich." },
        { term: "Geo-Targeting", erklaerung: "Geografische Eingrenzung der Ausspielplung nach Land, Region, Stadt oder Radius um einen Ort. Besonders relevant für lokale Kampagnen und OOH-Umfelder." },
        { term: "Dayparting", erklaerung: "Zeitbasiertes Targeting: Anzeigen nur zu bestimmten Tages- oder Wochenzeiten ausspielen. Kombinierbar mit Bid Adjustments für höhere Gebote in Peak-Zeiten." },
      ],
    },
    {
      kategorie: "Technologie",
      eintraege: [
        { term: "DSP (Demand-Side Platform)", erklaerung: "Software zum Kauf von Werbeinventar in Echtzeit. ONEmatic unterstützt DV360 (Google) und The Trade Desk. Der DSP bietet Targeting, Bidding und Reporting in einer Oberfläche." },
        { term: "SSP (Supply-Side Platform)", erklaerung: "Gegenstück zum DSP auf Publisher-Seite. SSPs stellen Werbeinventar für den Echtzeit-Handel bereit. Bekannte SSPs: Google Ad Manager, Magnite, PubMatic, Index Exchange." },
        { term: "RTB (Real-Time Bidding)", erklaerung: "Auktionsbasierter Echtzeit-Kauf von Werbeplätzen. Jeder Seitenaufruf triggert eine Auktion, die in <100ms abläuft. ONEmatic optimiert deine Gebote automatisch per KI." },
        { term: "Header Bidding", erklaerung: "Erweiterte RTB-Technologie: Publisher lässt mehrere DSPs gleichzeitig bieten bevor der Ad Server entscheidet. Erhöht den Wettbewerb und damit die Publisher-Einnahmen — du als Advertiser profitierst von mehr Inventar." },
        { term: "DMP (Data Management Platform)", erklaerung: "Zentrales System zur Sammlung, Verwaltung und Aktivierung von First-, Second- und Third-Party-Daten für Targeting. In ONEmatic teilweise über die 'Daten & Verification'-Integration abgedeckt." },
        { term: "Programmatic Direct", erklaerung: "Direktkauf von Werbeflächen zu garantierten Preisen und Volumen — ohne offene Auktion. Vorteil: Planungssicherheit und Premium-Inventar. Nachteil: weniger Flexibilität als RTB." },
        { term: "Brand Safety (IAS / DoubleVerify)", erklaerung: "Technologien zur Vermeidung von Werbung in unsicheren Umfeldern (Fake News, extremistische Inhalte, NSFW). ONEmatic integriert IAS und DoubleVerify als optionalen Filter-Layer." },
      ],
    },
  ];

  const renderHilfe = () => (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-slate-500">Support</p>
        <h2 className="text-3xl font-bold mt-2">Hilfe & Anleitungen</h2>
        <p className="text-sm text-slate-500 mt-1">Alles was du für den Start brauchst</p>
      </div>

      {/* Support ChatBot — ONEella */}
      <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-slate-700 to-slate-600">
          <div className="flex items-center gap-3">
            {/* ONEella Avatar small in header */}
            <svg width="28" height="28" viewBox="0 0 40 40" fill="none" className={ellaWobble ? "max-wobble" : ""}>
              <ellipse cx="20" cy="16" rx="14" ry="15" fill="#4a5568"/>
              <rect x="5" y="20" width="5" height="13" rx="2.5" fill="#4a5568"/>
              <rect x="30" y="20" width="5" height="13" rx="2.5" fill="#4a5568"/>
              <circle cx="20" cy="23" r="12" fill="#f1f5f9"/>
              <path d="M8 19 Q20 7 32 19" stroke="#0d9488" strokeWidth="2" fill="none" strokeLinecap="round"/>
              <circle cx="8" cy="20" r="2.5" fill="#0d9488"/>
              <circle cx="32" cy="20" r="2.5" fill="#0d9488"/>
              <circle cx="15.5" cy="22" r="2" fill="#1e293b"/>
              <circle cx="24.5" cy="22" r="2" fill="#1e293b"/>
              <line x1="13.5" y1="19.5" x2="13" y2="18.5" stroke="#1e293b" strokeWidth="1"/>
              <line x1="15.5" y1="19" x2="15.5" y2="18" stroke="#1e293b" strokeWidth="1"/>
              <line x1="17.5" y1="19.5" x2="18" y2="18.5" stroke="#1e293b" strokeWidth="1"/>
              <line x1="22.5" y1="19.5" x2="22" y2="18.5" stroke="#1e293b" strokeWidth="1"/>
              <line x1="24.5" y1="19" x2="24.5" y2="18" stroke="#1e293b" strokeWidth="1"/>
              <line x1="26.5" y1="19.5" x2="27" y2="18.5" stroke="#1e293b" strokeWidth="1"/>
              <circle cx="12" cy="25" r="2" fill="#cbd5e1" opacity="0.7"/>
              <circle cx="28" cy="25" r="2" fill="#cbd5e1" opacity="0.7"/>
              <path d="M15.5 28 Q20 32 24.5 28" stroke="#0d9488" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
            </svg>
            <div>
              <span className="text-sm font-bold text-white">ONEella</span>
              <span className="text-xs text-pink-100 ml-1.5">Media Advertising Expertin</span>
            </div>
            <span className="text-[10px] font-bold text-teal-700 bg-white rounded-full px-2 py-0.5">ONEella</span>
          </div>
          <button
            onClick={() =>
              setChatMessages([
                { role: "assistant", content: "Hallo, ich bin ONEella — deine Ansprechpartnerin für alles rund um Programmatic Advertising. Kampagnen, DSPs, Creatives, KPIs — frag mich. Alles andere liegt außerhalb meines Inventars." },
              ])
            }
            className="text-slate-300 hover:text-white transition text-lg leading-none"
            title="Chat leeren"
          >
            ×
          </button>
        </div>

        {/* Messages */}
        <div ref={chatContainerRef} className="h-96 overflow-y-auto px-4 py-5 space-y-4 bg-slate-50" style={{ scrollBehavior: "smooth" }}>
          {chatMessages.map((msg, i) => (
            <div key={i} className={`flex items-end gap-3 bubble-in ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              {/* Avatar */}
              {msg.role === "assistant" ? (
                <div className="shrink-0 flex flex-col items-center gap-1">
                  <svg width="36" height="36" viewBox="0 0 40 40" fill="none" className={i === chatMessages.length - 1 && ellaWobble ? "max-wobble" : ""}>
                    <ellipse cx="20" cy="16" rx="14" ry="15" fill="#4a5568"/>
                    <rect x="5" y="20" width="5" height="13" rx="2.5" fill="#4a5568"/>
                    <rect x="30" y="20" width="5" height="13" rx="2.5" fill="#4a5568"/>
                    <circle cx="20" cy="23" r="12" fill="#f1f5f9"/>
                    <path d="M8 19 Q20 7 32 19" stroke="#0d9488" strokeWidth="2" fill="none" strokeLinecap="round"/>
                    <circle cx="8" cy="20" r="2.5" fill="#0d9488"/>
                    <circle cx="32" cy="20" r="2.5" fill="#0d9488"/>
                    <circle cx="15.5" cy="22" r="2" fill="#1e293b"/>
                    <circle cx="24.5" cy="22" r="2" fill="#1e293b"/>
                    <line x1="13.5" y1="19.5" x2="13" y2="18.5" stroke="#1e293b" strokeWidth="1"/>
                    <line x1="15.5" y1="19" x2="15.5" y2="18" stroke="#1e293b" strokeWidth="1"/>
                    <line x1="17.5" y1="19.5" x2="18" y2="18.5" stroke="#1e293b" strokeWidth="1"/>
                    <line x1="22.5" y1="19.5" x2="22" y2="18.5" stroke="#1e293b" strokeWidth="1"/>
                    <line x1="24.5" y1="19" x2="24.5" y2="18" stroke="#1e293b" strokeWidth="1"/>
                    <line x1="26.5" y1="19.5" x2="27" y2="18.5" stroke="#1e293b" strokeWidth="1"/>
                    <circle cx="12" cy="25" r="2" fill="#cbd5e1" opacity="0.7"/>
                    <circle cx="28" cy="25" r="2" fill="#cbd5e1" opacity="0.7"/>
                    <path d="M15.5 28 Q20 32 24.5 28" stroke="#0d9488" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                  </svg>
                  <span className="text-[9px] font-bold text-teal-700 bg-teal-50 border border-teal-200 rounded-full px-1.5 py-0.5 leading-none">ONEella</span>
                </div>
              ) : (
                <div className="shrink-0 flex flex-col items-center gap-1">
                  <svg width="36" height="36" viewBox="0 0 40 40" fill="none">
                    <circle cx="20" cy="20" r="18" fill="#1e293b"/>
                    <circle cx="20" cy="16" r="7" fill="#94a3b8"/>
                    <ellipse cx="20" cy="33" rx="10" ry="6" fill="#94a3b8"/>
                  </svg>
                  <span className="text-[9px] font-bold text-slate-500 leading-none">Du</span>
                </div>
              )}

              {/* Bubble */}
              <div className={`relative max-w-[72%] px-4 py-3 text-sm leading-relaxed rounded-2xl ${
                msg.role === "user"
                  ? "bg-slate-800 text-white rounded-br-none"
                  : "bg-white text-slate-700 border border-slate-200 shadow-sm rounded-bl-none"
              }`}>
                {msg.content}
                {/* Bubble tail */}
                {msg.role === "assistant" && (
                  <span className="absolute -left-2 bottom-2 w-0 h-0"
                    style={{ borderTop: "8px solid transparent", borderBottom: "0px solid transparent", borderRight: "8px solid white" }}
                  />
                )}
                {msg.role === "user" && (
                  <span className="absolute -right-2 bottom-2 w-0 h-0"
                    style={{ borderTop: "8px solid transparent", borderBottom: "0px solid transparent", borderLeft: "8px solid #1e293b" }}
                  />
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {chatLoading && (
            <div className="flex items-end gap-3">
              <svg width="36" height="36" viewBox="0 0 40 40" fill="none" className="shrink-0 max-wobble">
                <ellipse cx="20" cy="16" rx="14" ry="15" fill="#4a5568"/>
                <rect x="5" y="20" width="5" height="13" rx="2.5" fill="#4a5568"/>
                <rect x="30" y="20" width="5" height="13" rx="2.5" fill="#4a5568"/>
                <circle cx="20" cy="23" r="12" fill="#f1f5f9"/>
                <path d="M8 19 Q20 7 32 19" stroke="#0d9488" strokeWidth="2" fill="none" strokeLinecap="round"/>
                <circle cx="8" cy="20" r="2.5" fill="#0d9488"/>
                <circle cx="32" cy="20" r="2.5" fill="#0d9488"/>
                <circle cx="15.5" cy="22" r="2" fill="#1e293b"/>
                <circle cx="24.5" cy="22" r="2" fill="#1e293b"/>
                <line x1="13.5" y1="19.5" x2="13" y2="18.5" stroke="#1e293b" strokeWidth="1"/>
                <line x1="15.5" y1="19" x2="15.5" y2="18" stroke="#1e293b" strokeWidth="1"/>
                <line x1="17.5" y1="19.5" x2="18" y2="18.5" stroke="#1e293b" strokeWidth="1"/>
                <line x1="22.5" y1="19.5" x2="22" y2="18.5" stroke="#1e293b" strokeWidth="1"/>
                <line x1="24.5" y1="19" x2="24.5" y2="18" stroke="#1e293b" strokeWidth="1"/>
                <line x1="26.5" y1="19.5" x2="27" y2="18.5" stroke="#1e293b" strokeWidth="1"/>
                <circle cx="12" cy="25" r="2" fill="#cbd5e1" opacity="0.7"/>
                <circle cx="28" cy="25" r="2" fill="#cbd5e1" opacity="0.7"/>
                <path d="M15.5 28 Q20 32 24.5 28" stroke="#0d9488" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
              </svg>
              <div className="bg-white border border-teal-100 shadow-sm rounded-2xl rounded-bl-none px-4 py-3">
                <span className="inline-flex gap-1.5 items-center h-4">
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="px-4 py-4 border-t border-slate-200 flex gap-3 bg-white">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") sendChatMessage(); }}
            placeholder="Stell ONEella eine Frage..."
            className="flex-1 bg-slate-50 text-slate-800 text-sm rounded-2xl px-4 py-2.5 outline-none placeholder-slate-400 border border-slate-200 focus:border-teal-400 transition"
          />
          <button
            onClick={sendChatMessage}
            disabled={!chatInput.trim() || chatLoading}
            className="bg-slate-800 text-white text-sm font-semibold px-5 py-2.5 rounded-2xl hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Senden
          </button>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="bg-white rounded-2xl px-5 py-4 border border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${(geleseneTipps.length / HILFE_TIPPS.length) * 100}%` }}
            />
          </div>
          <span className="text-sm text-slate-600 font-medium">
            {geleseneTipps.length} von {HILFE_TIPPS.length} Tipps gelesen
          </span>
        </div>
        {geleseneTipps.length === HILFE_TIPPS.length && (
          <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1">
            Alle Tipps gelesen
          </span>
        )}
        {geleseneTipps.length > 0 && geleseneTipps.length < HILFE_TIPPS.length && (
          <button
            onClick={() => {
              setGeleseneTipps([]);
              localStorage.removeItem("geleseneTipps");
            }}
            className="text-xs text-slate-400 hover:text-slate-600 transition"
          >
            Zurücksetzen
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6 items-start">
        {/* Left: Tip Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {HILFE_TIPPS.map(({ title, tipp, beschreibung }, idx) => {
            const gelesen = geleseneTipps.includes(idx);
            return (
              <div
                key={title}
                className={`bg-white rounded-3xl p-6 shadow-sm border transition ${
                  gelesen ? "border-emerald-300 ring-1 ring-emerald-200" : "border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h3 className="text-base font-bold leading-snug">{title}</h3>
                  <span className="text-[10px] uppercase tracking-widest text-slate-400 bg-slate-100 rounded-full px-3 py-1 shrink-0">
                    Tipp
                  </span>
                </div>
                <div className="text-xs text-slate-500 bg-slate-50 rounded-xl px-3 py-2 mb-3 border border-slate-200">
                  {tipp}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">{beschreibung}</p>
                <button
                  onClick={() => markTippGelesen(idx)}
                  className={`text-xs font-semibold rounded-full px-4 py-1.5 border transition ${
                    gelesen
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300 cursor-default"
                      : "bg-white text-slate-500 border-slate-200 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50"
                  }`}
                >
                  {gelesen ? "✓ Gelesen" : "Als gelesen markieren"}
                </button>
              </div>
            );
          })}
        </div>

        {/* Right: Wiki Accordion */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden xl:sticky xl:top-6">
          <div className="px-6 py-5 border-b border-slate-100">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-slate-400">Wissen</p>
            <h3 className="text-xl font-bold mt-1">Programmatic Wiki</h3>
            <p className="text-xs text-slate-500 mt-1">Begriffe, Formate und Technologien erklärt</p>
          </div>
          <div className="divide-y divide-slate-100">
            {WIKI_EINTRAEGE.map(({ kategorie, eintraege }) => {
              const catKey = `cat_${kategorie}`;
              const catOpen = wikiOpen[catKey] ?? false;
              return (
                <div key={kategorie}>
                  <button
                    onClick={() => toggleWiki(catKey)}
                    className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition"
                  >
                    <span className="text-sm font-semibold text-slate-700">{kategorie}</span>
                    <span className="text-slate-400 text-lg leading-none">{catOpen ? "−" : "+"}</span>
                  </button>
                  {catOpen && (
                    <div className="divide-y divide-slate-50">
                      {eintraege.map(({ term, erklaerung }) => {
                        const entryKey = `entry_${term}`;
                        const entryOpen = wikiOpen[entryKey] ?? false;
                        return (
                          <div key={term} className="bg-slate-50/50">
                            <button
                              onClick={() => toggleWiki(entryKey)}
                              className="w-full flex items-center justify-between px-6 py-3 text-left hover:bg-slate-100/50 transition"
                            >
                              <span className="text-sm text-slate-700 font-medium">{term}</span>
                              <span className="text-slate-400 text-sm shrink-0 ml-2">{entryOpen ? "▲" : "▼"}</span>
                            </button>
                            {entryOpen && (
                              <div className="px-6 pb-4">
                                <p className="text-sm text-slate-600 leading-relaxed">{erklaerung}</p>
                                <button
                                  onClick={() => {
                                    setForm((f) => ({ ...f, prompt: `Erkläre mir kurz: ${term}. ${erklaerung.substring(0, 60)}...` }));
                                    handleSetActivePage("Kampagnen");
                                  }}
                                  className="mt-3 text-xs text-slate-500 border border-slate-200 rounded-full px-3 py-1 hover:bg-slate-100 transition"
                                >
                                  ✨ KI-Erklärung im Prompt Center
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
    <div className="min-h-screen bg-slate-100">
      <div className="grid grid-cols-1 xl:grid-cols-[260px_1fr] min-h-screen">
        <aside className="bg-white border-r border-slate-200 p-5 flex flex-col">
          <div className="mb-6">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">
              OneTitel
            </div>
            <div className="text-2xl font-bold mt-2">ONEmatic</div>
          </div>

          <div className="space-y-2">
            {MENU_ITEMS.filter((item) => item !== "Hilfe").map((item) => (
              <button
                key={item}
                onClick={() => handleSetActivePage(item)}
                className={`w-full text-left rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  activePage === item
                    ? "bg-slate-900 text-white"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="mt-auto pt-4 border-t border-slate-200 flex gap-3">
            <a href="/impressum" target="_blank" rel="noopener noreferrer"
               className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors">
              Impressum
            </a>
            <a href="/datenschutz" target="_blank" rel="noopener noreferrer"
               className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors">
              Datenschutz
            </a>
          </div>

        </aside>

        <main className="p-4 md:p-6">
          {statusMessage && (
            <div className="mb-4 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700">
              {statusMessage}
            </div>
          )}

          {activePage === "Dashboard" && renderDashboard()}
          {activePage === "Kampagnen" && renderKampagnen()}
          {activePage === "Creatives" && renderCreatives()}
          {activePage === "Daten & Verification" && renderDataVerification()}
          {activePage === "Reporting" && renderReporting()}
          {activePage === "AI Insights" && renderAIInsights()}
          {activePage === "Profil" && renderProfil()}
          {activePage === "Hilfe" && renderHilfe()}
        </main>
      </div>

    </div>

    {/* ============================================================ */}
    {/* AGENTIC ANALYSIS MODAL                                        */}
    {/* ============================================================ */}
    {agenticModalOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold">⚡ Agentic AI Analyse</h2>
              <button
                onClick={() => setAgenticModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-xl leading-none font-light"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
              {agenticModalLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
                  <p className="text-sm text-slate-500">Agent analysiert…</p>
                </div>
              ) : agenticModalData ? (
                <>
                  {/* Campaign name */}
                  <div className="text-xs text-slate-400 font-medium">Kampagne: <span className="text-slate-700">{agenticModalData.campaign_name}</span></div>

                  {/* Gesamtanalyse */}
                  <div className="rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3">
                    <p className="text-sm text-slate-700 leading-6">{agenticModalData.gesamtanalyse}</p>
                  </div>

                  {/* Performance Score */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                      <span>Performance Score</span>
                      <span className={`font-bold ${agenticModalData.performance_score >= 70 ? "text-emerald-600" : agenticModalData.performance_score >= 40 ? "text-amber-600" : "text-red-600"}`}>
                        {agenticModalData.performance_score}/100
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div
                        className={`h-2 rounded-full transition-all ${agenticModalData.performance_score >= 70 ? "bg-emerald-500" : agenticModalData.performance_score >= 40 ? "bg-amber-500" : "bg-red-500"}`}
                        style={{ width: `${agenticModalData.performance_score}%` }}
                      />
                    </div>
                  </div>

                  {/* Claude quality score — shown when verifikation available */}
                  {agenticModalData.verifikation && (
                    <div className="rounded-2xl bg-slate-900 text-white px-4 py-3 flex items-center justify-between gap-4">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-0.5">Claude Verifikation</div>
                        <p className="text-xs text-slate-300 leading-5">{agenticModalData.verifikation.gesamtbewertung}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-2xl font-bold text-emerald-400">{agenticModalData.verifikation.qualitaets_score}</div>
                        <div className="text-[10px] text-slate-400">Qualität</div>
                      </div>
                    </div>
                  )}

                  {/* Decisions */}
                  <div className="space-y-3">
                    {agenticModalData.entscheidungen.map((d, idx) => {
                      const isApplied = !!agenticModalApplied[idx];
                      const hasVerification = d.verifiziert !== undefined;
                      const ROUTINE_LABELS: Record<string, string> = {
                        budget_optimierung: "Budget Optimierung",
                        creative_rotation: "Creative Rotation",
                        dsp_shift: "DSP Performance",
                        benchmark_check: "KPI Benchmark",
                        referenz_vergleich: "Referenzvergleich",
                      };
                      return (
                        <div
                          key={idx}
                          className={`rounded-2xl border overflow-hidden transition-all ${isApplied ? "bg-emerald-50 border-emerald-200" : "bg-white border-slate-200"}`}
                        >
                          {/* Card header */}
                          <div className="flex items-center gap-2 px-4 pt-3 pb-2">
                            <span className={`text-[10px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5 ${
                              d.prioritaet === "hoch" ? "bg-red-100 text-red-700" :
                              d.prioritaet === "mittel" ? "bg-amber-100 text-amber-700" :
                              "bg-slate-100 text-slate-600"
                            }`}>{d.prioritaet}</span>
                            <span className="text-xs font-semibold text-slate-700 flex-1">
                              {ROUTINE_LABELS[d.routine] ?? d.routine.replace(/_/g, " ")}
                            </span>
                            {hasVerification && (
                              d.verifiziert
                                ? <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">✓ Verifiziert</span>
                                : <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">⚠ Überarbeitet</span>
                            )}
                          </div>

                          {/* Two-column body */}
                          <div className={`grid divide-x divide-slate-100 ${hasVerification ? "grid-cols-2" : "grid-cols-1"}`}>
                            {/* Left: GPT-4o */}
                            <div className="px-4 pb-3 space-y-1.5">
                              {hasVerification && (
                                <div className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold mb-1">GPT-4o Analyse</div>
                              )}
                              <p className="text-xs text-slate-600 leading-5">{d.analyse}</p>
                              <div className="rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-1.5 text-[11px] text-slate-700">
                                <span className="font-medium">Aktion: </span>{d.entscheidung}
                              </div>
                              {d.erwartete_verbesserung && (
                                <p className="text-[11px] text-emerald-600">📈 {d.erwartete_verbesserung}</p>
                              )}
                            </div>

                            {/* Right: Claude verification */}
                            {hasVerification && (
                              <div className="px-4 pb-3 space-y-1.5">
                                <div className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Claude Verifikation</div>
                                {d.anmerkung && (
                                  <p className="text-xs text-slate-600 leading-5">{d.anmerkung}</p>
                                )}
                                {!d.verifiziert && d.alternative && (
                                  <div className="rounded-lg bg-amber-50 border border-amber-100 px-2.5 py-1.5 text-[11px] text-amber-800">
                                    <span className="font-medium">Alternative: </span>{d.alternative}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="px-4 pb-3">
                            {isApplied ? (
                              <div className="text-xs font-bold text-emerald-600">✓ Übernommen</div>
                            ) : (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleAgenticApplyDecision(idx)}
                                  className="flex-1 rounded-xl bg-slate-900 text-white py-2 text-xs font-medium hover:opacity-90 transition"
                                >
                                  Übernehmen ✓
                                </button>
                                <button
                                  onClick={() => setAgenticModalApplied((prev) => ({ ...prev, [idx]: true }))}
                                  className="flex-1 rounded-xl border border-slate-200 text-slate-500 py-2 text-xs font-medium hover:bg-slate-50 transition"
                                >
                                  Ablehnen ✗
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {agenticModalData.naechste_analyse && (
                    <p className="text-xs text-slate-400 text-center">Nächste Analyse empfohlen: {agenticModalData.naechste_analyse}</p>
                  )}
                </>
              ) : null}
            </div>

            {/* Footer */}
            {agenticModalData && !agenticModalLoading && (
              <div className="border-t border-slate-100 px-6 py-4 flex gap-3">
                <button
                  onClick={handleAgenticApplyAll}
                  className="flex-1 rounded-2xl bg-slate-900 text-white py-2.5 text-sm font-bold hover:opacity-90 transition"
                >
                  Alle übernehmen
                </button>
                <button
                  onClick={() => setAgenticModalOpen(false)}
                  className="flex-1 rounded-2xl border border-slate-200 text-slate-600 py-2.5 text-sm font-medium hover:bg-slate-50 transition"
                >
                  Schließen
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    {/* ============================================================ */}
    {/* AGENTIC ACTIVATION MODAL                                      */}
    {/* ============================================================ */}
    {agenticActivateModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
          <div className="px-8 pt-7 pb-6">
            <h2 className="text-xl font-bold mb-1">⚡ Agentic Optimization</h2>
            <p className="text-sm text-slate-500 mb-5">Automatische Kampagnen-Optimierung aktivieren</p>

            <p className="text-sm text-slate-700 mb-4">
              Agentic Optimization überwacht deine Kampagne kontinuierlich und nimmt automatisch folgende Anpassungen vor:
            </p>

            <ul className="space-y-2 mb-6">
              {[
                "Bid Adjustment +/- 20% basierend auf CTR",
                "Frequency Cap Anpassung bei Overdelivery",
                "Tagesbudget-Verschiebung bei Performance-Peaks",
                "Automatische Pause bei Brand Safety Verstößen",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            {(selectedCampaign || lastCampaignId) && (
              <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs text-slate-500 mb-6">
                Kampagne: <span className="font-medium text-slate-700">
                  {selectedCampaign?.name ?? lastCampaignId}
                </span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={async () => {
                  const id = (selectedCampaign as any)?.supabase_id ?? selectedCampaign?.id ?? lastCampaignId;
                  if (id) await handleAgenticEnable(id);
                  setAgenticActivateModal(false);
                  setStatusMessage("✓ Agentic Layer aktiviert — Analyse unter AI Insights verfügbar.");
                }}
                className="flex-1 rounded-2xl bg-slate-900 text-white py-3 text-sm font-bold hover:opacity-90 transition"
              >
                Aktivieren
              </button>
              <button
                onClick={() => setAgenticActivateModal(false)}
                className="flex-1 rounded-2xl border border-slate-200 text-slate-600 py-3 text-sm font-medium hover:bg-slate-50 transition"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}