"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { CampaignItem, CreativeLibraryItem, CreativeForm, CreativeStatus } from "../lib/types";
import { IAB_FORMATE, CREATIVE_TYPE_OPTIONEN } from "../lib/constants";
import { DarkCard, LightCard } from "./ui";
import { supabase } from "../lib/supabase";

// Dimension string → full IAB label (must match IAB_FORMATE labels in constants.ts)
const IAB_DIMENSION_MAP: Record<string, string> = {
  "300x250":  "300x250 – Medium Rectangle",
  "336x280":  "336x280 – Large Rectangle",
  "728x90":   "728x90 – Leaderboard",
  "970x90":   "970x90 – Large Leaderboard",
  "970x250":  "970x250 – Billboard",
  "300x600":  "300x600 – Half Page",
  "160x600":  "160x600 – Wide Skyscraper",
  "320x50":   "320x50 – Mobile Leaderboard",
  "320x100":  "320x100 – Large Mobile Banner",
  "300x50":   "300x50 – Mobile Banner",
  "1080x1080": "1080x1080 – Square Social / Display",
  "1920x1080": "1920x1080 – Full HD Video",
  "1080x1920": "1080x1920 – Vertical Video / Story",
};

type Props = {
  campaigns: CampaignItem[];
  creativeLibrary: CreativeLibraryItem[];
  selectedCreative: CreativeLibraryItem | null;
  creativeForm: CreativeForm;
  creativeFileInputRef: React.RefObject<HTMLInputElement | null>;
  fileUploadLoading: boolean;
  creativeLoading: boolean;
  loading: boolean;
  lastCampaignId: string | null;
  handleCreativeChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleCreativeFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCreativeSubmit: () => void;
  handleCreativeDelete: (id: string) => void;
  handleCreativeStatusChange: (id: string, status: CreativeStatus) => void;
  setSelectedCreative: (c: CreativeLibraryItem | null) => void;
  handleSaveDraft: () => void;
  handleSubmit: () => void;
  setActivePage: (page: string) => void;
  onFormatDetected?: (format: string) => void;
  onBundleSaved?: () => Promise<CreativeLibraryItem[]>;
  onBackToDashboard?: () => void;
  onCreativeFormUpdate?: (updates: Partial<CreativeForm>) => void;
  onCreativeCampaignAssigned?: (creativeId: string, campaignId: string) => void;
  onCreativeUpdate?: (id: string, updates: Partial<CreativeLibraryItem>) => void;
};

type CreativeFilter = "alle" | "Aktiv" | "Pausiert" | "Beendet" | string;

const BUNDLE_FORMATS = [
  { key: "medrec", label: "Medium Rectangle", size: "300×250px", width: 300, height: 250 },
  { key: "lb",     label: "Leaderboard",       size: "728×90px",  width: 728, height: 90  },
  { key: "sky",    label: "Wide Skyscraper",   size: "160×600px", width: 160, height: 600 },
] as const;

// ── Campaign ID input with inline copy icon ────────────────────────
function CampaignIdInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <input
        name="campaign_id"
        placeholder="Campaign ID"
        value={value}
        onChange={onChange}
        className="w-full border border-slate-200 rounded-2xl p-3 bg-slate-50 pr-10"
      />
      {value && (
        <button
          onClick={handleCopy}
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          title={copied ? "Kopiert!" : "In Zwischenablage kopieren"}
        >
          {copied ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2.5 7L5.5 10L11.5 4" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="4" y="4" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
              <path d="M2 9.5V2.5C2 1.95 2.45 1.5 3 1.5H10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}

export default function Creatives({
  campaigns,
  creativeLibrary,
  selectedCreative,
  creativeForm,
  creativeFileInputRef,
  fileUploadLoading,
  creativeLoading,
  loading,
  lastCampaignId,
  handleCreativeChange,
  handleCreativeFileChange,
  handleCreativeSubmit,
  handleCreativeDelete,
  handleCreativeStatusChange,
  setSelectedCreative,
  handleSaveDraft,
  handleSubmit,
  setActivePage,
  onBackToDashboard,
  onFormatDetected,
  onBundleSaved,
  onCreativeFormUpdate,
  onCreativeCampaignAssigned,
  onCreativeUpdate,
}: Props) {
  // ── Library state ──────────────────────────────────────────────
  const [selectedCreativeIds, setSelectedCreativeIds] = useState<string[]>([]);
  const [creativeFilter, setCreativeFilter] = useState<CreativeFilter>("Aktiv");
  const [bulkStatusTarget, setBulkStatusTarget] = useState<CreativeStatus | null>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

  // ── KI Generator state ─────────────────────────────────────────
  const [showGenerator, setShowGenerator] = useState(false);
  const [assigningCreativeId, setAssigningCreativeId] = useState<string | null>(null);
  const [assignSuccess, setAssignSuccess] = useState<string | null>(null);

  const handleAssignCampaign = async (creativeId: string, campaignId: string) => {
    const { error } = await supabase
      .from("creatives")
      .update({ campaign_id: campaignId })
      .eq("id", creativeId);
    if (!error) {
      handleCreativeStatusChange(creativeId, "Aktiv"); // updates status in parent library
      onCreativeCampaignAssigned?.(creativeId, campaignId); // updates campaign_id in parent library
      setAssignSuccess(creativeId);
      setTimeout(() => setAssignSuccess(null), 2000);
      // Update selectedCreative if it's the one being assigned
      if (selectedCreative?.id === creativeId) {
        setSelectedCreative({ ...selectedCreative, campaign_id: campaignId });
      }
    }
    setAssigningCreativeId(null);
  };

  const [genDesc, setGenDesc] = useState("");
  const [genZweck, setGenZweck] = useState("Awareness");
  const [genStil, setGenStil] = useState("Modern");
  const [genFarbe, setGenFarbe] = useState("#1e40af");
  const [genAkzent, setGenAkzent] = useState("#ffffff");
  const [genCampaignId, setGenCampaignId] = useState("");
  const [genLoading, setGenLoading] = useState(false);
  const [genImageUrl, setGenImageUrl] = useState<string | null>(null);
  const [genBundleLoading, setGenBundleLoading] = useState(false);
  const [genBundleSuccess, setGenBundleSuccess] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [logoFileName, setLogoFileName] = useState<string | null>(null);

  // ── Validation state ──────────────────────────────────────────
  const [saveAttempted, setSaveAttempted] = useState(false);

  // ── Library-to-form state ─────────────────────────────────────
  const [fromLibraryCreativeName, setFromLibraryCreativeName] = useState<string | null>(null);
  const [isFromLibrary, setIsFromLibrary] = useState(false);
  const [libraryCreativeId, setLibraryCreativeId] = useState("");
  const [librarySaving, setLibrarySaving] = useState(false);
  const [librarySaveMsg, setLibrarySaveMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const handleLoadFromLibrary = (creative: CreativeLibraryItem) => {
    onCreativeFormUpdate?.({
      campaign_id: lastCampaignId ?? creative.campaign_id ?? "",
      name: creative.name,
      type: creative.type || "display",
      format: creative.format || "",
      file_url: creative.file_url,
      destination_url: creative.destination_url || "",
      tracking_url: creative.tracking_url || "",
    });
    setFromLibraryCreativeName(creative.name);
    setIsFromLibrary(true);
    setLibraryCreativeId(creative.id);
    setLibrarySaveMsg(null);
    setSaveAttempted(false);
  };

  const handleLibraryCreativeSave = async () => {
    setLibrarySaving(true);
    setLibrarySaveMsg(null);
    const { error } = await supabase
      .from("creatives")
      .update({
        campaign_id: creativeForm.campaign_id || null,
        destination_url: creativeForm.destination_url || null,
        tracking_url: creativeForm.tracking_url || null,
      })
      .eq("id", libraryCreativeId);
    if (!error) {
      onCreativeUpdate?.(libraryCreativeId, {
        campaign_id: creativeForm.campaign_id,
        destination_url: creativeForm.destination_url,
        tracking_url: creativeForm.tracking_url,
      });
      // Also sync campaign assignment if changed
      if (creativeForm.campaign_id) {
        onCreativeCampaignAssigned?.(libraryCreativeId, creativeForm.campaign_id);
      }
      setIsFromLibrary(false);
      setLibraryCreativeId("");
      setFromLibraryCreativeName(null);
      onCreativeFormUpdate?.({ file_url: "", destination_url: "", tracking_url: "" });
      setSaveAttempted(false);
      setLibrarySaveMsg({ ok: true, text: "Creative aktualisiert ✓" });
      setTimeout(() => setLibrarySaveMsg(null), 3000);
    } else {
      setLibrarySaveMsg({ ok: false, text: `Fehler: ${error.message}` });
    }
    setLibrarySaving(false);
  };

  // ── Format detection state ────────────────────────────────────
  const [formatStatus, setFormatStatus] = useState<"idle" | "matched" | "warning">("idle");
  const [formatMessage, setFormatMessage] = useState("");

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Only attempt size detection for images
    if (file.type.startsWith("image/")) {
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const dim = `${img.naturalWidth}x${img.naturalHeight}`;
        const matchedLabel = IAB_DIMENSION_MAP[dim];
        if (matchedLabel) {
          onFormatDetected?.(matchedLabel);
          setFormatStatus("matched");
          setFormatMessage(`✓ Format erkannt: ${matchedLabel} — automatisch ausgewählt`);
        } else {
          setFormatStatus("warning");
          setFormatMessage(`⚠ Unbekanntes Format: ${img.naturalWidth}×${img.naturalHeight}px — kein Standard IAB-Format. Bitte prüfen oder manuell auswählen.`);
        }
        URL.revokeObjectURL(objectUrl);
      };
      img.src = objectUrl;
    }

    handleCreativeFileChange(e);
  };

  const handleLogoUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoBase64(e.target?.result as string);
      setLogoFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const genLogoInputRef = useRef<HTMLInputElement>(null);
  const canvasRefs = {
    medrec: useRef<HTMLCanvasElement>(null),
    lb:     useRef<HTMLCanvasElement>(null),
    sky:    useRef<HTMLCanvasElement>(null),
  };

  // Draw image onto all three canvases when URL arrives
  const drawCanvas = useCallback((canvas: HTMLCanvasElement | null, w: number, h: number, url: string) => {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      ctx.clearRect(0, 0, w, h);
      // cover-style: crop to fill
      const scale = Math.max(w / img.width, h / img.height);
      const sw = w / scale;
      const sh = h / scale;
      const sx = (img.width - sw) / 2;
      const sy = (img.height - sh) / 2;
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
    };
    img.onerror = () => {
      // fallback: draw solid colour placeholder
      ctx.fillStyle = "#e2e8f0";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#94a3b8";
      ctx.font = `${Math.min(w, h) * 0.12}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("Preview", w / 2, h / 2);
    };
    img.src = url;
  }, []);

  useEffect(() => {
    if (!genImageUrl) return;
    BUNDLE_FORMATS.forEach(({ key, width, height }) => {
      drawCanvas(canvasRefs[key].current, width, height, genImageUrl);
    });
  }, [genImageUrl, drawCanvas]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Generate ───────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!genDesc.trim()) return;
    setGenLoading(true);
    setGenError(null);
    setGenImageUrl(null);
    setGenBundleSuccess(false);
    try {
      const res = await fetch("/api/generate-creative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          beschreibung: genDesc,
          zweck: genZweck,
          stil: genStil,
          farben: { primary: genFarbe, accent: genAkzent },
          logoBase64: logoBase64 ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.image_url) throw new Error(data.error || "Generierung fehlgeschlagen");
      setGenImageUrl(data.image_url);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setGenLoading(false);
    }
  };

  // ── Sync campaign_id + name when lastCampaignId changes ───────
  // Only sets campaign_id and name — never overwrites destination_url/tracking_url
  useEffect(() => {
    if (!lastCampaignId || !onCreativeFormUpdate) return;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(lastCampaignId)) return;

    const currentCampaign = campaigns.find(
      (c) => c.supabase_id === lastCampaignId || c.id === lastCampaignId
    );
    if (currentCampaign) {
      const shortId = lastCampaignId.replace(/-/g, "").substring(0, 4).toUpperCase();
      const shortName = currentCampaign.name.split(" ").slice(0, 3).join(" ");
      // Partial update — only campaign_id and name, no URL fields
      onCreativeFormUpdate({
        campaign_id: lastCampaignId,
        name: `${shortName} · #${shortId}`,
      });
    } else {
      onCreativeFormUpdate({ campaign_id: lastCampaignId });
    }
  }, [lastCampaignId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-fill campaign when generator opens ───────────────────
  useEffect(() => {
    if (showGenerator && !genCampaignId) {
      const prefill = lastCampaignId
        ?? campaigns.find((c) => c.status === "Aktiv")?.supabase_id
        ?? campaigns.find((c) => c.status === "Aktiv")?.id
        ?? "";
      if (prefill) setGenCampaignId(prefill);
    }
  }, [showGenerator]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Bundle übernehmen ──────────────────────────────────────────
  const handleBundleUebernehmen = async () => {
    if (!genImageUrl) return;
    setGenBundleLoading(true);
    setGenError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      const campaignId = genCampaignId || lastCampaignId || null;

      const savedUrls: Record<string, string> = {};

      // Try canvas → blob → storage upload for each format
      for (const fmt of BUNDLE_FORMATS) {
        const canvas = canvasRefs[fmt.key].current;
        let fileUrl = genImageUrl; // fallback to original
        if (canvas) {
          try {
            const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
            if (blob) {
              const filename = `ki-bundle-${fmt.key}-${Date.now()}.png`;
              const { data: uploadData, error: uploadError } = await supabase.storage
                .from("creatives")
                .upload(filename, blob, { contentType: "image/png", upsert: false });
              if (!uploadError && uploadData) {
                const { data: { publicUrl } } = supabase.storage.from("creatives").getPublicUrl(uploadData.path);
                fileUrl = publicUrl;
              }
            }
          } catch {
            // canvas toBlob CORS failure → fall back to original URL
          }
        }
        savedUrls[fmt.key] = fileUrl;
      }

      const bundleBaseName = creativeForm.name?.trim()
        || campaigns.find((c) => c.id === campaignId || c.supabase_id === campaignId)?.name
        || "KI Bundle";

      const BUNDLE_SIZES: Record<string, string> = {
        medrec: "300x250",
        lb:     "728x90",
        sky:    "160x600",
      };

      // Insert 3 creative records
      const inserts = BUNDLE_FORMATS.map((fmt) => ({
        campaign_id: campaignId,
        name: `${bundleBaseName} · ${BUNDLE_SIZES[fmt.key] ?? fmt.size}`,
        type: "display",
        format: fmt.size.replace("×", "x").replace("px", ""),
        file_url: savedUrls[fmt.key],
        status: "Entwurf",
        ...(userId ? { user_id: userId } : {}),
      }));

      const { error: insertError } = await supabase.from("creatives").insert(inserts);
      if (insertError) throw new Error(insertError.message);

      setGenBundleSuccess(true);

      // Reload library and select first bundle creative
      if (onBundleSaved) {
        const fresh = await onBundleSaved();
        const first = fresh.find((c) => c.name.startsWith(bundleBaseName));
        if (first) setSelectedCreative(first);
      }
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Bundle-Speicherung fehlgeschlagen");
    } finally {
      setGenBundleLoading(false);
    }
  };

  // ── Filter / multi-select helpers ──────────────────────────────
  const activeCampaignIdsArray = campaigns
    .filter((c) => c.status === "Aktiv")
    .flatMap((c) => [c.id, c.supabase_id].filter(Boolean) as string[]);

  const filteredLibrary = creativeFilter === "alle"
    ? creativeLibrary
    : creativeLibrary.filter((c) => activeCampaignIdsArray.includes(c.campaign_id as string));

  const toggleSelect = (id: string) =>
    setSelectedCreativeIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const allSelected =
    filteredLibrary.length > 0 && filteredLibrary.every((c) => selectedCreativeIds.includes(c.id));

  const toggleSelectAll = () =>
    setSelectedCreativeIds(allSelected ? [] : filteredLibrary.map((c) => c.id));

  const handleBulkDelete = () => {
    selectedCreativeIds.forEach((id) => handleCreativeDelete(id));
    setSelectedCreativeIds([]);
    setBulkDeleteConfirm(false);
  };

  const handleBulkStatus = (status: CreativeStatus) => {
    selectedCreativeIds.forEach((id) => handleCreativeStatusChange(id, status));
    setSelectedCreativeIds([]);
    setBulkStatusTarget(null);
  };

  return (
    <div className="space-y-6">
      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        <DarkCard title="Display Assets" subtitle="Creatives">
          <div className="text-3xl font-bold">
            {creativeLibrary.filter((c) =>
              c.type === "display" && c.campaign_id != null && activeCampaignIdsArray.includes(c.campaign_id)
            ).length}
          </div>
          <div className="text-sm text-slate-300 mt-2">aktive Display-Assets</div>
        </DarkCard>
        <DarkCard title="Video Assets" subtitle="Creatives">
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-bold text-slate-400 border border-slate-600 rounded-full px-2 py-0.5 uppercase tracking-wider">Coming soon</span>
          </div>
          <div className="text-sm text-slate-500 mt-2">Video & CTV folgen in Kürze</div>
        </DarkCard>
        <DarkCard title="DOOH Motive" subtitle="Creatives">
          <div className="text-3xl font-bold">{creativeLibrary.filter((c) => c.type === "dooh").length}</div>
          <div className="text-sm text-slate-300 mt-2">für Screens verfügbar</div>
        </DarkCard>
        <DarkCard title="Freigaben offen" subtitle="Workflow">
          <div className="text-3xl font-bold">—</div>
          <div className="text-sm text-slate-300 mt-2">zur Prüfung</div>
        </DarkCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch">
        {/* ── Creative Upload ── */}
        <LightCard title="Creative Upload" subtitle="Asset Management">
          <div className="space-y-3 flex-1">
            <CampaignIdInput
              value={creativeForm.campaign_id}
              onChange={handleCreativeChange}
            />
            <input
              name="name"
              placeholder="Name wird automatisch generiert"
              value={creativeForm.name}
              onChange={handleCreativeChange}
              className="w-full border border-slate-200 rounded-2xl p-3 bg-slate-50"
            />
            <select
              name="type"
              value={creativeForm.type}
              onChange={handleCreativeChange}
              className="w-full border border-slate-200 rounded-2xl p-3 bg-slate-50"
              title="Video-Creatives folgen in Kürze"
            >
              {CREATIVE_TYPE_OPTIONEN.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}{opt.disabled ? " (Coming soon)" : ""}
                </option>
              ))}
            </select>
            <select
              name="format"
              value={creativeForm.format}
              onChange={handleCreativeChange}
              className={`w-full border border-slate-200 rounded-2xl p-3 bg-slate-50 ${
                !creativeForm.format ? "text-slate-400" : "text-slate-900"
              }`}
            >
              <option value="" disabled>Creative Format / IAB-Größe</option>
              {IAB_FORMATE.map((f) => (
                <option key={f.label} value={f.label} disabled={f.disabled}>
                  {f.label}{f.disabled ? " (Coming soon)" : ""}
                </option>
              ))}
            </select>

            <div>
              {creativeForm.file_url ? (
                /* ── Preview: file set (upload or library) ── */
                <div className={`rounded-2xl border overflow-hidden ${
                  fromLibraryCreativeName ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"
                }`}>
                  <div className="flex items-center justify-between px-4 py-2 border-b border-current border-opacity-10">
                    {fromLibraryCreativeName ? (
                      <span className="text-xs font-medium text-emerald-700">
                        Aus Bibliothek: {fromLibraryCreativeName}
                      </span>
                    ) : (
                      <span className="text-xs text-emerald-600 truncate max-w-[80%]">✓ {creativeForm.file_url}</span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        onCreativeFormUpdate?.({ file_url: "" });
                        setFromLibraryCreativeName(null);
                        setIsFromLibrary(false);
                        setLibraryCreativeId("");
                        setFormatStatus("idle");
                        setFormatMessage("");
                      }}
                      className="text-xs text-slate-400 hover:text-slate-700 underline shrink-0 ml-2"
                    >
                      Ändern
                    </button>
                  </div>
                  <div className="p-3">
                    <img
                      src={creativeForm.file_url}
                      alt="Vorschau"
                      className="w-full rounded-xl max-h-40 object-contain bg-white"
                    />
                  </div>
                </div>
              ) : (
                /* ── Upload: no file set yet ── */
                <div className={`rounded-2xl border bg-slate-50 overflow-hidden ${
                  saveAttempted && !creativeForm.file_url ? "border-red-400" : "border-slate-200"
                }`}>
                  <input
                    name="file_url"
                    placeholder="https://… oder Datei wählen"
                    value={creativeForm.file_url}
                    onChange={handleCreativeChange}
                    className="w-full px-4 py-3 bg-transparent text-sm outline-none"
                  />
                  <div className="flex items-center gap-3 px-4 py-2 border-t border-slate-200">
                    <span className="text-xs text-slate-400 flex-1 text-center">oder</span>
                  </div>
                  <div className="px-3 pb-3">
                    <input
                      ref={creativeFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileInputChange}
                      disabled={fileUploadLoading}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => creativeFileInputRef.current?.click()}
                      disabled={fileUploadLoading}
                      className="w-full rounded-xl border border-slate-300 bg-white py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                    >
                      {fileUploadLoading ? "Wird hochgeladen…" : "Datei hochladen"}
                    </button>
                  </div>
                </div>
              )}
              {saveAttempted && !creativeForm.file_url && (
                <p className="text-xs text-red-500 mt-1 px-1">Bitte lade eine Datei hoch oder hinterlege eine Creative-URL</p>
              )}
              {formatStatus === "matched" && (
                <p className="text-xs text-emerald-600 mt-1 px-1">{formatMessage}</p>
              )}
              {formatStatus === "warning" && (
                <p className="text-xs text-amber-600 mt-1 px-1">{formatMessage}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1 px-1">
                Ziel-URL <span className="text-red-500">*</span>
              </label>
              <input
                name="destination_url"
                placeholder="https://www.beispiel.de/landingpage"
                value={creativeForm.destination_url}
                onChange={handleCreativeChange}
                className={`w-full border rounded-2xl p-3 bg-slate-50 text-sm ${
                  saveAttempted && !creativeForm.destination_url ? "border-red-400" : "border-slate-200"
                }`}
              />
              {saveAttempted && !creativeForm.destination_url && (
                <p className="text-xs text-red-500 mt-1 px-1">Bitte hinterlege eine Ziel-URL (Landingpage der Kampagne)</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1 px-1">
                Tracking-URL <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                name="tracking_url"
                placeholder="https://tracking.beispiel.de/click?..."
                value={creativeForm.tracking_url}
                onChange={handleCreativeChange}
                className="w-full border border-slate-200 rounded-2xl p-3 bg-slate-50 text-sm"
              />
              <p className="text-xs text-slate-400 mt-1 px-1">Für Click-Tracking und Reporting</p>
            </div>

            {librarySaveMsg && (
              <p className={`text-xs px-1 ${librarySaveMsg.ok ? "text-emerald-600" : "text-red-500"}`}>
                {librarySaveMsg.text}
              </p>
            )}
            <button
              onClick={() => {
                setSaveAttempted(true);
                if (!creativeForm.file_url || !creativeForm.destination_url) return;
                if (isFromLibrary && libraryCreativeId) {
                  handleLibraryCreativeSave();
                } else {
                  handleCreativeSubmit();
                }
              }}
              disabled={creativeLoading || fileUploadLoading || librarySaving}
              className="w-full rounded-2xl bg-[#334155] text-white py-3 font-medium hover:opacity-90 disabled:opacity-50"
            >
              {(creativeLoading || librarySaving) ? "Creative wird gespeichert..." : "Creative speichern"}
            </button>

            <div className="pt-2 border-t border-slate-200 flex gap-3">
              <button
                onClick={handleSaveDraft}
                className="flex-1 rounded-2xl border border-slate-300 bg-white text-slate-700 py-3 text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Als Entwurf speichern
              </button>
              <button
                onClick={() => {
                  if (onBackToDashboard) {
                    onBackToDashboard();
                  } else {
                    setActivePage("Dashboard");
                  }
                }}
                className="flex-1 rounded-2xl bg-slate-900 text-white py-3 text-sm font-medium hover:opacity-90 transition-colors"
              >
                ← Zurück zum Dashboard
              </button>
            </div>
          </div>
        </LightCard>

        {/* ── Asset-Typen ── */}
        <DarkCard title="Asset-Typen" subtitle="Formate">
          <div className="flex flex-col flex-1">
            <div className="space-y-3 text-sm">
              {[
                { label: "Display Banner",  disabled: false },
                { label: "HTML5 Rich Media", disabled: false },
                { label: "Native Assets",   disabled: false },
                { label: "DOOH Motive",     disabled: false },
                { label: "Video Pre-Roll",  disabled: true  },
                { label: "CTV Spots",       disabled: true  },
              ].map(({ label, disabled }) => (
                <div
                  key={label}
                  className={`rounded-2xl p-4 flex items-center justify-between gap-2 ${
                    disabled ? "bg-slate-800/40 text-slate-500" : "bg-slate-800 text-slate-200"
                  }`}
                >
                  <span>{label}</span>
                  {disabled && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 border border-slate-600 rounded-full px-2 py-0.5 shrink-0">
                      Coming soon
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* KI Ad Bundle Button — fills remaining space */}
            <div className="mt-4 pt-4 border-t border-slate-700 flex-1 flex flex-col">
              <button
                onClick={() => { setShowGenerator((v) => !v); setGenImageUrl(null); setGenBundleSuccess(false); setGenError(null); setLogoBase64(null); setLogoFileName(null); }}
                className="flex-1 w-full flex flex-col items-center justify-center gap-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 px-4 py-8 text-center hover:bg-amber-500/20 transition"
              >
                <span className="text-lg font-semibold text-amber-300">✨ KI Ad Bundle erstellen</span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400 border border-amber-500/50 rounded-full px-2 py-0.5">
                  BETA
                </span>
              </button>
            </div>
          </div>
        </DarkCard>

        {/* ── Creative-Bibliothek ── */}
        <LightCard title="Creative-Bibliothek" subtitle="Multi-Select">
          <div className="flex flex-col flex-1 min-h-0 gap-3" style={{ overflow: "hidden" }}>
            <select
              value={creativeFilter}
              onChange={(e) => { setCreativeFilter(e.target.value as CreativeFilter); setSelectedCreativeIds([]); }}
              className="w-full border border-slate-200 rounded-2xl p-2.5 bg-slate-50 text-sm shrink-0"
            >
              <option value="alle">Alle Creatives</option>
              <option value="Aktiv">Aktive Kampagnen</option>
              <option value="Pausiert">Pausierte Kampagnen</option>
              <option value="Beendet">Beendete Kampagnen</option>
            </select>

            {selectedCreativeIds.length > 0 && (
              <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-800">
                    {selectedCreativeIds.length} Creative{selectedCreativeIds.length !== 1 ? "s" : ""} ausgewählt
                  </span>
                  <button onClick={() => setSelectedCreativeIds([])} className="text-[10px] text-blue-500 hover:text-blue-700">
                    Abwählen
                  </button>
                </div>
                {bulkDeleteConfirm ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 space-y-2">
                    <p className="text-xs text-red-700 font-medium">
                      {selectedCreativeIds.length} Creative{selectedCreativeIds.length !== 1 ? "s" : ""} wirklich löschen?
                    </p>
                    <div className="flex gap-2">
                      <button onClick={handleBulkDelete} className="flex-1 rounded-lg bg-red-600 text-white py-1.5 text-xs font-semibold hover:bg-red-700">Ja, löschen</button>
                      <button onClick={() => setBulkDeleteConfirm(false)} className="flex-1 rounded-lg border border-slate-300 bg-white text-slate-700 py-1.5 text-xs font-medium">Abbrechen</button>
                    </div>
                  </div>
                ) : bulkStatusTarget ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-2">
                    <p className="text-xs text-amber-800 font-medium">Status auf &quot;{bulkStatusTarget}&quot; setzen?</p>
                    <div className="flex gap-2">
                      <button onClick={() => handleBulkStatus(bulkStatusTarget)} className="flex-1 rounded-lg bg-amber-500 text-white py-1.5 text-xs font-semibold hover:bg-amber-600">Bestätigen</button>
                      <button onClick={() => setBulkStatusTarget(null)} className="flex-1 rounded-lg border border-slate-300 bg-white text-slate-700 py-1.5 text-xs font-medium">Abbrechen</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => setBulkStatusTarget("Aktiv")} className="flex-1 rounded-lg bg-emerald-600 text-white py-1.5 text-xs font-semibold hover:bg-emerald-700">Aktivieren</button>
                    <button onClick={() => setBulkStatusTarget("Pausiert")} className="flex-1 rounded-lg bg-amber-500 text-white py-1.5 text-xs font-semibold hover:bg-amber-600">Pausieren</button>
                    <button onClick={() => setBulkDeleteConfirm(true)} className="flex-1 rounded-lg bg-red-500 text-white py-1.5 text-xs font-semibold hover:bg-red-600">Löschen</button>
                  </div>
                )}
              </div>
            )}

            <div style={{ overflowY: "auto", flex: 1, minHeight: 0 }} className="space-y-3 pr-1">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest">
                {filteredLibrary.length} Creative{filteredLibrary.length !== 1 ? "s" : ""}
              </span>
              {filteredLibrary.length > 0 && (
                <button onClick={toggleSelectAll} className="flex items-center gap-1.5 text-[10px] text-slate-400 hover:text-slate-600 transition-colors">
                  <span className="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0"
                    style={{ borderColor: allSelected ? "#3b82f6" : "#cbd5e1", backgroundColor: allSelected ? "#3b82f6" : "white" }}>
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

            {filteredLibrary.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-400 space-y-1">
                <div className="font-medium text-slate-500">
                  {creativeLibrary.length === 0 ? "Noch keine Creatives hochgeladen" : "Keine Creatives für diesen Filter"}
                </div>
                {creativeLibrary.length === 0 && (
                  <div className="text-slate-400">Lade ein Creative hoch oder erstelle ein KI Ad Bundle.</div>
                )}
              </div>
            ) : (() => {
                // Group by campaign_id
                const groups = filteredLibrary.reduce<Record<string, typeof filteredLibrary>>((acc, c) => {
                  const key = c.campaign_id || "__none__";
                  if (!acc[key]) acc[key] = [];
                  acc[key].push(c);
                  return acc;
                }, {});

                return Object.entries(groups).map(([groupKey, groupCreatives]) => {
                  const campaign = campaigns.find((k) => k.id === groupKey);
                  const groupLabel = campaign
                    ? campaign.name
                    : groupKey === "__none__"
                    ? "Ohne Kampagne"
                    : groupKey;

                  return (
                    <div key={groupKey} className="space-y-2">
                      <div className="flex items-center gap-2 px-1 pt-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">
                          {groupLabel}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {groupCreatives.length} Creative{groupCreatives.length !== 1 ? "s" : ""}
                        </span>
                        <div className="flex-1 h-px bg-slate-200" />
                      </div>

                      {groupCreatives.map((creative) => {
                        const isSelected = selectedCreativeIds.includes(creative.id);
                        return (
                          <div key={creative.id}
                            className={`w-full rounded-2xl border p-4 flex items-center gap-3 transition-colors ${
                              isSelected ? "border-blue-400 bg-blue-50 ring-2 ring-blue-100" : "border-slate-200 bg-slate-50"
                            }`}
                          >
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleSelect(creative.id); }}
                              className="shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors"
                              style={{ borderColor: isSelected ? "#3b82f6" : "#cbd5e1", backgroundColor: isSelected ? "#3b82f6" : "white" }}
                              aria-label={isSelected ? "Abwählen" : "Auswählen"}
                            >
                              {isSelected && (
                                <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                            </button>
                            <button onClick={() => setSelectedCreative(creative as CreativeLibraryItem)} className="flex-1 text-left min-w-0">
                              <div className="font-semibold truncate">{creative.name}</div>
                              <div className="text-xs text-slate-500 mt-1">{creative.type} · {creative.status}</div>
                              {!creative.campaign_id && (
                                <div className="text-[10px] text-amber-500 mt-0.5">Keine Kampagne</div>
                              )}
                            </button>
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleLoadFromLibrary(creative as CreativeLibraryItem); }}
                                className="text-[10px] text-blue-600 hover:text-blue-800 border border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-lg px-1.5 py-0.5 transition-colors whitespace-nowrap"
                                title="In Upload-Formular übernehmen"
                              >
                                ← Übernehmen
                              </button>
                              {assignSuccess === creative.id ? (
                                <span className="text-[10px] text-emerald-600">✓ Zugeordnet</span>
                              ) : assigningCreativeId === creative.id ? (
                                <select
                                  autoFocus
                                  className="text-xs border border-slate-200 rounded-lg p-1 bg-white max-w-[120px]"
                                  defaultValue=""
                                  onBlur={() => setAssigningCreativeId(null)}
                                  onChange={(e) => {
                                    if (e.target.value) handleAssignCampaign(creative.id, e.target.value);
                                  }}
                                >
                                  <option value="" disabled>Kampagne…</option>
                                  {campaigns
                                    .filter((c) => c.status === "Aktiv")
                                    .map((c) => (
                                      <option key={c.id} value={c.supabase_id ?? c.id}>{c.name}</option>
                                    ))}
                                </select>
                              ) : (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setAssigningCreativeId(creative.id); }}
                                  className="text-[10px] text-slate-400 hover:text-slate-600 border border-slate-200 rounded-lg px-1.5 py-0.5 transition-colors"
                                  title="Kampagne zuordnen"
                                >
                                  {creative.campaign_id ? "↔" : "+ Kampagne"}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                });
              })()
            }
            </div>{/* end scroll wrapper */}
          </div>{/* end flex col */}
        </LightCard>
      </div>

      {/* ── KI Ad Bundle Generator Panel ── */}
      {showGenerator && (
        <div className="rounded-3xl border border-amber-200 bg-amber-50/60 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-amber-500/10 border-b border-amber-200">
            <div className="flex items-center gap-3">
              <span className="text-lg">✨</span>
              <div>
                <h3 className="font-bold text-slate-800">KI Ad Bundle Generator</h3>
                <p className="text-xs text-slate-500">3 IAB-Formate automatisch aus einer Beschreibung generieren</p>
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-amber-600 bg-amber-100 border border-amber-300 rounded-full px-2 py-0.5">BETA</span>
            </div>
            <button
              onClick={() => setShowGenerator(false)}
              className="text-slate-400 hover:text-slate-600 text-xl leading-none transition"
            >
              ×
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* A — Beschreibung */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-widest block mb-1.5">
                    Beschreibung
                  </label>
                  <textarea
                    value={genDesc}
                    onChange={(e) => setGenDesc(e.target.value)}
                    placeholder="z.B. 'Sportschuhe für junge Männer, energetisch, blau-weiß, Aktion: Jetzt kaufen'"
                    rows={3}
                    className="w-full border border-slate-200 rounded-2xl p-3 bg-white text-sm resize-none focus:outline-none focus:border-amber-400 transition"
                  />
                </div>

                {/* B — Details */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">Zweck</label>
                    <select
                      value={genZweck}
                      onChange={(e) => setGenZweck(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl p-2.5 bg-white text-sm"
                    >
                      <option>Awareness</option>
                      <option>Conversion</option>
                      <option>Retargeting</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">Stil</label>
                    <select
                      value={genStil}
                      onChange={(e) => setGenStil(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl p-2.5 bg-white text-sm"
                    >
                      <option>Modern</option>
                      <option>Klassisch</option>
                      <option>Minimalistisch</option>
                      <option>Bold</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">Hauptfarbe</label>
                    <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 bg-white">
                      <input type="color" value={genFarbe} onChange={(e) => setGenFarbe(e.target.value)} className="w-6 h-6 rounded cursor-pointer border-0 p-0 bg-transparent" />
                      <span className="text-sm text-slate-600 font-mono">{genFarbe}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">Akzentfarbe</label>
                    <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 bg-white">
                      <input type="color" value={genAkzent} onChange={(e) => setGenAkzent(e.target.value)} className="w-6 h-6 rounded cursor-pointer border-0 p-0 bg-transparent" />
                      <span className="text-sm text-slate-600 font-mono">{genAkzent}</span>
                    </div>
                  </div>
                </div>

                {/* Kampagne */}
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Kampagne</label>
                  <select
                    value={genCampaignId}
                    onChange={(e) => setGenCampaignId(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 bg-white text-sm"
                  >
                    <option value="">Keine Kampagne ausgewählt</option>
                    {campaigns
                      .filter((c) => c.status === "Aktiv")
                      .map((c) => {
                        const val = c.supabase_id ?? c.id;
                        return (
                          <option key={c.id} value={val}>{c.name}</option>
                        );
                      })}
                  </select>
                  {!genCampaignId && (
                    <p className="text-xs text-amber-600 mt-1">
                      Keine Kampagne ausgewählt — Creative wird ohne Kampagnenzuordnung gespeichert
                    </p>
                  )}
                </div>

                {/* C — Logo */}
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Logo / Vorlage (optional)</label>
                  <input
                    ref={genLogoInputRef}
                    type="file"
                    accept="image/png,image/jpeg"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleLogoUpload(file);
                    }}
                  />
                  <button
                    onClick={() => genLogoInputRef.current?.click()}
                    className={`w-full rounded-xl border border-dashed py-3 text-sm transition text-center ${
                      logoBase64
                        ? "border-amber-400 bg-amber-50 text-amber-700"
                        : "border-slate-300 text-slate-500 hover:border-amber-400 hover:text-amber-600"
                    }`}
                  >
                    {logoFileName ? `✓ ${logoFileName}` : "Logo hochladen (PNG, max 2 MB)"}
                  </button>
                  {logoBase64 && (
                    <button
                      onClick={() => { setLogoBase64(null); setLogoFileName(null); }}
                      className="text-xs text-slate-400 hover:text-slate-600 mt-1 transition"
                    >
                      Logo entfernen
                    </button>
                  )}
                  <p className="text-xs text-slate-400 mt-1">Logo wird als Stil-Referenz für die KI genutzt</p>
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleGenerate}
                  disabled={!genDesc.trim() || genLoading}
                  className="w-full rounded-2xl bg-amber-500 text-white py-3 font-semibold text-sm hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                >
                  {genLoading ? (
                    <>
                      <span className="inline-flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: "300ms" }} />
                      </span>
                      KI erstellt dein Bundle...
                    </>
                  ) : "✨ Ad Bundle generieren"}
                </button>

                {genError && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {genError}
                  </div>
                )}
              </div>

              {/* Preview Panel */}
              <div>
                {genImageUrl ? (
                  <div className="space-y-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Vorschau — 3 IAB-Formate</p>
                    <div className="space-y-4 overflow-x-auto">
                      {BUNDLE_FORMATS.map(({ key, label, size, width, height }) => (
                        <div key={key} className="space-y-1">
                          <p className="text-xs text-slate-500">{label} — {size}</p>
                          <div className="rounded-xl overflow-hidden border border-slate-200 bg-white inline-block max-w-full">
                            <canvas
                              ref={canvasRefs[key]}
                              width={width}
                              height={height}
                              style={{ display: "block", maxWidth: "100%", height: "auto" }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {genBundleSuccess ? (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 font-medium">
                        ✓ 3 Creatives wurden zur Bibliothek hinzugefügt
                      </div>
                    ) : (
                      <div className="flex gap-3 flex-wrap">
                        <button
                          onClick={handleGenerate}
                          disabled={genLoading}
                          className="flex-1 rounded-2xl border border-slate-300 bg-white text-slate-700 py-2.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-40 transition"
                        >
                          Neu generieren
                        </button>
                        <button
                          onClick={handleBundleUebernehmen}
                          disabled={genBundleLoading}
                          className="flex-1 rounded-2xl bg-slate-900 text-white py-2.5 text-sm font-semibold hover:bg-slate-800 disabled:opacity-40 transition"
                        >
                          {genBundleLoading ? "Wird gespeichert..." : "Bundle übernehmen"}
                        </button>
                        <button
                          onClick={() => setShowGenerator(false)}
                          className="rounded-2xl border border-slate-200 bg-slate-50 text-slate-500 px-4 py-2.5 text-sm hover:bg-slate-100 transition"
                        >
                          Abbrechen
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full min-h-48 rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50/40 flex flex-col items-center justify-center text-center p-6 space-y-2">
                    <div className="text-3xl">🎨</div>
                    <p className="text-sm text-slate-500">Beschreibung eingeben und<br/><strong>Ad Bundle generieren</strong> klicken</p>
                    <p className="text-xs text-slate-400">DALL-E 3 · 3 IAB-Formate</p>
                  </div>
                )}
              </div>
            </div>

            {/* BETA Disclaimer */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 leading-relaxed">
              <strong>Beta-Hinweis:</strong> Diese Funktion befindet sich im Beta-Stadium. KI-generierte Werbemittel sollten vor dem Einsatz auf Markenkonformität geprüft werden. Alle Rechte an generierten Bildern liegen beim Nutzer.
            </div>
          </div>
        </div>
      )}

      {/* ── Creative-Detailansicht ── */}
      {(() => {
        const full = selectedCreative
          ? (creativeLibrary.find((c) => c.id === selectedCreative.id) ?? selectedCreative)
          : null;

        // All creatives belonging to the current campaign
        const campaignCreatives = lastCampaignId
          ? creativeLibrary.filter((c) => c.campaign_id === lastCampaignId)
          : [];

        return (
          <LightCard title="Creative-Detailansicht" subtitle="Creative Details">
            {full ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                  <div className="text-slate-500 mb-1">Creative Name</div>
                  <div className="font-semibold">{full.name}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                  <div className="text-slate-500 mb-1">Creative ID</div>
                  <div className="font-semibold text-xs break-all">{full.id}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                  <div className="text-slate-500 mb-1">Format</div>
                  <div className="font-semibold">{full.format || "—"}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                  <div className="text-slate-500 mb-1">Typ</div>
                  <div className="font-semibold">{full.type}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                  <div className="text-slate-500 mb-1">🔗 Ziel-URL</div>
                  {full.destination_url ? (
                    <a href={full.destination_url} target="_blank" rel="noopener noreferrer"
                      className="font-semibold text-blue-600 hover:underline break-all">
                      {full.destination_url}
                    </a>
                  ) : <div className="text-slate-400">—</div>}
                </div>
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                  <div className="text-slate-500 mb-1">📊 Tracking-URL</div>
                  {full.tracking_url ? (
                    <a href={full.tracking_url} target="_blank" rel="noopener noreferrer"
                      className="font-semibold text-blue-600 hover:underline break-all">
                      {full.tracking_url}
                    </a>
                  ) : <div className="text-slate-400">Nicht gesetzt</div>}
                </div>
                {/* Image preview */}
                <div className="md:col-span-2 rounded-2xl bg-slate-50 border border-slate-200 p-4">
                  <div className="text-slate-500 mb-3">Vorschau</div>
                  {full.file_url ? (
                    <img
                      src={full.file_url}
                      alt={full.name}
                      className="w-full rounded-xl object-contain max-h-64 bg-white"
                    />
                  ) : (
                    <div className="h-40 rounded-2xl border border-dashed border-slate-300 bg-white flex items-center justify-center text-slate-400">
                      {full.format ? `${full.format} — kein Bild` : "Kein Bild vorhanden"}
                    </div>
                  )}
                </div>
                {/* IAB format preview */}
                <div className="md:col-span-2 rounded-2xl bg-slate-50 border border-slate-200 p-4">
                  <div className="text-slate-500 mb-3">IAB-Format-Vorschau</div>
                  {full.file_url ? (
                    <div className="space-y-4">
                      {[
                        { label: "Medium Rectangle", w: 300, h: 250, scale: 0.7 },
                        { label: "Leaderboard",       w: 728, h: 90,  scale: 0.55 },
                        { label: "Wide Skyscraper",   w: 160, h: 600, scale: 0.5 },
                      ].map(({ label, w, h, scale }) => (
                        <div key={label}>
                          <div className="text-[10px] text-slate-400 mb-1">{label} — {w}×{h}px</div>
                          <div
                            className="overflow-hidden rounded-lg border border-slate-200 bg-white"
                            style={{ width: w * scale, height: h * scale }}
                          >
                            <img
                              src={full.file_url}
                              alt={`${label} preview`}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-40 rounded-2xl border border-dashed border-slate-300 bg-white flex items-center justify-center text-slate-400">
                      Kein Bild vorhanden
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-40 rounded-2xl border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-sm text-slate-400">
                Bitte Creative auswählen
              </div>
            )}

            {/* ── Alle Creatives dieser Kampagne ── */}
            {campaignCreatives.length > 0 && (
              <div className="mt-6">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  Alle Creatives dieser Kampagne ({campaignCreatives.length})
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {campaignCreatives.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCreative(c)}
                      className={`text-left rounded-2xl border p-3 transition-all hover:border-slate-400 ${
                        selectedCreative?.id === c.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 bg-slate-50"
                      }`}
                    >
                      {c.file_url ? (
                        <img
                          src={c.file_url}
                          alt={c.name}
                          className="w-full h-16 rounded-lg object-cover bg-white mb-2"
                        />
                      ) : (
                        <div className="w-full h-16 rounded-lg bg-slate-200 mb-2 flex items-center justify-center text-slate-400 text-xs">
                          {c.format || c.type || "—"}
                        </div>
                      )}
                      <div className="text-xs font-medium truncate text-slate-800">{c.name}</div>
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        {c.format && (
                          <span className="text-[10px] bg-slate-200 text-slate-600 rounded px-1.5 py-0.5 truncate max-w-full">
                            {c.format}
                          </span>
                        )}
                        <span className={`text-[10px] rounded px-1.5 py-0.5 ${
                          c.status === "Aktiv" ? "bg-green-100 text-green-700" :
                          c.status === "Pausiert" ? "bg-yellow-100 text-yellow-700" :
                          "bg-slate-200 text-slate-500"
                        }`}>
                          {c.status}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {campaignCreatives.length === 0 && lastCampaignId && (
              <div className="mt-4 text-xs text-slate-400">
                Noch keine Creatives für diese Kampagne
              </div>
            )}
          </LightCard>
        );
      })()}
    </div>
  );
}
