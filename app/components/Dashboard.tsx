"use client";

import { useState, useCallback } from "react";
import type { CampaignItem, CreativeLibraryItem, SavedRuleItem, CampaignForm, N8nWebhookResponse, Recommendation, AgenticLog, AgenticResult } from "../lib/types";
import type { MediaControlsSuggestion } from "../lib/types";
import {
  ZIEL_OPTIONEN, KPI_OPTIONEN, DATENANBIETER_OPTIONEN, VERIFICATION_OPTIONEN,
  DSP_OPTIONEN, MARKT_OPTIONEN, KANAL_OPTIONEN, AUTOMATIONS_OPTIONEN,
  PACING_OPTIONEN, BID_STRATEGY_OPTIONEN, FREQ_CAP_ZEITRAUM_OPTIONEN, DEVICE_OPTIONEN,
} from "../lib/constants";
import { DarkCard, LightCard, CopyIdField } from "./ui";
import { updateAgenticEnabled } from "../lib/api";

type Props = {
  campaigns: CampaignItem[];
  creativeLibrary: CreativeLibraryItem[];
  selectedCampaign: CampaignItem | null;
  form: CampaignForm;
  loading: boolean;
  aiAnalysisLoading: boolean;
  promptStatus: "idle" | "expanding" | "analyzing" | "done";
  aiSuggestion: { begruendung: string; fields: string[] } | null;
  aiHighlightedFields: string[];
  response: N8nWebhookResponse | null;
  aiRecommendations: Recommendation[];
  savedRules: SavedRuleItem[];
  submitAttempted: boolean;
  lastCampaignId: string | null;
  statusMessage: string;
  currentTipp: string;
  currentStep: number;
  workflowStepsDone: boolean[];
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleDeviceToggle: (device: string) => void;
  handleSubmit: () => void;
  handleSaveDraft: () => void;
  handleReset: () => void;
  handleLogout: () => void;
  handleSaveRule: (item: string) => void;
  setAiSuggestion: (s: { begruendung: string; fields: string[] } | null) => void;
  setActivePage: (page: string) => void;
  onGoToCreatives?: () => void;
  onKampagneStarten?: () => void;
  setForm: React.Dispatch<React.SetStateAction<CampaignForm>>;
  handleAgenticStop: (campaignId: string) => void;
  handleAgenticAnalyse: (campaignId?: string) => void;
  handleAgenticEnable: (campaignId: string) => void;
  onAgenticActivate: () => void;
  handleAgenticApprove: (logId: string) => void;
  agenticLogs: AgenticLog[];
  agenticResults: Record<string, AgenticResult>;
  agenticTriggerLoading: boolean;
};

// Budget-Formatierung: "5000" → "5.000,00 €", Strip beim Ändern
function formatBudget(raw: string): string {
  const n = parseFloat(String(raw).replace(/[.€\s]/g, "").replace(",", "."));
  if (isNaN(n) || n === 0) return raw;
  return n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}
function stripBudget(formatted: string): string {
  // Remove "€", spaces, thousand-dots, replace decimal comma with dot
  return formatted.replace(/[€\s]/g, "").replace(/\.(?=\d{3})/g, "").replace(",", ".");
}

export default function Dashboard({
  campaigns,
  creativeLibrary,
  selectedCampaign,
  form,
  loading,
  aiAnalysisLoading,
  promptStatus,
  aiSuggestion,
  aiHighlightedFields,
  response,
  aiRecommendations,
  savedRules,
  submitAttempted,
  lastCampaignId,
  statusMessage,
  currentTipp,
  currentStep,
  workflowStepsDone,
  handleChange,
  handleDeviceToggle,
  handleSubmit,
  handleSaveDraft,
  handleReset,
  handleLogout,
  handleSaveRule,
  setAiSuggestion,
  setActivePage,
  onGoToCreatives,
  onKampagneStarten,
  setForm,
  handleAgenticStop,
  handleAgenticAnalyse,
  handleAgenticEnable: _handleAgenticEnable,
  onAgenticActivate,
  handleAgenticApprove,
  agenticLogs,
  agenticResults,
  agenticTriggerLoading,
}: Props) {
  const [budgetFocused, setBudgetFocused] = useState(false);
  const [appliedRec, setAppliedRec] = useState<Record<number, boolean>>({});
  const [expandedAgenticIds, setExpandedAgenticIds] = useState<string[]>([]);

  const MIN_DAILY_BUDGET = 10;

  const laufzeitTage = (() => {
    if (form.campaign_start && form.campaign_end) {
      const start = new Date(form.campaign_start);
      const end = new Date(form.campaign_end);
      const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return diff > 0 ? diff : 0;
    }
    return 0;
  })();

  const budgetNum = Number(form.budget) || 0;
  const minGesamtbudget = laufzeitTage > 0 ? laufzeitTage * MIN_DAILY_BUDGET : MIN_DAILY_BUDGET;
  const budgetBelowMin = budgetNum > 0 && laufzeitTage > 0 && (budgetNum / laufzeitTage) < MIN_DAILY_BUDGET;

  const budgetDailyNum = Number(form.budget_daily) || 0;
  const budgetDailyBelowMin = budgetDailyNum > 0 && budgetDailyNum < MIN_DAILY_BUDGET;

  const openRecommendationCount = Math.max(
    aiRecommendations.length - savedRules.filter((rule) => rule.status === "aktiv").length,
    0
  );

  const handleApplyRec = (index: number, rec: Recommendation) => {
    if (rec.feld && rec.wert !== undefined) {
      setForm((prev) => ({ ...prev, [rec.feld]: rec.wert }));
    }
    setAppliedRec((prev) => ({ ...prev, [index]: true }));
  };

  // Wenn Prompt ausgefüllt (>10 Zeichen) → KI übernimmt objective/kpi/budget → kein Pflichtfeld
  const hasPrompt = (form.prompt ?? "").length > 10;

  const ai = (f: string) => aiHighlightedFields.includes(f);
  const fc = (f: string, extra = "") =>
    `w-full border rounded-2xl p-3 bg-slate-50 text-sm transition-colors ${extra} ${
      ai(f) ? "border-indigo-400 ring-2 ring-indigo-200" : "border-slate-200"
    }`;
  const lb = (text: string, f: string) => (
    <label className="text-xs font-medium text-slate-600 mb-1 flex items-center gap-1.5">
      {text}
      {ai(f) && (
        <span className="rounded-full bg-indigo-100 text-indigo-700 text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-wide">KI</span>
      )}
    </label>
  );

  return (
    <div className="space-y-2">
      {/* Hero Panel */}
      <div className="rounded-[28px] border border-slate-300 bg-[#e7edf2] p-6 shadow-sm overflow-hidden">
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="flex items-center gap-3">
              <p className="text-xs font-semibold tracking-[0.22em] uppercase text-slate-600">
                AI Programmatic Advertising for EveryONE
              </p>
              <span className="rounded-full bg-slate-200 text-slate-700 text-[11px] px-2 py-1 border border-slate-300">
                LIVE
              </span>
            </div>
            <h1 className="text-3xl font-bold mt-3">Kampagnensteuerung & AI Setup</h1>
            <p className="text-sm text-slate-500 mt-1">Basierend auf deinen Defaults</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-slate-700 bg-white border border-slate-300 px-3 py-1.5 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Abmelden
            </button>
            <button
              onClick={() => setActivePage("Hilfe")}
              className="text-sm font-medium text-slate-700 bg-white border border-slate-300 px-3 py-1.5 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Hilfe
            </button>
          </div>
        </div>

        {statusMessage && (
          <div className="mt-4 rounded-2xl bg-white border border-slate-300 px-4 py-3 text-sm text-slate-700">
            {statusMessage}
          </div>
        )}

        {lastCampaignId && (
          <div className="mt-4 rounded-2xl bg-slate-900 px-4 py-3 space-y-1.5">
            <div className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Letzte Campaign ID</div>
            <CopyIdField value={lastCampaignId} />
          </div>
        )}

        <div className="flex flex-wrap gap-2 mt-5">
          {[
            "1. Kampagne definieren",
            "2. Analyse starten",
            "3. Creatives hochladen",
            "4. Daten & Verification ergänzen",
          ].map((step) => (
            <span key={step} className="rounded-full bg-white border border-slate-300 px-3 py-1 text-xs text-slate-700">
              {step}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between gap-4 mt-4 mb-1">
          <div
            className="rounded-2xl bg-slate-900 text-white py-2.5 px-4 text-sm font-medium"
            style={{ overflow: "hidden", flex: 1, marginRight: 0 }}
          >
            <span className="ticker-animation text-slate-300">ONEmatic Tipp: {currentTipp}</span>
          </div>
          <button
            onClick={handleReset}
            className="shrink-0 rounded-2xl bg-slate-900 text-white py-2.5 px-4 text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            + Neue Kampagne
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        <DarkCard title="Aktive Kampagnen" subtitle="Übersicht">
          {(() => {
            const aktiveCount = campaigns.filter((c) => c.status === "Aktiv").length;
            const now = Date.now();
            const threeDays = 3 * 24 * 60 * 60 * 1000;
            const ablaufend = campaigns.filter((c) => {
              if (!((c as any).campaign_end) || c.status !== "Aktiv") return false;
              const diff = new Date((c as any).campaign_end).getTime() - now;
              return diff > 0 && diff < threeDays;
            }).length;
            return (
              <>
                <div className="text-3xl font-bold">{aktiveCount}</div>
                <div className="text-sm text-slate-300 mt-2">bereit für Detailansicht & Verknüpfung</div>
                {ablaufend > 0 && (
                  <div className="mt-2 rounded-full bg-amber-400 text-amber-900 text-[10px] font-semibold px-2 py-0.5 inline-block">
                    ⚠ {ablaufend} Kampagne{ablaufend !== 1 ? "n" : ""} laufen bald ab
                  </div>
                )}
              </>
            );
          })()}
        </DarkCard>
        <DarkCard title="Datenquellen" subtitle="Data Stack">
          <div className="text-3xl font-bold">—</div>
          <div className="text-sm text-slate-300 mt-2">aktiv angebunden</div>
        </DarkCard>
        <DarkCard title="Verification" subtitle="Safety">
          <div className="text-3xl font-bold">{form.verification || "—"}</div>
          <div className="text-sm text-slate-300 mt-2">für neue Setups</div>
        </DarkCard>
        <DarkCard title="Offene Empfehlungen" subtitle="AI">
          <div className="text-3xl font-bold">{openRecommendationCount}</div>
          <div className="text-sm text-slate-300 mt-2">bereit zur Übernahme</div>
        </DarkCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
        {/* ── Linke Spalte (2/3) ───────────────────────────────── */}
        <div className="xl:col-span-2 space-y-6">

          {/* Prompt Center */}
          <section className="bg-white rounded-3xl shadow-sm border border-slate-200 px-6 pt-6 pb-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-xs font-semibold tracking-[0.2em] uppercase text-slate-600">Kampagnen-Setup</p>
                <h2 className="text-3xl font-bold mt-2">Prompt Center</h2>
              </div>
              <span className="rounded-full bg-slate-100 text-slate-700 text-xs px-3 py-1 border border-slate-200">
                Workflow aktiv
              </span>
            </div>

            {/* Fortschrittsanzeige */}
            <div className="flex items-center gap-2 mb-5 overflow-x-auto">
              {[
                { step: 1, label: "Kampagne & Prompt" },
                { step: 2, label: "DSP Setup" },
                { step: 3, label: "AI Analyse starten" },
                { step: 4, label: "Creatives hochladen" },
              ].map(({ step, label }, i) => (
                <div key={step} className="flex items-center gap-2 shrink-0">
                  <div className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium border transition ${
                    step < currentStep
                      ? "bg-emerald-100 border-emerald-300 text-emerald-800"
                      : step === currentStep
                      ? "bg-slate-900 border-slate-900 text-white"
                      : "bg-slate-50 border-slate-200 text-slate-400"
                  }`}>
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      step < currentStep ? "bg-emerald-500 text-white" : step === currentStep ? "bg-white text-slate-900" : "bg-slate-200 text-slate-500"
                    }`}>{step < currentStep ? "✓" : step}</span>
                    {label}
                  </div>
                  {i < 3 && <div className="w-4 h-px bg-slate-200 shrink-0" />}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="relative">
                {ai("kampagnenname") && (
                  <span className="absolute -top-2 right-2 z-10 rounded-full bg-indigo-100 text-indigo-700 text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-wide">KI</span>
                )}
                <input
                  name="kampagnenname"
                  placeholder="Kampagnenname"
                  value={form.kampagnenname}
                  onChange={handleChange}
                  className={`w-full border rounded-2xl p-3 bg-slate-50 transition-colors ${
                    submitAttempted && !hasPrompt && !form.kampagnenname
                      ? "border-red-400"
                      : ai("kampagnenname")
                      ? "border-indigo-400 ring-2 ring-indigo-200"
                      : "border-slate-200"
                  }`}
                  /* Pflichtfeld nur ohne Prompt — KI generiert den Namen sonst automatisch */
                />
                {submitAttempted && !hasPrompt && !form.kampagnenname && (
                  <p className="text-red-500 text-xs mt-1">Pflichtfeld — oder Kampagnen-Brief oben ausfüllen</p>
                )}
              </div>
              <div className="relative">
                {ai("ziel") && (
                  <span className="absolute -top-2 right-2 z-10 rounded-full bg-indigo-100 text-indigo-700 text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-wide">KI</span>
                )}
                <select
                  name="ziel"
                  value={form.ziel}
                  onChange={handleChange}
                  className={`w-full border rounded-2xl p-3 bg-slate-50 transition-colors ${
                    submitAttempted && !hasPrompt && !form.ziel
                      ? "border-red-400"
                      : ai("ziel")
                      ? "border-indigo-400 ring-2 ring-indigo-200"
                      : "border-slate-200"
                  } ${!form.ziel ? "text-slate-400" : "text-slate-900"}`}
                >
                  <option value="" disabled>Kampagnenziel</option>
                  {ZIEL_OPTIONEN.map((ziel) => <option key={ziel} value={ziel}>{ziel}</option>)}
                </select>
                {submitAttempted && !hasPrompt && !form.ziel && (
                  <p className="text-red-500 text-xs mt-1">Bitte Kampagnenziel auswählen</p>
                )}
              </div>
              {/* Budget + KPI — always side by side */}
              <div className="md:col-span-2 grid grid-cols-2 gap-3">
                <div className="relative">
                  {ai("budget") && (
                    <span className="absolute -top-2 right-2 z-10 rounded-full bg-indigo-100 text-indigo-700 text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-wide">KI</span>
                  )}
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-xs font-medium text-slate-600">Budget</span>
                    <div className="relative group inline-block">
                      <span className="cursor-help text-slate-400 text-xs leading-none">ⓘ</span>
                      <div className="hidden group-hover:block absolute left-0 top-full mt-1 z-20 w-64 bg-slate-900 text-white text-xs rounded-xl px-3 py-2 shadow-lg leading-relaxed pointer-events-none">
                        ONEmatic setzt ein Mindest-Tagesbudget von 10 € voraus um eine effektive Kampagnenauslieferung zu gewährleisten. Bei kürzerer Laufzeit erhöht sich das empfohlene Tagesbudget entsprechend.
                      </div>
                    </div>
                  </div>
                  <input
                    name="budget"
                    type="text"
                    inputMode="numeric"
                    placeholder="z.B. 5.000 €"
                    value={budgetFocused ? form.budget : formatBudget(form.budget)}
                    onFocus={() => setBudgetFocused(true)}
                    onBlur={() => setBudgetFocused(false)}
                    onChange={(e) => {
                      const raw = stripBudget(e.target.value);
                      handleChange({ ...e, target: { ...e.target, name: "budget", value: raw } } as React.ChangeEvent<HTMLInputElement>);
                    }}
                    className={`w-full border rounded-2xl p-3 bg-slate-50 transition-colors ${
                      budgetBelowMin
                        ? "border-red-400 ring-2 ring-red-100"
                        : submitAttempted && !hasPrompt && !form.budget
                        ? "border-red-400"
                        : ai("budget")
                        ? "border-indigo-400 ring-2 ring-indigo-200"
                        : "border-slate-200"
                    }`}
                  />
                  {budgetBelowMin && (
                    <p className="text-red-500 text-xs mt-1">
                      Mindestbudget: {MIN_DAILY_BUDGET} € / Tag (bei {laufzeitTage} Tagen Laufzeit = min. {minGesamtbudget} €)
                    </p>
                  )}
                  {submitAttempted && !hasPrompt && !form.budget && !budgetBelowMin && (
                    <p className="text-red-500 text-xs mt-1">Bitte Budget eingeben</p>
                  )}
                </div>
                <div className="relative">
                  {ai("kpi") && (
                    <span className="absolute -top-2 right-2 z-10 rounded-full bg-indigo-100 text-indigo-700 text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-wide">KI</span>
                  )}
                  <div className="mb-1">
                    <span className="text-xs font-medium text-slate-600">KPI</span>
                  </div>
                  <select
                    name="kpi"
                    value={form.kpi}
                    onChange={handleChange}
                    className={`w-full border rounded-2xl p-3 bg-slate-50 transition-colors ${
                      submitAttempted && !hasPrompt && !form.kpi
                        ? "border-red-400"
                        : ai("kpi")
                        ? "border-indigo-400 ring-2 ring-indigo-200"
                        : "border-slate-200"
                    } ${!form.kpi ? "text-slate-400" : "text-slate-900"}`}
                  >
                    <option value="" disabled>KPI auswählen</option>
                    {KPI_OPTIONEN.map((kpi) => <option key={kpi} value={kpi}>{kpi}</option>)}
                  </select>
                  {submitAttempted && !hasPrompt && !form.kpi && (
                    <p className="text-red-500 text-xs mt-1">Bitte KPI auswählen</p>
                  )}
                </div>
              </div>
              <select
                name="datenanbieter"
                value={form.datenanbieter}
                onChange={handleChange}
                className={`border border-slate-200 rounded-2xl p-3 bg-slate-50 ${!form.datenanbieter ? "text-slate-400" : "text-slate-900"}`}
              >
                <option value="" disabled>Datenanbieter auswählen</option>
                {DATENANBIETER_OPTIONEN.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <select
                name="verification"
                value={form.verification}
                onChange={handleChange}
                className={`border border-slate-200 rounded-2xl p-3 bg-slate-50 ${!form.verification ? "text-slate-400" : "text-slate-900"}`}
              >
                <option value="" disabled>Verification auswählen</option>
                {VERIFICATION_OPTIONEN.map((opt) => (
                  <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                    {opt.label}{opt.disabled ? " (Coming soon)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative mb-4">
              {promptStatus === "done" && (
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-semibold px-2.5 py-0.5 border border-indigo-200">
                    ✨ KI-generierter Brief — du kannst ihn anpassen
                  </span>
                </div>
              )}
              <textarea
                name="prompt"
                rows={6}
                placeholder={"Beschreibe kurz deine Kampagne – zum Beispiel: Zielgruppe, Budget, Laufzeit und was du erreichen möchtest.\n\nBeispiel: 'Mütter zwischen 25-45 Jahren, 5.000 €, Oktober 2026, Ziel: Markenbekanntheit steigern.'\n\nUnsere KI erstellt daraus automatisch einen professionellen Kampagnen-Brief und füllt alle Einstellungen als Vorschlag für dich aus."}
                value={form.prompt}
                onChange={handleChange}
                className={`border rounded-2xl p-4 bg-slate-50 w-full min-h-[140px] transition-colors ${
                  promptStatus === "done"
                    ? "border-indigo-300 ring-2 ring-indigo-100"
                    : "border-slate-200"
                }`}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSaveDraft}
                className="flex-1 rounded-2xl border border-slate-300 bg-white text-slate-700 py-3 font-medium hover:bg-slate-50 transition-colors"
              >
                Als Entwurf speichern
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || promptStatus === "expanding" || promptStatus === "analyzing"}
                className="flex-1 rounded-2xl bg-[#334155] text-white py-3 font-medium hover:opacity-90 disabled:opacity-60 transition-colors"
              >
                {promptStatus === "expanding"
                  ? "✨ Kampagnen-Brief wird erstellt..."
                  : promptStatus === "analyzing"
                  ? "⚡ Media Controls werden optimiert..."
                  : "Übernehmen & weiter"}
              </button>
            </div>
          </section>

          {/* Media Controls */}
          <LightCard title="Media Controls" subtitle="Standard-DSP-Setup">
            {/* Zweistufige Loading-Anzeige */}
            {(promptStatus === "expanding" || promptStatus === "analyzing") && (
              <div className="flex items-center gap-3 rounded-2xl bg-indigo-50 border border-indigo-200 px-4 py-3 mb-4 text-sm text-indigo-700">
                <svg className="animate-spin h-4 w-4 text-indigo-500 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                {promptStatus === "expanding"
                  ? "✨ Kampagnen-Brief wird erstellt…"
                  : "⚡ Media Controls werden optimiert…"}
              </div>
            )}

            {/* KI-Vorschlag Banner */}
            {aiSuggestion && !aiAnalysisLoading && (
              <div className="rounded-2xl bg-indigo-50 border border-indigo-200 px-4 py-3 mb-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">✨</span>
                    <span className="text-sm font-semibold text-indigo-800">KI-Vorschlag basierend auf deinem Prompt</span>
                  </div>
                  <button
                    onClick={() => setAiSuggestion(null)}
                    className="text-indigo-400 hover:text-indigo-700 text-lg leading-none shrink-0"
                    aria-label="Schließen"
                  >×</button>
                </div>
                <p className="text-xs text-indigo-600 mt-1">Du kannst alle Werte jederzeit anpassen.</p>
                {aiSuggestion.begruendung && (
                  <p className="text-xs text-indigo-700 mt-2 italic border-t border-indigo-200 pt-2">
                    {aiSuggestion.begruendung}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-5">
              {/* DSP + Markt + Kanal + Automationsmodus */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  {lb("DSP", "dsp")}
                  <select name="dsp" value={form.dsp} onChange={handleChange} className={fc("dsp")}>
                    {DSP_OPTIONEN.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  {lb("Markt", "markt")}
                  <select name="markt" value={form.markt} onChange={handleChange} className={fc("markt")}>
                    {MARKT_OPTIONEN.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  {lb("Kanal", "kanal")}
                  <select name="kanal" value={form.kanal} onChange={handleChange} className={fc("kanal")}>
                    {KANAL_OPTIONEN.map(o => (
                      <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  {lb("Automationsmodus", "automationsmodus")}
                  <select name="automationsmodus" value={form.automationsmodus} onChange={handleChange} className={fc("automationsmodus")}>
                    {AUTOMATIONS_OPTIONEN.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>

              {/* Laufzeit */}
              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Laufzeit</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Startdatum</label>
                    <input type="date" name="campaign_start" value={form.campaign_start || ""} onChange={handleChange}
                      className="w-full border border-slate-200 rounded-2xl p-3 bg-slate-50 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Enddatum</label>
                    <input type="date" name="campaign_end" value={form.campaign_end || ""} onChange={handleChange}
                      className="w-full border border-slate-200 rounded-2xl p-3 bg-slate-50 text-sm" />
                  </div>
                </div>
              </div>

              {/* Budget */}
              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Budget</p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Gesamtbudget</label>
                    <div className="relative">
                      <input type="number" name="budget" value={form.budget} onChange={handleChange}
                        placeholder="0" min="0"
                        className="w-full border border-slate-200 rounded-2xl p-3 pr-8 bg-slate-50 text-sm" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">€</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <label className="text-xs font-medium text-slate-600">Tagesbudget</label>
                      <div className="relative group inline-block">
                        <span className="cursor-help text-slate-400 text-xs leading-none">ⓘ</span>
                        <div className="hidden group-hover:block absolute left-0 top-full mt-1 z-20 w-64 bg-slate-900 text-white text-xs rounded-xl px-3 py-2 shadow-lg leading-relaxed pointer-events-none">
                          ONEmatic setzt ein Mindest-Tagesbudget von 10 € voraus um eine effektive Kampagnenauslieferung zu gewährleisten. Bei kürzerer Laufzeit erhöht sich das empfohlene Tagesbudget entsprechend.
                        </div>
                      </div>
                    </div>
                    <div className="relative">
                      <input type="number" name="budget_daily" value={form.budget_daily} onChange={handleChange}
                        placeholder="0" min={MIN_DAILY_BUDGET}
                        onBlur={(e) => {
                          const v = Number(e.target.value);
                          if (v > 0 && v < MIN_DAILY_BUDGET) {
                            setForm((prev) => ({ ...prev, budget_daily: String(MIN_DAILY_BUDGET) }));
                          }
                        }}
                        className={`w-full border rounded-2xl p-3 pr-8 bg-slate-50 text-sm transition-colors ${
                          budgetDailyBelowMin ? "border-red-400 ring-2 ring-red-100" : "border-slate-200"
                        }`} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">€</span>
                    </div>
                    {budgetDailyBelowMin && (
                      <p className="text-red-500 text-xs mt-1">Mindest-Tagesbudget: {MIN_DAILY_BUDGET} €</p>
                    )}
                  </div>
                  <div>
                    {lb("Pacing", "pacing")}
                    <select name="pacing" value={form.pacing} onChange={handleChange} className={fc("pacing")}>
                      {PACING_OPTIONEN.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Bidding */}
              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Bidding</p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    {lb("Bid Price", "bid_price")}
                    <div className="relative">
                      <input type="number" name="bid_price" value={form.bid_price} onChange={handleChange}
                        placeholder="0.00" min="0" step="0.01"
                        className={fc("bid_price", "pr-14")} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">€ CPM</span>
                    </div>
                  </div>
                  <div>
                    {lb("Bid Strategy", "bid_strategy")}
                    <select name="bid_strategy" value={form.bid_strategy} onChange={handleChange} className={fc("bid_strategy")}>
                      {BID_STRATEGY_OPTIONEN.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Bid Adjustment</label>
                    <div className="relative">
                      <input type="number" name="bid_adjustment" value={form.bid_adjustment} onChange={handleChange}
                        placeholder="z.B. +10 oder -5"
                        className="w-full border border-slate-200 rounded-2xl p-3 pr-8 bg-slate-50 text-sm" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Frequency Cap */}
              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Frequency Cap</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    {lb("Impressions", "freq_cap_impressions")}
                    <input type="number" name="freq_cap_impressions" value={form.freq_cap_impressions} onChange={handleChange}
                      placeholder="z.B. 3" min="0" className={fc("freq_cap_impressions")} />
                  </div>
                  <div>
                    {lb("Zeitraum", "freq_cap_zeitraum")}
                    <select name="freq_cap_zeitraum" value={form.freq_cap_zeitraum} onChange={handleChange} className={fc("freq_cap_zeitraum")}>
                      {FREQ_CAP_ZEITRAUM_OPTIONEN.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Inventory */}
              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Inventory</p>
                <div className="space-y-2 text-sm">
                  <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 cursor-default">
                    <input type="checkbox" checked readOnly className="accent-slate-900" />
                    <span className="font-medium">Open Exchange</span>
                    <span className="ml-auto text-[10px] bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5">Standard</span>
                  </label>
                  <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 cursor-not-allowed opacity-50">
                    <input type="checkbox" disabled className="accent-slate-900" />
                    <span>Private Deals / PMP</span>
                    <span className="ml-auto text-[10px] bg-slate-200 text-slate-500 rounded-full px-2 py-0.5">Coming soon</span>
                  </label>
                  <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 cursor-not-allowed opacity-50">
                    <input type="checkbox" disabled className="accent-slate-900" />
                    <span>Preferred Deals</span>
                    <span className="ml-auto text-[10px] bg-slate-200 text-slate-500 rounded-full px-2 py-0.5">Coming soon</span>
                  </label>
                </div>
              </div>

              {/* Device + Referenzkampagne */}
              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  {/* Device toggles */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold uppercase tracking-widest mb-3 flex items-center gap-2 ${ai("devices") ? "text-indigo-500" : "text-slate-400"}`}>
                      Device
                      {ai("devices") && (
                        <span className="rounded-full bg-indigo-100 text-indigo-700 text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-wide">KI</span>
                      )}
                    </p>
                    <div className="flex gap-3 flex-wrap">
                      {DEVICE_OPTIONEN.map(({ value, label, disabled }) => {
                        const checked = (form.devices ?? []).includes(value);
                        return disabled ? (
                          <div key={value}
                            title="CTV-Creatives folgen in Kürze"
                            className="flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm cursor-not-allowed opacity-40 border-slate-200 bg-slate-50 text-slate-400 select-none"
                          >
                            {label}
                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 border border-slate-300 rounded-full px-1.5 py-0.5 leading-none">Soon</span>
                          </div>
                        ) : (
                          <label key={value}
                            className={`flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm cursor-pointer transition ${
                              checked
                                ? "bg-slate-900 text-white border-slate-900"
                                : ai("devices")
                                ? "bg-indigo-50 text-slate-700 border-indigo-200 hover:border-indigo-400"
                                : "bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-400"
                            }`}>
                            <input type="checkbox" checked={checked} onChange={() => handleDeviceToggle(value)} className="hidden" />
                            {checked ? "✓ " : ""}{label}
                          </label>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2">Mindestens eine Option muss ausgewählt sein.</p>
                  </div>

                  {/* Referenzkampagne */}
                  <div className="shrink-0 w-52">
                    <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1">
                      Referenzkampagne
                      <span className="relative group cursor-default">
                        <span className="text-slate-400 hover:text-slate-600 text-sm leading-none select-none">ⓘ</span>
                        <span className="pointer-events-none absolute bottom-full right-0 mb-2 w-64 rounded-xl bg-slate-900 text-white text-xs leading-5 px-3 py-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-20">
                          Optional: Hinterlege eine Referenzkampagne für A/B-Testing oder alternative DSP-Platzierungen. Die KI nutzt diese als Vergleichsbasis für Optimierungsempfehlungen und kann automatisch Leistungsunterschiede analysieren.
                        </span>
                      </span>
                    </label>
                    <input
                      type="text"
                      name="referenzkampagne"
                      value={form.referenzkampagne ?? ""}
                      onChange={handleChange}
                      placeholder="Kampagnen-ID oder Name"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400/40"
                    />
                  </div>
                </div>
              </div>
            </div>
          </LightCard>

          {/* AI-Empfehlungen — 3 Kacheln */}
          <section className="bg-white rounded-3xl shadow-sm border border-slate-200 px-6 py-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">AI-Empfehlungen</h3>
              <span className="text-xs text-slate-500">ONEmatic · OpenAI</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Kacheln 1 & 2 — KI-Empfehlungen */}
              {aiRecommendations.length === 2 ? (
                aiRecommendations.map((rec, index) => (
                  <div
                    key={index}
                    className={`rounded-3xl p-5 flex flex-col justify-between transition-all duration-500 ${
                      appliedRec[index]
                        ? "bg-emerald-800 border border-emerald-600"
                        : "bg-[#111827]"
                    }`}
                  >
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400 font-semibold mb-3">
                        Empfehlung {index + 1}
                      </div>
                      {appliedRec[index] ? (
                        <p className="text-sm leading-6 text-emerald-200 font-medium">
                          ✓ Übernommen — Einstellung in Media Controls angepasst.
                        </p>
                      ) : (
                        <>
                          <h4 className="text-white font-semibold text-sm mb-2">{rec.titel}</h4>
                          <p className="text-sm leading-6 text-slate-300">{rec.beschreibung}</p>
                          {rec.aktion && (
                            <div className="mt-3 rounded-xl bg-slate-800 px-3 py-2 text-xs text-slate-400">
                              {rec.aktion}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    {!appliedRec[index] && rec.feld && (
                      <button
                        onClick={() => handleApplyRec(index, rec)}
                        className="mt-4 rounded-2xl bg-white text-slate-900 px-4 py-2 text-sm font-medium hover:opacity-90 transition"
                      >
                        Übernehmen
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <>
                  {[0, 1].map((index) => (
                    <div key={index} className="bg-[#111827] rounded-3xl p-5 flex flex-col justify-between">
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500 font-semibold mb-3">
                          Empfehlung {index + 1}
                        </div>
                        <p className="text-sm leading-6 text-slate-500">
                          Erstelle eine Kampagne um KI-Empfehlungen zu erhalten.
                        </p>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Kachel 3 — Agentic Optimization */}
              {(() => {
                const agenticCampaign = campaigns.find((c) =>
                  ((c as any).supabase_id === lastCampaignId || c.id === lastCampaignId) &&
                  !!(c as any).agentic_enabled
                );
                const isActive = !!agenticCampaign;

                if (isActive) {
                  return (
                    <div className="bg-emerald-900 border border-emerald-700 rounded-3xl p-5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="text-[11px] uppercase tracking-[0.2em] text-emerald-300 font-semibold">
                            Agentic Layer
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                          <h4 className="text-white font-semibold text-sm">✓ Agentic Layer aktiv</h4>
                        </div>
                        <p className="text-[11px] text-emerald-300 font-medium mb-3">Optimierung läuft</p>
                        <p className="text-sm leading-6 text-emerald-200">
                          Der Agentic Layer überwacht diese Kampagne kontinuierlich und optimiert automatisch.
                        </p>
                        <p className="text-xs text-emerald-400 mt-2">Ergebnisse und Logs unter AI Insights</p>
                      </div>
                      <div className="mt-4 space-y-2">
                        <button
                          onClick={() => setActivePage("AI Insights")}
                          className="w-full rounded-2xl bg-white text-emerald-900 px-4 py-2 text-sm font-bold hover:opacity-90 transition"
                        >
                          Zur Analyse →
                        </button>
                        <button
                          onClick={() => handleAgenticStop(agenticCampaign.id)}
                          className="w-full text-center text-[11px] text-emerald-500 hover:text-red-300 transition"
                        >
                          Deaktivieren
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="bg-red-900 border border-red-700 rounded-3xl p-5 flex flex-col justify-between">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.2em] text-red-300 font-semibold mb-3">
                        Agentic Layer
                      </div>
                      <h4 className="text-white font-semibold text-sm mb-2">⚡ Agentic Optimization aktivieren</h4>
                      <p className="text-sm leading-6 text-red-200">
                        Aktiviere den Agentic Layer — ONEmatic optimiert deine Kampagne automatisch basierend auf Echtzeit-Performance-Daten.
                      </p>
                    </div>
                    <button
                      onClick={onAgenticActivate}
                      className="mt-4 rounded-2xl bg-white text-red-900 px-4 py-2 text-sm font-bold hover:opacity-90 transition"
                    >
                      Jetzt aktivieren
                    </button>
                  </div>
                );
              })()}
            </div>
          </section>

          {/* Creative Upload Hinweis */}
          <LightCard title="Creative Upload" subtitle="Letzter Schritt">
            {(() => {
              const relevantIds = new Set<string>(
                [
                  lastCampaignId,
                  selectedCampaign?.supabase_id,
                  selectedCampaign?.id,
                ].filter(Boolean) as string[]
              );
              const activeCampaignCreatives = relevantIds.size > 0
                ? creativeLibrary.filter((c) =>
                    c.campaign_id != null && relevantIds.has(c.campaign_id)
                  )
                : [];
              const hasCreatives =
                activeCampaignCreatives.length > 0 ||
                creativeLibrary.some((c) => c.campaign_id === null);
              const canStart = workflowStepsDone.every(Boolean);

              return (
                <div className="space-y-3 text-sm">
                  <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                    Fast geschafft! Lade jetzt deine Display- oder DOOH-Werbemittel hoch und ordne sie dieser Kampagne zu. Danach kannst du die Kampagne direkt starten oder als Entwurf speichern.
                  </div>

                  {/* Creatives zur aktuellen Kampagne */}
                  {!lastCampaignId ? (
                    <p className="text-xs text-slate-400">Noch keine Kampagne gestartet.</p>
                  ) : activeCampaignCreatives.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-slate-500">
                        {activeCampaignCreatives.length} Creative{activeCampaignCreatives.length !== 1 ? "s" : ""} hochgeladen
                      </p>
                      {activeCampaignCreatives.slice(0, 3).map((c) => (
                        <div key={c.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-2">
                          {c.file_url ? (
                            <img src={c.file_url} alt={c.name} className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-100 shrink-0 flex items-center justify-center text-slate-400 text-xs">
                              {c.type?.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="text-xs font-medium truncate">{c.name}</div>
                            <div className="text-xs text-slate-400">{c.format || c.type} · {c.status}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">Noch keine Creatives für diese Kampagne hochgeladen.</p>
                  )}

                  <button
                    onClick={() => onGoToCreatives ? onGoToCreatives() : setActivePage("Creatives")}
                    className="w-full rounded-2xl bg-[#334155] text-white py-3 font-medium hover:opacity-90"
                  >
                    Zum Creative Upload
                  </button>

                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={handleSaveDraft}
                      className="flex-1 rounded-2xl border border-slate-300 bg-white text-slate-700 py-2.5 text-sm font-medium hover:bg-slate-50 transition-colors"
                    >
                      Als Entwurf speichern
                    </button>
                    <div className="flex-1 flex flex-col gap-1">
                      <button
                        onClick={canStart && onKampagneStarten ? onKampagneStarten : undefined}
                        disabled={loading || !canStart}
                        title={!canStart ? "Bitte zuerst ein Creative hochladen" : undefined}
                        className={`w-full rounded-2xl py-2.5 text-sm font-medium transition-colors ${
                          canStart
                            ? "bg-slate-900 text-white hover:opacity-90 disabled:opacity-60"
                            : "bg-slate-200 text-slate-400 cursor-not-allowed"
                        }`}
                      >
                        {loading ? "Wird aktiviert..." : "Kampagne starten"}
                      </button>
                      <p className="text-[10px] text-slate-400 text-center leading-tight">
                        DSP Push folgt in Kürze — Kampagne wird als Aktiv markiert
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </LightCard>
        </div>

        {/* ── Rechte Spalte (1/3) sticky ───────────────────────── */}
        <div className="xl:col-span-1">
          <div className="sticky top-6 space-y-6">
            <DarkCard title="AGENTIC LAYER" subtitle="Aktive Optimierungen">
              {(() => {
                const agenticCampaigns = campaigns.filter((c) => !!(c as any).agentic_enabled);
                if (agenticCampaigns.length === 0) {
                  return (
                    <p className="text-xs text-slate-400 leading-5">
                      Keine aktiven Agentic-Optimierungen.{" "}
                      Aktiviere den Agentic Layer bei einer Kampagne.
                    </p>
                  );
                }
                return (
                  <div className="space-y-2">
                    {agenticCampaigns.map((c) => {
                      const isOpen = expandedAgenticIds.includes(c.id);
                      const campLogs = agenticLogs.filter((l) => l.campaign_id === c.id);
                      const shortName = c.name.length > 20 ? c.name.slice(0, 20) + "…" : c.name;
                      const defaultItems = [
                        "Bid Adjustment wird überwacht",
                        "Frequency Cap wird überwacht",
                        "Tagesbudget wird überwacht",
                        "Creative Performance wird überwacht",
                      ];
                      return (
                        <div key={c.id} className="rounded-2xl bg-slate-800 overflow-hidden">
                          {/* Header */}
                          <button
                            onClick={() =>
                              setExpandedAgenticIds((prev) =>
                                prev.includes(c.id)
                                  ? prev.filter((id) => id !== c.id)
                                  : [...prev, c.id]
                              )
                            }
                            className="w-full flex items-center justify-between px-3 py-2.5 text-left"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="text-white text-xs font-medium">{shortName}</div>
                              <div className="text-slate-500 text-[10px] truncate">{c.id}</div>
                            </div>
                            <div className="flex items-center gap-2 ml-2 shrink-0">
                              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                                Aktiv
                              </span>
                              <span className={`text-slate-400 text-xs transition-transform inline-block ${isOpen ? "rotate-180" : ""}`}>▾</span>
                            </div>
                          </button>

                          {/* Body */}
                          {isOpen && (
                            <div className="px-3 pb-3 border-t border-slate-700 pt-2 space-y-3">
                              <p className="text-[10px] text-slate-400">Zuletzt optimiert: heute</p>

                              {campLogs.length > 0 ? (
                                <div className="space-y-1.5">
                                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">Letzte Aktionen</div>
                                  {campLogs.slice(0, 3).map((log) => (
                                    <div key={log.id} className="rounded-xl bg-slate-700/60 px-2.5 py-2">
                                      <div className="flex items-center justify-between gap-1 mb-0.5">
                                        <span className="text-[10px] text-slate-300 font-medium capitalize">
                                          {log.routine.replace(/_/g, " ")}
                                        </span>
                                        <span className={`text-[9px] font-bold rounded-full px-1.5 py-0.5 ${
                                          log.status === "angewendet" ? "bg-emerald-500/20 text-emerald-400" :
                                          log.status === "abgelehnt"  ? "bg-red-500/20 text-red-400" :
                                          "bg-amber-500/20 text-amber-400"
                                        }`}>
                                          {log.status === "angewendet" ? "✓ Angewendet" : log.status === "abgelehnt" ? "✗ Abgelehnt" : "● Vorgeschlagen"}
                                        </span>
                                      </div>
                                      <p className="text-[10px] text-slate-400 leading-4">{log.entscheidung}</p>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  {defaultItems.map((item) => (
                                    <div key={item} className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                      <span className="text-emerald-400">✓</span>
                                      {item}
                                    </div>
                                  ))}
                                </div>
                              )}

                              <button
                                onClick={() => handleAgenticStop(c.id)}
                                className="w-full rounded-xl bg-red-900/60 border border-red-800 text-red-300 text-[11px] py-1.5 hover:bg-red-900 transition-colors"
                              >
                                Agentic stoppen
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </DarkCard>

            <LightCard title="Nächste Schritte" subtitle="Workflow">
              <div className="grid grid-cols-1 gap-2 text-sm">
                {([
                  { label: "Kampagne & Prompt definieren", action: handleSubmit },
                  { label: "DSP Setup konfigurieren",      action: handleSubmit },
                  { label: "AI Analyse starten",           action: handleSubmit },
                  { label: "Creatives hochladen",          action: onGoToCreatives ?? (() => setActivePage("Creatives")) },
                ] as { label: string; action: () => void }[]).map(({ label, action }, i) => {
                  const done   = workflowStepsDone[i];
                  const active = !done && workflowStepsDone.slice(0, i).every(Boolean);
                  return (
                    <button
                      key={i}
                      onClick={action}
                      className={`rounded-2xl border p-4 text-left transition ${
                        done
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700 cursor-default"
                          : active
                          ? "bg-slate-900 border-slate-900 text-white hover:opacity-90"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {done ? `✓ ${label}` : label}
                    </button>
                  );
                })}
              </div>
            </LightCard>

            <LightCard title="Quick Defaults">
              <div className="space-y-3 text-sm">
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                  Ziel: <span className="font-semibold">{form.ziel || "—"}</span>
                </div>
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                  KPI-Fokus: <span className="font-semibold">{form.kpi || "—"}</span>
                </div>
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                  Datenanbieter: <span className="font-semibold">{form.datenanbieter || "—"}</span>
                </div>
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                  Verification: <span className="font-semibold">{form.verification || "—"}</span>
                </div>
              </div>
            </LightCard>
          </div>
        </div>
      </div>
    </div>
  );
}
