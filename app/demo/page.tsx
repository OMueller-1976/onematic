"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

// ── Step definitions ──────────────────────────────────────────────────────────
const STEPS = [
  {
    number: "01",
    label: "KI Kampagnen-Brief",
    headline: "Kampagne in eigenen Worten beschreiben",
    text: "Beschreibe deine Kampagne in eigenen Worten — ONEella formuliert daraus einen professionellen Kampagnen-Brief und füllt alle Einstellungen automatisch aus.",
  },
  {
    number: "02",
    label: "Media Controls",
    headline: "KI füllt alle Parameter automatisch aus",
    text: "Alle Kampagnen-Parameter werden automatisch von der KI vorausgefüllt. Du kannst jeden Wert jederzeit anpassen — von DSP-Auswahl bis Bidding-Strategie.",
  },
  {
    number: "03",
    label: "AI Empfehlungen",
    headline: "Sofort umsetzbare Optimierungen",
    text: "ONEmatic analysiert deine Kampagne und liefert sofort umsetzbare Optimierungs-Empfehlungen powered by GPT-4. Speichere die besten als dauerhafte Regeln.",
  },
  {
    number: "04",
    label: "Creative Management",
    headline: "Upload oder KI-Generierung",
    text: "Lade deine Werbemittel hoch oder lass die KI direkt IAB-konforme Display-Bundles für dich generieren — 3 Formate auf Knopfdruck.",
  },
  {
    number: "05",
    label: "Kampagnen-Übersicht",
    headline: "Alles auf einen Blick",
    text: "Behalte alle Kampagnen im Überblick. Media Budget, Plattform-Fee und Performance auf einen Blick — nach DSP, Kanal und Status gefiltert.",
  },
  {
    number: "06",
    label: "Jetzt starten",
    headline: "Bereit für smarte Kampagnen?",
    text: "Starte heute mit ONEmatic. Keine langen Onboarding-Prozesse, keine DSP-Vorkenntnisse, keine Agentur nötig.",
  },
] as const;

// ── Browser frame wrapper ─────────────────────────────────────────────────────
function BrowserFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full rounded-2xl overflow-hidden shadow-2xl shadow-slate-900/40 border border-slate-700">
      {/* Browser chrome */}
      <div className="bg-slate-800 px-4 py-3 flex items-center gap-3">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/70" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <div className="w-3 h-3 rounded-full bg-green-500/70" />
        </div>
        <div className="flex-1 bg-slate-700/60 rounded-md px-3 py-1 text-[11px] text-slate-400 font-mono">
          app.onematic.io/dashboard
        </div>
      </div>
      {/* Content */}
      <div className="bg-[#f1f5f9] overflow-hidden" style={{ minHeight: 340 }}>
        {children}
      </div>
    </div>
  );
}

// ── Pulse ring highlight ──────────────────────────────────────────────────────
function Pulse({ children, active }: { children: React.ReactNode; active: boolean }) {
  return (
    <div className={`relative rounded-xl transition-all duration-300 ${active ? "ring-2 ring-blue-400 ring-offset-2 ring-offset-white" : ""}`}>
      {active && (
        <span className="absolute -inset-1 rounded-xl animate-ping bg-blue-400/20 pointer-events-none" />
      )}
      {children}
    </div>
  );
}

// ── MOCKUP 1: KI Kampagnen-Brief ──────────────────────────────────────────────
function MockupPrompt() {
  return (
    <div className="p-5 space-y-4">
      {/* Header strip */}
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-2 rounded-full bg-slate-400" />
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Prompt Center</span>
      </div>

      <Pulse active>
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2 shadow-sm">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Kampagnen-Brief</div>
          <div className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-lg p-3 border border-slate-100 text-xs">
            Wir launchen im Q2 eine B2B-Lead-Kampagne für unser SaaS-Tool im DACH-Raum. Zielgruppe sind Marketing-Manager in Unternehmen 50–500 MA. Budget 25.000 €, Laufzeit 6 Wochen, Fokus auf Leadgenerierung über Programmatic Display und DOOH in den Top-5-Städten.
          </div>
          <div className="flex items-center gap-2 pt-1">
            <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full w-4/5 rounded-full bg-gradient-to-r from-blue-400 to-blue-600" />
            </div>
            <span className="text-[10px] text-blue-600 font-semibold">Analysiere…</span>
          </div>
        </div>
      </Pulse>

      {/* AI suggestion banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-3">
        <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-white text-[9px] font-bold">KI</span>
        </div>
        <div className="space-y-1">
          <div className="text-[10px] font-bold text-blue-800">ONEella Vorschlag</div>
          <div className="text-[10px] text-blue-600">Kampagnenname, Ziel, Budget, KPI, DSP, Kanal und Laufzeit wurden automatisch erkannt und ausgefüllt.</div>
        </div>
      </div>

      {/* Auto-filled preview chips */}
      <div className="flex flex-wrap gap-1.5">
        {["DV360", "Leadgenerierung", "25.000 €", "DACH", "6 Wochen", "CPL"].map((tag) => (
          <span key={tag} className="bg-white border border-slate-200 text-slate-600 text-[10px] font-medium px-2 py-0.5 rounded-full">{tag}</span>
        ))}
      </div>
    </div>
  );
}

// ── MOCKUP 2: Media Controls ──────────────────────────────────────────────────
function MockupMediaControls() {
  const fields = [
    { label: "DSP", value: "DV360", highlight: true },
    { label: "Kanal", value: "Programmatic Display", highlight: true },
    { label: "Laufzeit", value: "01.05. – 12.06.2026", highlight: true },
    { label: "Budget", value: "25.000,00 €", highlight: true },
    { label: "Bid-Strategie", value: "Fixed Bid", highlight: false },
    { label: "KPI", value: "CPL", highlight: false },
  ];

  return (
    <div className="p-5 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-2 rounded-full bg-slate-400" />
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Media Controls</span>
        <span className="ml-auto text-[9px] bg-blue-50 text-blue-600 border border-blue-200 px-1.5 py-0.5 rounded-full font-semibold">KI ausgefüllt</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {fields.map((f) => (
          <Pulse key={f.label} active={f.highlight}>
            <div className="bg-white rounded-lg border border-slate-200 p-2.5 shadow-sm">
              <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">{f.label}</div>
              <div className="text-xs font-semibold text-slate-800">{f.value}</div>
            </div>
          </Pulse>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-2.5 shadow-sm">
        <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Geräte</div>
        <div className="flex gap-1.5">
          {["Mobile", "Desktop"].map((d) => (
            <span key={d} className="bg-slate-900 text-white text-[9px] font-medium px-2 py-0.5 rounded-full">{d}</span>
          ))}
          <span className="bg-slate-100 text-slate-400 text-[9px] font-medium px-2 py-0.5 rounded-full">CTV · Soon</span>
        </div>
      </div>
    </div>
  );
}

// ── MOCKUP 3: AI Empfehlungen ─────────────────────────────────────────────────
function MockupRecommendations() {
  const recs = [
    { title: "Budget-Shift zu DV360", desc: "DV360 zeigt 23% niedrigeren CPL", highlight: true },
    { title: "Frequency Cap erhöhen", desc: "Aktuell 3/Tag → 5/Tag empfohlen", highlight: false },
    { title: "DOOH: Top-5 Städte", desc: "Hamburg & München performen stark", highlight: false },
    { title: "Bidding optimieren", desc: "Goal-based Bidding empfohlen", highlight: false },
    { title: "Laufzeit verlängern", desc: "+1 Woche: +18% Reach", highlight: false },
    { title: "Mobile priorisieren", desc: "72% der Leads via Mobile", highlight: false },
  ];

  return (
    <div className="p-5 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-2 rounded-full bg-amber-400" />
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">AI Empfehlungen</span>
        <span className="ml-auto text-[9px] bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded-full font-semibold">6 neu</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {recs.map((r) => (
          <Pulse key={r.title} active={r.highlight}>
            <div className={`rounded-lg border p-2.5 shadow-sm ${r.highlight ? "bg-amber-50 border-amber-200" : "bg-white border-slate-200"}`}>
              <div className={`text-[9px] font-bold mb-0.5 ${r.highlight ? "text-amber-800" : "text-slate-700"}`}>{r.title}</div>
              <div className="text-[9px] text-slate-500 leading-tight">{r.desc}</div>
              {r.highlight && (
                <button className="mt-1.5 text-[9px] bg-amber-600 text-white rounded px-1.5 py-0.5 font-semibold">
                  Als Regel speichern
                </button>
              )}
            </div>
          </Pulse>
        ))}
      </div>
    </div>
  );
}

// ── MOCKUP 4: Creative Management ────────────────────────────────────────────
function MockupCreatives() {
  return (
    <div className="p-5 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-2 rounded-full bg-slate-400" />
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Creative Management</span>
      </div>

      {/* Upload zone */}
      <div className="bg-white rounded-xl border-2 border-dashed border-slate-300 p-4 text-center space-y-1 shadow-sm">
        <div className="text-slate-400 text-lg">↑</div>
        <div className="text-[10px] font-semibold text-slate-500">Creative hochladen</div>
        <div className="text-[9px] text-slate-400">JPG, PNG, HTML5 · Max. 2 MB</div>
      </div>

      {/* KI Bundle CTA */}
      <Pulse active>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[10px] font-bold text-amber-800 flex items-center gap-1">
              ✨ KI Ad Bundle erstellen
              <span className="text-[8px] bg-amber-200 text-amber-700 border border-amber-300 rounded-full px-1.5 py-0.5 font-bold">BETA</span>
            </div>
            <div className="text-[9px] text-amber-600 mt-0.5">3 IAB-Formate auf Knopfdruck</div>
          </div>
          <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center shrink-0">
            <span className="text-white text-[10px]">→</span>
          </div>
        </div>
      </Pulse>

      {/* Library preview */}
      <div className="space-y-1.5">
        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-0.5">Bibliothek</div>
        {[
          { name: "Banner Q2 300x250", type: "Display", status: "Aktiv" },
          { name: "KI Bundle — Leaderboard", type: "Display", status: "Entwurf" },
        ].map((c) => (
          <div key={c.name} className="bg-white rounded-lg border border-slate-200 px-3 py-2 flex items-center justify-between shadow-sm">
            <div>
              <div className="text-[10px] font-semibold text-slate-700">{c.name}</div>
              <div className="text-[9px] text-slate-400">{c.type}</div>
            </div>
            <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${c.status === "Aktiv" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-slate-100 text-slate-500 border border-slate-200"}`}>
              {c.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── MOCKUP 5: Kampagnen-Übersicht ─────────────────────────────────────────────
function MockupKampagnen() {
  return (
    <div className="p-5 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-2 rounded-full bg-emerald-400" />
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Kampagnen</span>
      </div>

      {/* KPI strip */}
      <Pulse active>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Media Budget", value: "65.000 €", color: "text-slate-900" },
            { label: "Plattform-Fee", value: "4.550 €", color: "text-blue-600" },
            { label: "Aktive DSPs", value: "2 / 3", color: "text-emerald-600" },
          ].map((k) => (
            <div key={k.label} className="bg-white rounded-lg border border-slate-200 p-2.5 shadow-sm text-center">
              <div className={`text-sm font-bold ${k.color}`}>{k.value}</div>
              <div className="text-[9px] text-slate-400 mt-0.5">{k.label}</div>
            </div>
          ))}
        </div>
      </Pulse>

      {/* Campaign list */}
      <div className="space-y-1.5">
        {[
          { name: "B2B Lead DACH Q2", dsp: "DV360", kpi: "CPL", budget: "25.000 €", status: "Aktiv", statusColor: "bg-emerald-50 text-emerald-700 border-emerald-200" },
          { name: "Retail Push Sommer", dsp: "TTD", kpi: "ROAS", budget: "40.000 €", status: "Aktiv", statusColor: "bg-emerald-50 text-emerald-700 border-emerald-200" },
          { name: "App Install Q1", dsp: "Xandr", kpi: "CPI", budget: "12.000 €", status: "Pausiert", statusColor: "bg-amber-50 text-amber-700 border-amber-200" },
        ].map((c) => (
          <div key={c.name} className="bg-white rounded-lg border border-slate-200 px-3 py-2 flex items-center justify-between shadow-sm">
            <div className="min-w-0">
              <div className="text-[10px] font-semibold text-slate-700 truncate">{c.name}</div>
              <div className="text-[9px] text-slate-400">{c.dsp} · {c.kpi} · {c.budget}</div>
            </div>
            <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full border shrink-0 ${c.statusColor}`}>{c.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── MOCKUP 6: CTA (no browser frame) ─────────────────────────────────────────
function MockupCTA() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-8 space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
        <svg width="28" height="28" viewBox="0 0 22 22" fill="none">
          <rect width="22" height="22" rx="6" fill="white" fillOpacity="0.2" />
          <circle cx="11" cy="11" r="4.5" fill="white" />
          <circle cx="11" cy="11" r="2" fill="#1e293b" />
        </svg>
      </div>
      <div>
        <div className="text-2xl font-bold text-white mb-2">Bereit für smarte Kampagnen?</div>
        <div className="text-slate-400 text-sm">Deine erste Kampagne in weniger als 15 Minuten.</div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/login"
          className="inline-flex items-center justify-center gap-2 bg-white text-slate-900 font-bold px-6 py-3 rounded-xl hover:bg-slate-100 transition-all text-sm">
          Kostenlos starten
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <Link href="/"
          className="inline-flex items-center justify-center gap-2 bg-white/10 text-white border border-white/20 font-semibold px-6 py-3 rounded-xl hover:bg-white/20 transition-all text-sm">
          Mehr erfahren
        </Link>
      </div>
      <p className="text-slate-500 text-xs">Kein Kreditkarte nötig · Kein Vertrag</p>
    </div>
  );
}

const MOCKUPS = [
  MockupPrompt,
  MockupMediaControls,
  MockupRecommendations,
  MockupCreatives,
  MockupKampagnen,
  null, // step 6 has no browser frame
];

// ── Main Demo Page ────────────────────────────────────────────────────────────
export default function DemoPage() {
  const [step, setStep] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [fading, setFading] = useState(false);

  const goTo = useCallback((next: number) => {
    setFading(true);
    setTimeout(() => {
      setStep(next);
      setFading(false);
    }, 220);
  }, []);

  const prev = () => { if (step > 0) goTo(step - 1); };
  const next = () => { if (step < STEPS.length - 1) goTo(step + 1); };

  // Auto-play
  useEffect(() => {
    if (!autoPlay) return;
    const id = setInterval(() => {
      setStep((s) => {
        if (s >= STEPS.length - 1) { setAutoPlay(false); return s; }
        return s + 1;
      });
    }, 5000);
    return () => clearInterval(id);
  }, [autoPlay]);

  const current = STEPS[step];
  const MockupComponent = MOCKUPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="min-h-screen bg-[#1e293b] flex flex-col">
      {/* Nav */}
      <header className="border-b border-slate-700/60 shrink-0">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-white hover:text-slate-300 transition-colors">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <rect width="22" height="22" rx="6" fill="white" fillOpacity="0.1" />
              <circle cx="11" cy="11" r="4.5" fill="white" />
              <circle cx="11" cy="11" r="2" fill="#1e293b" />
            </svg>
            ONEmatic
          </Link>
          <div className="flex items-center gap-4">
            {/* Auto-play toggle */}
            <button
              onClick={() => setAutoPlay((p) => !p)}
              className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                autoPlay
                  ? "bg-blue-600 text-white border-blue-500"
                  : "bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500"
              }`}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                {autoPlay ? (
                  <><rect x="2" y="2" width="3" height="8" rx="0.5" fill="currentColor" /><rect x="7" y="2" width="3" height="8" rx="0.5" fill="currentColor" /></>
                ) : (
                  <path d="M3 2l7 4-7 4V2z" fill="currentColor" />
                )}
              </svg>
              {autoPlay ? "Pause" : "Auto-Play"}
            </button>
            <Link
              href="/api/demo-login"
              className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Demo starten
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2.5 6h7M6.5 3l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <Link href="/" className="text-sm text-slate-400 hover:text-white transition-colors">
              ← Zurück
            </Link>
          </div>
        </div>
      </header>

      {/* Progress bar */}
      <div className="shrink-0 px-6 pt-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="group flex items-center gap-2"
              aria-label={`Schritt ${i + 1}: ${s.label}`}
            >
              <div className={`transition-all duration-300 rounded-full ${
                i === step
                  ? "w-6 h-3 bg-blue-400"
                  : i < step
                  ? "w-3 h-3 bg-blue-600"
                  : "w-3 h-3 bg-slate-700 group-hover:bg-slate-500"
              }`} />
            </button>
          ))}
          <span className="ml-auto text-xs text-slate-500 font-medium">
            {step + 1} / {STEPS.length}
          </span>
        </div>
        <div className="mt-2 h-0.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-10">
        <div className="grid md:grid-cols-[2fr_3fr] gap-12 items-center min-h-[480px]">

          {/* Left — Explanation */}
          <div
            className={`space-y-6 transition-all duration-220 ${fading ? "opacity-0 translate-x-2" : "opacity-100 translate-x-0"}`}
            style={{ transitionDuration: "220ms" }}
          >
            <div>
              <span className="inline-block text-[10px] font-bold text-blue-400 tracking-[0.2em] uppercase mb-3">
                Schritt {current.number} — {current.label}
              </span>
              <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight leading-tight">
                {current.headline}
              </h1>
            </div>

            <p className="text-slate-400 text-base leading-relaxed">
              {current.text}
            </p>

            {/* Nav buttons */}
            <div className="flex items-center gap-3 pt-2">
              {!isLast && (
                <>
                  <button
                    onClick={prev}
                    disabled={step === 0}
                    className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-400 text-sm font-medium hover:border-slate-500 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ← Zurück
                  </button>
                  <button
                    onClick={next}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 transition-colors flex items-center gap-2"
                  >
                    Weiter
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </>
              )}
              {isLast && (
                <>
                  <button
                    onClick={prev}
                    className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-400 text-sm font-medium hover:border-slate-500 hover:text-white transition-colors"
                  >
                    ← Zurück
                  </button>
                  <Link href="/login"
                    className="px-6 py-2.5 rounded-xl bg-white text-slate-900 text-sm font-bold hover:bg-slate-100 transition-colors">
                    Kostenlos starten
                  </Link>
                </>
              )}
            </div>

            <div className="pt-1">
              <Link href="/login" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
                Demo überspringen → Jetzt starten
              </Link>
            </div>
          </div>

          {/* Right — Mockup */}
          <div
            className={`transition-all duration-220 ${fading ? "opacity-0 -translate-x-2" : "opacity-100 translate-x-0"}`}
            style={{ transitionDuration: "220ms" }}
          >
            {isLast ? (
              <div className="rounded-3xl bg-slate-800/40 border border-slate-700">
                <MockupCTA />
              </div>
            ) : MockupComponent ? (
              <BrowserFrame>
                <MockupComponent />
              </BrowserFrame>
            ) : null}
          </div>

        </div>
      </div>

      {/* Step labels row */}
      <div className="shrink-0 border-t border-slate-800 px-6 py-4 max-w-7xl mx-auto w-full">
        <div className="hidden md:flex gap-1">
          {STEPS.map((s, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`flex-1 text-center py-2 px-1 rounded-lg text-[10px] font-medium transition-colors ${
                i === step
                  ? "bg-slate-800 text-white"
                  : i < step
                  ? "text-blue-400 hover:text-blue-300"
                  : "text-slate-600 hover:text-slate-400"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 shrink-0">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between text-xs text-slate-600">
          <span>© {new Date().getFullYear()} ONEmatic</span>
          <div className="flex gap-4">
            <Link href="/impressum" className="hover:text-slate-400 transition-colors">Impressum</Link>
            <Link href="/datenschutz" className="hover:text-slate-400 transition-colors">Datenschutz</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
