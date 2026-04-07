"use client";

import { useState } from "react";
import type { CampaignItem, CampaignStatus } from "../lib/types";
import { DarkCard, LightCard, CopyIdField } from "./ui";
import { supabase } from "../lib/supabase";

type Props = {
  campaigns: CampaignItem[];
  selectedCampaign: CampaignItem | null;
  currentPlan: string;
  handleReset: () => void;
  handleCampaignOpen: (campaign: CampaignItem) => void;
  handleCampaignStatusChange: (id: string, status: CampaignStatus) => void;
  handleBulkCampaignStatusChange: (ids: string[], status: CampaignStatus) => void;
  handleCampaignDuplicate: (campaign: CampaignItem) => void;
  setStatusMessage: (msg: string) => void;
  onAgenticAnalyse: (campaignId: string) => void;
  onCampaignUpdate?: (updated: CampaignItem) => void;
};

// ── Hilfsfunktion: Ablauf-Badge berechnen ──────────────────────────
function getAblaufBadge(campaign_end?: string | null): string | null {
  if (!campaign_end) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(campaign_end);
  end.setHours(0, 0, 0, 0);
  const diffDays = Math.round((end.getTime() - today.getTime()) / 86400000);
  if (diffDays === 0) return "Endet heute";
  if (diffDays === 1) return `Läuft ab: ${end.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}`;
  return null;
}

// ── Kampagnen-Kachel ───────────────────────────────────────────────
function CampaignRow({
  campaign,
  selected,
  onSelect,
  onOpen,
}: {
  campaign: CampaignItem;
  selected: boolean;
  onSelect: (id: string) => void;
  onOpen: (c: CampaignItem) => void;
}) {
  const ablaufBadge = campaign.status === "Aktiv"
    ? getAblaufBadge((campaign as any).campaign_end)
    : null;

  return (
    <div className={`w-full rounded-2xl border p-4 flex items-center gap-3 transition-colors ${
      selected
        ? "border-blue-400 bg-blue-50 ring-2 ring-blue-100"
        : "border-slate-200 bg-slate-50"
    }`}>
      {/* Checkbox */}
      <button
        onClick={(e) => { e.stopPropagation(); onSelect(campaign.id); }}
        className="shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors"
        style={{
          borderColor: selected ? "#3b82f6" : "#cbd5e1",
          backgroundColor: selected ? "#3b82f6" : "white",
        }}
        aria-label={selected ? "Abwählen" : "Auswählen"}
      >
        {selected && (
          <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Card content — klickbar für Detail */}
      <button onClick={() => onOpen(campaign)} className="flex-1 text-left min-w-0">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="font-semibold truncate">{campaign.name}</div>
            <div className="mt-1 space-y-1">
              <CopyIdField value={campaign.id} />
              <div className="text-xs text-slate-400">{campaign.dsp} · KPI: {campaign.kpi}</div>
            </div>
            {ablaufBadge && (
              <span className="inline-block mt-1.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-semibold px-2 py-0.5">
                ⚠ {ablaufBadge}
              </span>
            )}
          </div>
          <div className="text-xs rounded-full px-3 py-1 bg-white border border-slate-200 shrink-0">
            {campaign.status}
          </div>
        </div>
      </button>
    </div>
  );
}

// ── Eingeklappt-Header ─────────────────────────────────────────────
function SectionToggle({
  label,
  count,
  open,
  onToggle,
}: {
  label: string;
  count: number;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-1 py-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
    >
      <span>{label} ({count})</span>
      <span
        style={{
          display: "inline-block",
          transform: open ? "rotate(0deg)" : "rotate(-90deg)",
          transition: "transform 0.2s",
        }}
      >
        ▼
      </span>
    </button>
  );
}

// ── Hauptkomponente ────────────────────────────────────────────────
export default function Kampagnen({
  campaigns,
  selectedCampaign,
  currentPlan,
  handleReset,
  handleCampaignOpen,
  handleCampaignStatusChange,
  handleBulkCampaignStatusChange,
  handleCampaignDuplicate,
  setStatusMessage,
  onAgenticAnalyse,
  onCampaignUpdate,
}: Props) {
  const [pauseOpen, setPauseOpen] = useState(false);
  const [archivOpen, setArchivOpen] = useState(false);
  const [beendenConfirm, setBeendenConfirm] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkBeendenConfirm, setBulkBeendenConfirm] = useState(false);

  // ── Edit Modal ─────────────────────────────────────────────────
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<CampaignItem>>({});
  const [editSaving, setEditSaving] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  const openEdit = async (c: CampaignItem) => {
    setEditOpen(true);
    setEditLoading(true);

    const targetId = c.supabase_id ?? c.id;
    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", targetId)
      .single();

    const src = data ?? c; // fall back to local state if fetch fails
    setEditForm({
      name:                src.name ?? "",
      budget:              (src as any).budget_total ?? (src as any).budget ?? "",
      budget_daily:        (src as any).budget_daily ?? "",
      campaign_start:      (src as any).campaign_start ?? "",
      campaign_end:        (src as any).campaign_end ?? "",
      dsp:                 (src as any).dsp ?? "DV360",
      market:              (src as any).market ?? (src as any).markt ?? "",
      kanal:               (src as any).kanal ?? "",
      automationsmodus:    (src as any).automationsmodus ?? "",
      bid_strategy:        (src as any).bid_strategy ?? "",
      bid_price:           (src as any).bid_price ?? "",
      freq_cap_impressions: (src as any).freq_cap_impressions ?? "",
      freq_cap_zeitraum:   (src as any).freq_cap_zeitraum ?? "pro Woche",
      objective:           (src as any).objective ?? "",
      kpi:                 (src as any).primary_kpi ?? (src as any).kpi ?? "",
      datenanbieter:       (src as any).datenanbieter ?? "",
      verification:        (src as any).verification ?? "",
    } as Partial<CampaignItem>);
    setEditLoading(false);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleEditSave = async () => {
    if (!editForm || !selectedCampaign) return;
    setEditSaving(true);
    const targetId = selectedCampaign.supabase_id ?? selectedCampaign.id;
    const { error } = await supabase
      .from("campaigns")
      .update(editForm)
      .eq("id", targetId);
    setEditSaving(false);
    if (error) {
      setStatusMessage("⚠ Speichern fehlgeschlagen: " + error.message);
      return;
    }
    const updated: CampaignItem = { ...selectedCampaign, ...editForm } as CampaignItem;
    onCampaignUpdate?.(updated);
    setEditOpen(false);
    setStatusMessage("Kampagne aktualisiert");
  };

  const totalMediaBudget = campaigns
    .filter((c) => c.status === "Aktiv")
    .reduce((sum, c) => sum + (Number((c as any).budget_total) || 0), 0);
  const isPaidPlan = ["growth", "pro"].includes(currentPlan);

  const allCampaigns = campaigns;
  const aktive   = allCampaigns.filter((c) => c.status === "Aktiv");
  const pausiert = allCampaigns.filter((c) => c.status === "Pausiert");
  const archiv   = allCampaigns.filter((c) => c.status === "Beendet" || c.status === "draft");

  // ── Multi-Select Helpers ───────────────────────────────────────
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const allVisible = [...aktive, ...pausiert, ...archiv];
  const allSelected = allVisible.length > 0 && allVisible.every((c) => selectedIds.includes(c.id));

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? [] : allVisible.map((c) => c.id));
  };

  const handleBulkAction = (status: CampaignStatus) => {
    const count = selectedIds.length;
    handleBulkCampaignStatusChange(selectedIds, status);
    setSelectedIds([]);
    setBulkBeendenConfirm(false);
    const label = status === "Aktiv" ? "aktiviert" : status === "Pausiert" ? "pausiert" : "beendet und archiviert";
    setStatusMessage(`${count} Kampagne${count !== 1 ? "n" : ""} ${label}.`);
  };

  const handleBeenden = () => {
    if (!selectedCampaign) return;
    handleCampaignStatusChange(selectedCampaign.id, "Beendet" as CampaignStatus);
    setBeendenConfirm(false);
    setStatusMessage("Kampagne beendet und ins Archiv verschoben.");
  };

  return (
    <>
    <div className="space-y-6">
      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        <DarkCard title="Aktiv" subtitle="Kampagnenstatus">
          <div className="text-3xl font-bold">{aktive.length}</div>
          <div className="text-sm text-slate-300 mt-2">laufende Kampagnen</div>
        </DarkCard>
        <DarkCard title="Pausiert" subtitle="Pipeline">
          <div className="text-3xl font-bold">{pausiert.length}</div>
          <div className="text-sm text-slate-300 mt-2">pausierte Kampagnen</div>
        </DarkCard>
        <DarkCard title="Media Budget" subtitle="Aktiv">
          <div className="text-3xl font-bold">
            {totalMediaBudget > 0 ? totalMediaBudget.toLocaleString("de-DE") + " €" : "—"}
          </div>
          <div className="text-sm text-slate-300 mt-2">aktives Kampagnenbudget</div>
        </DarkCard>
        <DarkCard title="Plattform-Fee" subtitle="2 %">
          <div className="text-3xl font-bold">
            {isPaidPlan ? (totalMediaBudget * 0.02).toLocaleString("de-DE") + " €" : "—"}
          </div>
          <div className="text-sm text-slate-300 mt-2">
            {isPaidPlan ? "monatliche Fee" : "nur bei Growth & Pro"}
          </div>
        </DarkCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ── Kampagnenliste ── */}
        <LightCard title="Kampagnenliste" subtitle="Management">
          <div className="space-y-3">
            <button
              onClick={handleReset}
              className="w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              + Neue Kampagne
            </button>

            {/* ── Bulk-Aktionen Toolbar ── */}
            {selectedIds.length > 0 && (
              <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-800">
                    {selectedIds.length} Kampagne{selectedIds.length !== 1 ? "n" : ""} ausgewählt
                  </span>
                  <button
                    onClick={() => setSelectedIds([])}
                    className="text-[10px] text-blue-500 hover:text-blue-700"
                  >
                    Abwählen
                  </button>
                </div>

                {bulkBeendenConfirm ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 space-y-2">
                    <p className="text-xs text-red-700 font-medium">
                      {selectedIds.length} Kampagne{selectedIds.length !== 1 ? "n" : ""} wirklich beenden?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleBulkAction("Beendet" as CampaignStatus)}
                        className="flex-1 rounded-lg bg-red-600 text-white py-1.5 text-xs font-semibold hover:bg-red-700"
                      >
                        Ja, beenden
                      </button>
                      <button
                        onClick={() => setBulkBeendenConfirm(false)}
                        className="flex-1 rounded-lg border border-slate-300 bg-white text-slate-700 py-1.5 text-xs font-medium hover:bg-slate-50"
                      >
                        Abbrechen
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleBulkAction("Aktiv")}
                      className="flex-1 rounded-lg bg-emerald-600 text-white py-1.5 text-xs font-semibold hover:bg-emerald-700 transition-colors"
                    >
                      Aktivieren
                    </button>
                    <button
                      onClick={() => handleBulkAction("Pausiert")}
                      className="flex-1 rounded-lg bg-amber-500 text-white py-1.5 text-xs font-semibold hover:bg-amber-600 transition-colors"
                    >
                      Pausieren
                    </button>
                    <button
                      onClick={() => setBulkBeendenConfirm(true)}
                      className="flex-1 rounded-lg bg-red-500 text-white py-1.5 text-xs font-semibold hover:bg-red-600 transition-colors"
                    >
                      Beenden
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* A) Aktive Kampagnen — Header mit "Alle auswählen" */}
            <div className="flex items-center justify-between px-1 pt-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                Aktive Kampagnen
              </p>
              {allVisible.length > 0 && (
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center gap-1.5 text-[10px] text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <span
                    className="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0"
                    style={{
                      borderColor: allSelected ? "#3b82f6" : "#cbd5e1",
                      backgroundColor: allSelected ? "#3b82f6" : "white",
                    }}
                  >
                    {allSelected && (
                      <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  Alle
                </button>
              )}
            </div>

            {aktive.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 text-center space-y-1">
                <div className="text-xs font-medium text-slate-500">Noch keine aktiven Kampagnen</div>
                <div className="text-xs text-slate-400">Erste Kampagne im Dashboard erstellen</div>
              </div>
            ) : (
              aktive.map((c) => (
                <CampaignRow
                  key={c.id}
                  campaign={c}
                  selected={selectedIds.includes(c.id)}
                  onSelect={toggleSelect}
                  onOpen={handleCampaignOpen}
                />
              ))
            )}

            {/* Trennlinie */}
            <div className="border-t border-slate-200 pt-1" />

            {/* B) Pausierte Kampagnen */}
            <SectionToggle
              label="Pausiert"
              count={pausiert.length}
              open={pauseOpen}
              onToggle={() => setPauseOpen((o) => !o)}
            />
            {pauseOpen && (
              <div className="space-y-2">
                {pausiert.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-400">
                    Keine pausierten Kampagnen
                  </div>
                ) : (
                  pausiert.map((c) => (
                    <CampaignRow
                      key={c.id}
                      campaign={c}
                      selected={selectedIds.includes(c.id)}
                      onSelect={toggleSelect}
                      onOpen={handleCampaignOpen}
                    />
                  ))
                )}
              </div>
            )}

            {/* Trennlinie */}
            <div className="border-t border-slate-200 pt-1" />

            {/* C) Archiv */}
            <SectionToggle
              label="Archiv"
              count={archiv.length}
              open={archivOpen}
              onToggle={() => setArchivOpen((o) => !o)}
            />
            {archivOpen && (
              <div className="space-y-2">
                {archiv.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-400">
                    Kein Archiv vorhanden
                  </div>
                ) : (
                  archiv.map((c) => (
                    <CampaignRow
                      key={c.id}
                      campaign={c}
                      selected={selectedIds.includes(c.id)}
                      onSelect={toggleSelect}
                      onOpen={handleCampaignOpen}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        </LightCard>

        {/* ── Kampagnenoptionen ── */}
        <DarkCard title="Kampagnenoptionen" subtitle="Data Layer">
          <div className="space-y-3 text-sm text-slate-200">
            {[
              "Datenanbieter zuweisen",
              "Verification aktivieren",
              "Custom Segmente laden",
              "Audience Sync",
              "Geo / Device / Kanal",
              "Frequenz & Guardrails",
            ].map((item) => (
              <button key={item} className="w-full rounded-2xl bg-slate-800 p-4 text-left hover:bg-slate-700">
                {item}
              </button>
            ))}
          </div>
        </DarkCard>

        {/* ── Kampagnen-Aktionen ── */}
        <LightCard title="Kampagnen-Aktionen" subtitle="Steuerung">
          {selectedCampaign ? (
            <div className="space-y-3 text-sm">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-semibold">{selectedCampaign.name}</div>
                  <button
                    onClick={() => openEdit(selectedCampaign)}
                    className="shrink-0 text-xs border border-slate-300 rounded-lg px-2 py-1 bg-white hover:bg-slate-100 transition-colors"
                  >
                    ✏ Bearbeiten
                  </button>
                </div>
                <div className="mt-1">
                  <CopyIdField value={selectedCampaign.id} />
                </div>
                <div className="text-xs mt-1">
                  <span className="rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5">
                    {selectedCampaign.status}
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleCampaignStatusChange(selectedCampaign.id, "Aktiv")}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left hover:bg-slate-100"
              >
                Aktivieren
              </button>

              <button
                onClick={() => {
                  handleCampaignStatusChange(selectedCampaign.id, "Pausiert");
                  setStatusMessage("Kampagne pausiert.");
                }}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left hover:bg-slate-100"
              >
                Pausieren
              </button>

              <button
                onClick={() => handleCampaignDuplicate(selectedCampaign)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left hover:bg-slate-100"
              >
                Duplizieren
              </button>

              <button
                disabled
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left opacity-50 cursor-not-allowed flex items-center justify-between"
                title="Coming soon"
              >
                Exportieren
                <span className="text-[9px] font-bold uppercase tracking-wider border border-slate-300 text-slate-400 rounded-full px-1.5 py-0.5">Soon</span>
              </button>

              {/* Beenden mit Sicherheitsabfrage */}
              {beendenConfirm ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 space-y-3">
                  <p className="text-xs text-red-700 font-medium">
                    Kampagne wirklich beenden? Diese Aktion kann nicht rückgängig gemacht werden.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleBeenden}
                      className="flex-1 rounded-xl bg-red-600 text-white py-2 text-xs font-semibold hover:bg-red-700 transition-colors"
                    >
                      Ja, beenden
                    </button>
                    <button
                      onClick={() => setBeendenConfirm(false)}
                      className="flex-1 rounded-xl border border-slate-300 bg-white text-slate-700 py-2 text-xs font-medium hover:bg-slate-50 transition-colors"
                    >
                      Abbrechen
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setBeendenConfirm(true)}
                  className="w-full rounded-2xl border border-red-200 bg-red-50 p-4 text-left text-red-700 hover:bg-red-100 transition-colors"
                >
                  Beenden
                </button>
              )}

              {/* Agentic Analyse — nur für aktive Kampagnen */}
              {selectedCampaign.status === "Aktiv" && (
                (selectedCampaign as any).agentic_enabled ? (
                  <div className="w-full rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span className="text-sm font-semibold text-emerald-700">⚡ Agentic aktiv</span>
                  </div>
                ) : (
                  <button
                    onClick={() => onAgenticAnalyse(selectedCampaign.supabase_id ?? selectedCampaign.id)}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-900 p-4 text-left text-white font-semibold text-sm hover:bg-slate-800 transition-colors"
                  >
                    ⚡ Agentic Analyse starten
                  </button>
                )
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              Bitte zuerst eine Kampagne aus der Liste anklicken.
            </div>
          )}
        </LightCard>
      </div>

      {/* ── Kampagnen-Detailansicht ── */}
      {selectedCampaign && (() => {
        const c = selectedCampaign as any;
        const budget = c.budget_total || c.budget;
        const budgetFormatted = budget && budget !== "—"
          ? `${Number(budget).toLocaleString("de-DE")} €`
          : "—";
        const laufzeit = c.campaign_start && c.campaign_end
          ? `${c.campaign_start} – ${c.campaign_end}`
          : null;
        const devices = Array.isArray(c.devices) && c.devices.length > 0
          ? c.devices.join(", ")
          : null;

        const fields = [
          { label: "Campaign ID", value: c.id },
          { label: "Status", value: c.status },
          { label: "DSP", value: c.dsp || "—" },
          { label: "KPI", value: c.primary_kpi || c.kpi || "—" },
          { label: "Budget", value: budgetFormatted },
          { label: "Ziel", value: c.objective || "—" },
          ...(laufzeit ? [{ label: "Laufzeit", value: laufzeit }] : []),
          ...(c.market ? [{ label: "Markt", value: c.market }] : []),
          ...(c.bid_strategy ? [{ label: "Bid Strategy", value: c.bid_strategy }] : []),
          ...(c.pacing ? [{ label: "Pacing", value: c.pacing }] : []),
          ...(devices ? [{ label: "Devices", value: devices }] : []),
          { label: "Datenanbieter", value: c.datenanbieter || "—" },
          { label: "Verification", value: c.verification || "—" },
        ];

        return (
          <LightCard title="Kampagnen-Details" subtitle="">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {fields.map(({ label, value }) => (
                <div key={label} className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                  <div className="text-slate-500 mb-1">{label}</div>
                  <div className="font-semibold">{value}</div>
                </div>
              ))}
            </div>
          </LightCard>
        );
      })()}
    </div>

    {/* ── Edit Modal ─────────────────────────────────────────────── */}
    {editOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400 mb-1">Kampagne</div>
              <h2 className="text-xl font-bold">Bearbeiten</h2>
            </div>
            <button onClick={() => setEditOpen(false)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
          </div>
          {editLoading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-500">
              <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
              <span className="text-sm">Lade Kampagnendaten…</span>
            </div>
          ) : (<>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {/* Name */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Kampagnenname</label>
              <input name="name" value={editForm.name ?? ""} onChange={handleEditChange}
                className="w-full border border-slate-200 rounded-2xl p-3 bg-slate-50" />
            </div>
            {/* Budget */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Gesamtbudget</label>
              <input name="budget" value={editForm.budget ?? ""} onChange={handleEditChange}
                className="w-full border border-slate-200 rounded-2xl p-3 bg-slate-50" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Tagesbudget</label>
              <input name="budget_daily" value={(editForm as any).budget_daily ?? ""} onChange={handleEditChange}
                className="w-full border border-slate-200 rounded-2xl p-3 bg-slate-50" />
            </div>
            {/* Laufzeit */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Kampagnenstart</label>
              <input name="campaign_start" type="date" value={editForm.campaign_start ?? ""} onChange={handleEditChange}
                className="w-full border border-slate-200 rounded-2xl p-3 bg-slate-50" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Kampagnenende</label>
              <input name="campaign_end" type="date" value={editForm.campaign_end ?? ""} onChange={handleEditChange}
                className="w-full border border-slate-200 rounded-2xl p-3 bg-slate-50" />
            </div>
            {/* DSP / Markt / Kanal */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">DSP</label>
              <select name="dsp" value={editForm.dsp ?? ""} onChange={handleEditChange}
                className="w-full border border-slate-200 rounded-2xl p-3 bg-slate-50">
                {["DV360","The Trade Desk","Xandr"].map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Markt</label>
              <select name="market" value={(editForm as any).market ?? ""} onChange={handleEditChange}
                className="w-full border border-slate-200 rounded-2xl p-3 bg-slate-50">
                {["DACH","Deutschland","Europa"].map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Kanal</label>
              <select name="kanal" value={(editForm as any).kanal ?? ""} onChange={handleEditChange}
                className="w-full border border-slate-200 rounded-2xl p-3 bg-slate-50">
                {["Programmatic Display","Display + DOOH","Display + DOOH + CTV"].map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
            {/* Automationsmodus */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Automationsmodus</label>
              <select name="automationsmodus" value={(editForm as any).automationsmodus ?? ""} onChange={handleEditChange}
                className="w-full border border-slate-200 rounded-2xl p-3 bg-slate-50">
                {["Assistiert","Mit manueller Freigabe","Auto-Optimierung light"].map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
            {/* Bid Strategy / Price */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Bid Strategy</label>
              <select name="bid_strategy" value={editForm.bid_strategy ?? ""} onChange={handleEditChange}
                className="w-full border border-slate-200 rounded-2xl p-3 bg-slate-50">
                {["Fixed Bid","Optimized Bid","Goal-based"].map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Bid Price (CPM €)</label>
              <input name="bid_price" value={editForm.bid_price ?? ""} onChange={handleEditChange}
                className="w-full border border-slate-200 rounded-2xl p-3 bg-slate-50" />
            </div>
            {/* Frequency Cap */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Frequency Cap (Impressions)</label>
              <input name="freq_cap_impressions" value={editForm.freq_cap_impressions ?? ""} onChange={handleEditChange}
                className="w-full border border-slate-200 rounded-2xl p-3 bg-slate-50" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Freq Cap Zeitraum</label>
              <select name="freq_cap_zeitraum" value={editForm.freq_cap_zeitraum ?? ""} onChange={handleEditChange}
                className="w-full border border-slate-200 rounded-2xl p-3 bg-slate-50">
                {["pro Tag","pro Woche"].map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
            {/* Objective / KPI */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Objective</label>
              <select name="objective" value={editForm.objective ?? ""} onChange={handleEditChange}
                className="w-full border border-slate-200 rounded-2xl p-3 bg-slate-50">
                {["Leadgenerierung","Brand Awareness","Traffic","Conversions","Abverkauf / Sales","App Install","Video Views","Reichweite"].map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Primary KPI</label>
              <select name="kpi" value={editForm.kpi ?? ""} onChange={handleEditChange}
                className="w-full border border-slate-200 rounded-2xl p-3 bg-slate-50">
                {["CPA","CPL","CTR","ROAS","CPC","CPM","Viewability","Conversions","Completion Rate"].map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
            {/* Datenanbieter / Verification */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Datenanbieter</label>
              <input name="datenanbieter" value={editForm.datenanbieter ?? ""} onChange={handleEditChange}
                className="w-full border border-slate-200 rounded-2xl p-3 bg-slate-50" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Verification</label>
              <input name="verification" value={editForm.verification ?? ""} onChange={handleEditChange}
                className="w-full border border-slate-200 rounded-2xl p-3 bg-slate-50" />
            </div>
          </div>
          <div className="p-6 pt-0 flex gap-3">
            <button
              onClick={handleEditSave}
              disabled={editSaving}
              className="flex-1 rounded-2xl bg-slate-900 text-white py-3 font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {editSaving ? "Wird gespeichert…" : "Speichern"}
            </button>
            <button
              onClick={() => setEditOpen(false)}
              className="flex-1 rounded-2xl border border-slate-300 bg-white text-slate-700 py-3 font-medium hover:bg-slate-50 transition-colors"
            >
              Abbrechen
            </button>
          </div>
          </>)}
        </div>
      </div>
    )}
    </>
  );
}
