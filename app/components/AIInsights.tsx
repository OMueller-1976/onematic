"use client";

import { useState } from "react";
import type { SavedRuleItem, CampaignItem, CampaignForm, AgenticLog } from "../lib/types";
import { updateAgenticEnabled } from "../lib/api";

const ROUTINE_LABELS: Record<string, string> = {
  budget_optimierung: "Budget Optimierung",
  creative_rotation: "Creative Rotation",
  dsp_shift: "DSP Performance",
  benchmark_check: "KPI Benchmark",
  referenz_vergleich: "Referenzvergleich",
};

type Props = {
  recommendationItems: string[];
  savedRules: SavedRuleItem[];
  handleSaveRule: (item: string) => void;
  handleRuleStatusToggle: (id: string) => void;
  handleRuleRemove: (id: string) => void;
  form: CampaignForm;
  setForm: React.Dispatch<React.SetStateAction<CampaignForm>>;
  selectedCampaign: CampaignItem | null;
  currentPlan: string;
  agenticLogs: AgenticLog[];
  handleAgenticApprove: (logId: string) => void;
  handleAgenticAnalyse: (campaignId?: string) => void;
  campaigns: CampaignItem[];
  handleAgenticStop?: (campaignId: string) => void;
};

export default function AIInsights({
  recommendationItems: _recommendationItems = [],
  savedRules: _savedRules = [],
  handleSaveRule: _handleSaveRule,
  handleRuleStatusToggle: _handleRuleStatusToggle,
  handleRuleRemove: _handleRuleRemove,
  form: _form,
  setForm: _setForm,
  selectedCampaign,
  currentPlan: _currentPlan,
  agenticLogs = [],
  handleAgenticApprove,
  handleAgenticAnalyse,
  campaigns = [],
  handleAgenticStop,
}: Props) {
  const [analysisCampaignId, setAnalysisCampaignId] = useState<string | null>(
    selectedCampaign?.supabase_id ?? selectedCampaign?.id ?? null
  );
  const [expandedCampaignIds, setExpandedCampaignIds] = useState<string[]>([]);
  const [stoppingIds, setStoppingIds] = useState<string[]>([]);

  const activeCampaigns = campaigns.filter((c) => c.status === "Aktiv");
  const agenticCampaigns = campaigns.filter((c) => !!(c as any).agentic_enabled);

  const toggleExpand = (cid: string) => {
    setExpandedCampaignIds((prev) =>
      prev.includes(cid) ? prev.filter((id) => id !== cid) : [...prev, cid]
    );
  };

  const handleStop = async (c: CampaignItem) => {
    const cid = c.supabase_id ?? c.id;
    setStoppingIds((prev) => [...prev, cid]);
    try {
      await updateAgenticEnabled(c.id, false);
      if (handleAgenticStop) handleAgenticStop(cid);
    } finally {
      setStoppingIds((prev) => prev.filter((id) => id !== cid));
    }
  };

  const totalAngewendet = agenticLogs.filter((l) => l.status === "angewendet").length;
  const totalVorgeschlagen = agenticLogs.filter((l) => l.status === "vorgeschlagen").length;
  const lastLog =
    agenticLogs.length > 0
      ? agenticLogs.reduce((a, b) =>
          new Date(a.created_at) > new Date(b.created_at) ? a : b
        )
      : null;

  return (
    <div className="space-y-4">
      {/* ── Kampagnen-Auswahl für Analyse ───────────────────────── */}
      <div className="rounded-[28px] border border-slate-300 bg-[#e7edf2] p-6 shadow-sm overflow-hidden">
        <div className="flex items-start justify-between mb-5">
          <div className="text-lg font-bold">Kampagnen analysieren</div>
          <span className="text-xs text-slate-400">Aktive Kampagnen</span>
        </div>
        {activeCampaigns.length === 0 ? (
          <p className="text-sm text-slate-400 pb-2">
            Keine aktiven Kampagnen vorhanden. Erstelle zuerst eine Kampagne im Dashboard.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {activeCampaigns.map((c) => {
              const cid = c.supabase_id ?? c.id;
              const isSelected = analysisCampaignId === cid;
              const lastCampaignLog = agenticLogs.find((l) => l.campaign_id === cid);
              return (
                <div
                  key={c.id}
                  className={`rounded-2xl border p-4 transition-all ${
                    isSelected
                      ? "border-emerald-400 bg-emerald-50 ring-2 ring-emerald-100"
                      : "border-slate-200 bg-slate-50"
                  }` || ""}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate">{c.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {lastCampaignLog
                          ? `Letzte Analyse: ${new Date(lastCampaignLog.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" })}`
                          : "Noch nicht analysiert"}
                      </div>
                    </div>
                    <span className="shrink-0 text-[10px] rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 font-medium">
                      {c.status}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setAnalysisCampaignId(cid);
                      handleAgenticAnalyse(cid);
                    }}
                    className={`w-full rounded-xl py-2 text-xs font-semibold transition ${
                      isSelected
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : "bg-slate-900 text-white hover:opacity-90"
                    }` || ""}
                  >
                    {isSelected ? "⚡ Erneut analysieren" : "⚡ Analysieren"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Agentic Layer Übersicht ──────────────────────────────── */}
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        {/* A) Header + Stats */}
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <div className="text-lg font-bold">Agentic Layer Übersicht</div>
            <div className="text-xs text-slate-400 mt-0.5">Autonome Kampagnen-Optimierung</div>
          </div>
          <div className="flex gap-3 flex-wrap">
            <div className="rounded-2xl bg-[#111827] text-white px-4 py-2 text-center min-w-[72px]">
              <div className="text-xl font-bold">{agenticCampaigns.length}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Aktiv</div>
            </div>
            <div className="rounded-2xl bg-[#111827] text-white px-4 py-2 text-center min-w-[72px]">
              <div className="text-xl font-bold text-emerald-400">{totalAngewendet}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Angewendet</div>
            </div>
            <div className="rounded-2xl bg-[#111827] text-white px-4 py-2 text-center min-w-[72px]">
              <div className="text-xl font-bold text-amber-400">{totalVorgeschlagen}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Ausstehend</div>
            </div>
            <div className="rounded-2xl bg-[#111827] text-white px-4 py-2 text-center min-w-[120px]">
              <div className="text-sm font-semibold">
                {lastLog
                  ? new Date(lastLog.created_at).toLocaleDateString("de-DE", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—"}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Letzte Analyse</div>
            </div>
          </div>
        </div>

        {/* B) Per campaign OR C) empty state */}
        {agenticCampaigns.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-8 text-center">
            <div className="text-3xl mb-3">⚡</div>
            <div className="font-semibold text-slate-700 mb-1">
              Noch keine Agentic-Optimierungen aktiv
            </div>
            <p className="text-sm text-slate-400 max-w-sm mx-auto">
              Aktiviere den Agentic Layer bei einer Kampagne unter "Kampagnen analysieren".
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {agenticCampaigns.map((c) => {
              const cid = c.supabase_id ?? c.id;
              const campaignLogs = agenticLogs.filter((l) => l.campaign_id === cid);
              const isExpanded = expandedCampaignIds.includes(cid);
              const isStopping = stoppingIds.includes(cid);
              const lastAnalysis =
                campaignLogs.length > 0
                  ? campaignLogs.reduce((a, b) =>
                      new Date(a.created_at) > new Date(b.created_at) ? a : b
                    )
                  : null;
              const qualityScore = lastAnalysis
                ? ((lastAnalysis as any).claude_qualitaets_score as number | null) ?? null
                : null;
              const applied = campaignLogs.filter((l) => l.status === "angewendet").length;
              const pending = campaignLogs.filter((l) => l.status === "vorgeschlagen").length;

              return (
                <div
                  key={c.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden"
                >
                  {/* Campaign header row */}
                  <div className="flex items-center justify-between gap-3 p-4 flex-wrap">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="relative flex h-2.5 w-2.5 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                      </span>
                      <div className="min-w-0">
                        <div className="font-semibold text-sm truncate">{c.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                          {cid}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                      {qualityScore !== null && (
                        <span className="text-[10px] rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 font-semibold">
                          Score {qualityScore}
                        </span>
                      )}
                      <span className="text-[10px] rounded-full bg-slate-200 text-slate-600 px-2 py-0.5">
                        {applied} angewendet · {pending} ausstehend
                      </span>
                      <button
                        onClick={() => {
                          setAnalysisCampaignId(cid);
                          handleAgenticAnalyse(cid);
                        }}
                        className="rounded-xl bg-slate-900 text-white px-3 py-1.5 text-xs font-semibold hover:opacity-90 transition"
                      >
                        ⚡ Erneut analysieren
                      </button>
                      <button
                        onClick={() => toggleExpand(cid)}
                        className="rounded-xl border border-slate-300 bg-white text-slate-600 px-3 py-1.5 text-xs font-medium hover:bg-slate-50 transition"
                      >
                        {isExpanded ? "▲ Einklappen" : "▼ Details"}
                      </button>
                      <button
                        onClick={() => handleStop(c)}
                        disabled={isStopping}
                        className="rounded-xl bg-red-50 border border-red-200 text-red-600 px-3 py-1.5 text-xs font-medium hover:bg-red-100 transition disabled:opacity-50"
                      >
                        {isStopping ? "Stoppe…" : "Agentic stoppen"}
                      </button>
                    </div>
                  </div>

                  {/* Accordion: log list */}
                  {isExpanded && (
                    <div className="border-t border-slate-200 bg-white p-4">
                      {campaignLogs.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-4">
                          Noch keine Analyse-Logs für diese Kampagne.
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                          {campaignLogs.map((log) => {
                            const verified = (log as any).claude_verifiziert as boolean | null;
                            return (
                              <div
                                key={log.id}
                                className="rounded-xl border border-slate-100 bg-slate-50 p-3"
                              >
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                    <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-200 rounded-full px-1.5 py-0.5 shrink-0">
                                      {ROUTINE_LABELS[log.routine] ??
                                        log.routine.replace(/_/g, " ")}
                                    </span>
                                    {verified === true && (
                                      <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 rounded-full px-1.5 py-0.5 shrink-0">
                                        ✓ Claude
                                      </span>
                                    )}
                                    {verified === false && (
                                      <span className="text-[9px] font-bold bg-amber-100 text-amber-700 rounded-full px-1.5 py-0.5 shrink-0">
                                        ⚠ Claude
                                      </span>
                                    )}
                                  </div>
                                  <span
                                    className={`shrink-0 text-[9px] font-bold rounded-full px-1.5 py-0.5 ${
                                      log.status === "angewendet"
                                        ? "bg-emerald-100 text-emerald-700"
                                        : log.status === "abgelehnt"
                                        ? "bg-red-100 text-red-700"
                                        : "bg-amber-100 text-amber-700"
                                    }` || ""}
                                  >
                                    {log.status === "angewendet"
                                      ? "✓ Angewendet"
                                      : log.status === "abgelehnt"
                                      ? "✗ Abgelehnt"
                                      : "● Vorgeschlagen"}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-700 leading-5 my-1">
                                  {log.entscheidung}
                                </p>
                                {log.analyse && (
                                  <p className="text-[10px] text-slate-400 leading-4 italic mb-1">
                                    {log.analyse}
                                  </p>
                                )}
                                <div className="flex items-center justify-between mt-1.5">
                                  <span className="text-[10px] text-slate-400">
                                    {new Date(log.created_at).toLocaleDateString("de-DE", {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "2-digit",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                  {log.status === "vorgeschlagen" && (
                                    <button
                                      onClick={() => handleAgenticApprove(log.id)}
                                      className="text-[10px] text-emerald-600 hover:text-emerald-800 font-medium underline"
                                    >
                                      Manuell genehmigen
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
