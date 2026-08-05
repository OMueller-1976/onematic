"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { supabase } from "./lib/supabase";

// ── Utility ──────────────────────────────────────────────────────────────────
function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}

// ── Minimal icon set (inline SVG) ────────────────────────────────────────────
const Icons = {
  Logo: () => (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect width="22" height="22" rx="6" fill="#1e293b" />
      <circle cx="11" cy="11" r="4.5" fill="white" />
      <circle cx="11" cy="11" r="2" fill="#1e293b" />
    </svg>
  ),
  Arrow: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Check: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 8l4 4 6-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Zap: () => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M10 2L4 10h6l-2 6 8-8h-6l2-8z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Chart: () => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2" y="10" width="3" height="6" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="7.5" y="6" width="3" height="10" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="13" y="3" width="3" height="13" rx="1" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  ),
  Cpu: () => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="5" y="5" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M7 2v3M11 2v3M7 13v3M11 13v3M2 7h3M2 11h3M13 7h3M13 11h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  Database: () => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <ellipse cx="9" cy="5" rx="6" ry="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3 5v4c0 1.38 2.69 2.5 6 2.5s6-1.12 6-2.5V5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3 9v4c0 1.38 2.69 2.5 6 2.5s6-1.12 6-2.5V9" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  ),
  Eye: () => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M1.5 9C1.5 9 4.5 3.5 9 3.5S16.5 9 16.5 9 13.5 14.5 9 14.5 1.5 9 1.5 9z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  ),
  Layers: () => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M9 2L16 6l-7 4-7-4 7-4z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M2 10l7 4 7-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M2 14l7 4 7-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  Image: () => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2" y="2" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="6.5" cy="6.5" r="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2 12l4-4 3 3 2-2 5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  MessageSquare: () => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M15 2H3a1 1 0 00-1 1v9a1 1 0 001 1h9l4 3V3a1 1 0 00-1-1z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Menu: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  X: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
};

// ── Badge ─────────────────────────────────────────────────────────────────────
function Badge({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "dark" | "live" }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium tracking-wide",
      variant === "default" && "bg-slate-100 text-slate-600 border border-slate-200",
      variant === "dark" && "bg-slate-800 text-slate-200 border border-slate-700",
      variant === "live" && "bg-emerald-50 text-emerald-700 border border-emerald-200",
    )}>
      {variant === "live" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
      {children}
    </span>
  );
}

// ── Hero Dashboard Mockup ─────────────────────────────────────────────────────
function HeroDashboard() {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-[#f1f5f9] rounded-2xl border border-slate-200/80 shadow-2xl overflow-hidden">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-slate-200">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
            <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
            <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
          </div>
          <div className="flex-1 mx-3">
            <div className="bg-slate-100 rounded-md px-3 py-1 text-xs text-slate-400 font-mono">app.onematic.io/dashboard</div>
          </div>
        </div>

        {/* Dashboard body */}
        <div className="p-4 space-y-3">
          {/* Header */}
          <div>
            <p className="text-[10px] font-semibold text-slate-400 tracking-widest uppercase">ONEmatic</p>
            <p className="text-sm font-bold text-slate-800">Kampagnenübersicht</p>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Kampagnen", value: "4", sub: "aktiv" },
              { label: "Impressions", value: "1,2 Mio.", sub: "letzte 7 Tage" },
              { label: "Ø CTR", value: "0,42 %", sub: "über Benchmark" },
              { label: "Spend", value: "€ 4.280", sub: "von 8.000 €" },
            ].map((k) => (
              <div key={k.label} className="bg-[#1e293b] rounded-xl p-3">
                <p className="text-[9px] text-slate-400 font-semibold tracking-widest uppercase truncate">{k.label}</p>
                <p className="text-base font-bold text-white mt-0.5">{k.value}</p>
                <p className="text-[9px] text-slate-400 mt-0.5">{k.sub}</p>
              </div>
            ))}
          </div>

          {/* Prompt Center */}
          <div className="bg-white rounded-xl border border-slate-200 p-3">
            <p className="text-xs font-bold text-slate-800 mb-2">Prompt Center</p>
            <div className="bg-slate-50 rounded-lg border border-slate-200 px-3 py-2 text-[10px] text-slate-400 font-mono">
              "B2B-Zielgruppe, DACH, Budget 5.000 €/Monat, Fokus Lead-Generierung ..."
            </div>
            <div className="mt-2 bg-[#1e293b] rounded-lg py-1.5 text-center text-[10px] text-white font-semibold">
              Kampagne anlegen
            </div>
          </div>

          {/* Campaign list */}
          <div className="bg-white rounded-xl border border-slate-200 p-3">
            <p className="text-xs font-bold text-slate-800 mb-2">Aktive Kampagnen</p>
            <div className="space-y-1.5">
              {[
                { name: "DACH B2B Prospecting", status: "Aktiv", kpi: "CTR 0,51 %" },
                { name: "Retargeting Q2", status: "Aktiv", kpi: "ROAS 3,2" },
                { name: "Brand Awareness", status: "Pausiert", kpi: "CPM 2,80 €" },
              ].map((c) => (
                <div key={c.name} className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-700 font-medium truncate max-w-[130px]">{c.name}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[9px] text-slate-400">{c.kpi}</span>
                    <span className={`text-[9px] font-semibold rounded-full px-1.5 py-0.5 ${c.status === "Aktiv" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{c.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI recommendations: 2 dark + 1 red Agentic */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#1e293b] rounded-xl p-2.5">
              <p className="text-[8px] text-slate-400 font-semibold tracking-widest">EMPFEHLUNG 1</p>
              <p className="text-[10px] text-white mt-1 leading-tight">Budget in High-Intent-Segmente verschieben</p>
              <div className="mt-2 border border-slate-600 rounded-md py-1 text-center text-[9px] text-slate-300">Übernehmen</div>
            </div>
            <div className="bg-[#1e293b] rounded-xl p-2.5">
              <p className="text-[8px] text-slate-400 font-semibold tracking-widest">EMPFEHLUNG 2</p>
              <p className="text-[10px] text-white mt-1 leading-tight">Frequency Cap auf 5/Tag reduzieren</p>
              <div className="mt-2 border border-slate-600 rounded-md py-1 text-center text-[9px] text-slate-300">Übernehmen</div>
            </div>
            <div className="bg-red-950 rounded-xl p-2.5 border border-red-800/60">
              <p className="text-[8px] text-red-400 font-semibold tracking-widest">AGENTIC LAYER</p>
              <p className="text-[10px] text-white mt-1 leading-tight">Automatische Optimierung läuft</p>
              <div className="mt-2 border border-red-700/50 rounded-md py-1 text-center text-[9px] text-red-300">Konfigurieren</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Prüft Session und leitet zu /dashboard (eingeloggt) oder /login weiter
async function handlePlatformStart(e: React.MouseEvent) {
  e.preventDefault();
  const { data: { session } } = await supabase.auth.getSession();
  window.location.href = session ? "/dashboard" : "/login";
}

// ── Navigation ────────────────────────────────────────────────────────────────
function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const links = [
    { label: "Produkt", href: "#produkt" },
    { label: "Funktionen", href: "#funktionen" },
    { label: "Agentic Layer", href: "#agentic" },
    { label: "Für wen", href: "#fuer-wen" },
    { label: "Kontakt", href: "/kontakt" },
  ];

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
      scrolled ? "bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-sm" : "bg-transparent"
    )}>
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <Icons.Logo />
          <span className="font-bold text-slate-900 tracking-tight text-lg">ONEmatic</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a key={l.label} href={l.href} className="text-sm text-slate-500 hover:text-slate-900 transition-colors font-medium">
              {l.label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/demo" className="text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors">Demo ansehen</Link>
          <button onClick={handlePlatformStart} className="inline-flex items-center gap-2 bg-slate-900 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-slate-800 transition-colors">
            Plattform starten <Icons.Arrow />
          </button>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-slate-600" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <Icons.X /> : <Icons.Menu />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-slate-200 px-6 py-4 space-y-4">
          {links.map((l) => (
            <a key={l.label} href={l.href} className="block text-sm text-slate-600 font-medium" onClick={() => setMobileOpen(false)}>
              {l.label}
            </a>
          ))}
          <button onClick={handlePlatformStart} className="block w-full text-center bg-slate-900 text-white text-sm font-semibold px-4 py-2.5 rounded-xl">
            Plattform starten
          </button>
        </div>
      )}
    </header>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section className="relative pt-32 pb-24 overflow-hidden bg-[#f8fafc]" id="produkt">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-slate-200/40 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-20 right-0 w-72 h-72 bg-blue-100/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-10 w-48 h-48 bg-slate-300/20 rounded-full blur-2xl" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Copy */}
          <div className="space-y-8">
            <div className="space-y-5">
              <h1 className="text-5xl lg:text-6xl font-bold text-slate-900 leading-[1.1] tracking-tight">
                Self-Service<br />
                <span className="text-slate-400">Programmatic Tool</span>{" "}
                <span className="text-slate-900">für den Mittelstand.</span>
              </h1>
              <p className="text-lg text-slate-500 leading-relaxed max-w-md">
                Keine Agentur, keine DSP-Spezialisten, kein monatelanges Onboarding.
                Beschreibe deine Kampagne – ONEmatic richtet sie ein und optimiert sie eigenständig.
                In 15 Minuten live.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button onClick={handlePlatformStart} className="inline-flex items-center gap-2 bg-slate-900 text-white font-semibold px-6 py-3 rounded-xl hover:bg-slate-800 transition-all hover:shadow-lg hover:shadow-slate-900/20 text-sm">
                Self-Service starten <Icons.Arrow />
              </button>
              <Link href="/demo" className="inline-flex items-center gap-2 bg-white text-slate-700 font-semibold px-6 py-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-sm">
                Demo ansehen
              </Link>
            </div>

            <div className="flex flex-wrap gap-6 pt-2">
              {[
                "Keine Vorkenntnisse nötig",
                "In 15 Minuten live",
                "100% Self-Service",
              ].map((t) => (
                <div key={t} className="flex items-center gap-2 text-sm text-slate-500">
                  <span className="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <Icons.Check />
                  </span>
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Dashboard mockup */}
          <div className="hidden lg:block">
            <HeroDashboard />
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Problem Section ───────────────────────────────────────────────────────────
function ProblemSection() {
  const problems = [
    {
      label: "Kein Zugang",
      title: "Programmatic war Enterprise-Kunden vorbehalten",
      text: "Teure DSP-Lizenzen, Mindestbudgets im sechsstelligen Bereich und spezialisierte Teams – kleinen und mittleren Unternehmen blieb professionelles Programmatic bisher verwehrt.",
    },
    {
      label: "Zu komplex",
      title: "DSP-Oberflächen erfordern monatelange Einarbeitung",
      text: "DV360, The Trade Desk, Xandr – jede Plattform hat eigene Logik und Terminologie. Marketing-Teams ohne DSP-Spezialkenntnisse verlieren sich im Setup, bevor die erste Kampagne läuft.",
    },
    {
      label: "Kein Überblick",
      title: "Fehlende Transparenz über Performance und Budget",
      text: "Kampagnen-Setup dauert Tage statt Minuten. Wer optimiert, wann, warum – bleibt unklar. Kleine Agenturen und Inhouse-Teams haben keinen Zugang zu denselben Hebeln wie große Konzerne.",
    },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16 space-y-4">
          <Badge variant="default">Das Problem</Badge>
          <h2 className="text-4xl font-bold text-slate-900 tracking-tight">
            Warum Programmatic heute noch<br />
            <span className="text-slate-400">nicht für alle funktioniert</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {problems.map((p) => (
            <div key={p.label} className="bg-[#f8fafc] border border-slate-200 rounded-2xl p-7 space-y-3">
              <Badge variant="default">{p.label}</Badge>
              <h3 className="text-lg font-bold text-slate-900 leading-snug">{p.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{p.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Solution Section ──────────────────────────────────────────────────────────
function SolutionSection() {
  return (
    <section className="py-24 bg-[#f8fafc]" id="funktionen">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Visual */}
          <div className="bg-[#1e293b] rounded-2xl p-8 space-y-5">
            <div className="space-y-1">
              <p className="text-[10px] font-semibold text-slate-400 tracking-widest uppercase">ONEmatic Architektur</p>
              <p className="text-xl font-bold text-white">Eine Plattform. Alle Layer.</p>
            </div>
            <div className="space-y-3">
              {[
                { layer: "Prompt Center", sub: "Kampagne per natürlicher Sprache definieren", icon: "msg" },
                { layer: "DSP Abstraction", sub: "DV360, TTD, Xandr & mehr – zentral gesteuert", icon: "layers" },
                { layer: "Data & Verification", sub: "Drittsegmente, First Party, Brand Safety", icon: "db" },
                { layer: "Agentic Layer", sub: "Eigenständige Optimierung innerhalb definierter Leitplanken", icon: "cpu" },
                { layer: "Reporting & Insights", sub: "Unified View über alle Kanäle und DSPs", icon: "chart" },
              ].map((item, i) => (
                <div key={item.layer} className={cn(
                  "flex items-center gap-4 p-3.5 rounded-xl border transition-all",
                  i === 3
                    ? "bg-white/10 border-white/20"
                    : "bg-white/5 border-white/10"
                )}>
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 text-slate-300">
                    {item.icon === "msg" && <Icons.MessageSquare />}
                    {item.icon === "layers" && <Icons.Layers />}
                    {item.icon === "db" && <Icons.Database />}
                    {item.icon === "cpu" && <Icons.Cpu />}
                    {item.icon === "chart" && <Icons.Chart />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{item.layer}</p>
                    <p className="text-xs text-slate-400">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Copy */}
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge variant="default">Die Lösung</Badge>
              <h2 className="text-4xl font-bold text-slate-900 tracking-tight leading-[1.15]">
                Programmatic Advertising –<br />
                einfach, sofort,<br />
                ohne Vorkenntnisse
              </h2>
              <p className="text-slate-500 leading-relaxed">
                ONEmatic macht Programmatic so einfach wie ein Social-Media-Post. Du beschreibst deine Kampagne in
                normaler Sprache – die KI übernimmt Setup, Optimierung und Reporting. Sofort loslegen, keine Einarbeitung.
              </p>
            </div>
            <div className="space-y-4">
              {[
                { title: "Prompt-basiertes Setup in Minuten", text: "Zielgruppe, Budget und KPI in natürlicher Sprache beschreiben – das AI-Setup konfiguriert alles automatisch. Keine DSP-Kenntnisse erforderlich." },
                { title: "Zentrale Steuerung für alle Kanäle", text: "Alle Kampagnen in einer Oberfläche. Kein Wechsel zwischen Tools, kein Fachwissen über einzelne DSPs notwendig." },
                { title: "Transparenz von Tag eins", text: "Klares Reporting, nachvollziehbare AI-Entscheidungen und volle Kontrolle über Budget-Einsatz – ohne Agentur dazwischen." },
              ].map((item) => (
                <div key={item.title} className="flex gap-4">
                  <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 mt-0.5 text-white">
                    <Icons.Check />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{item.title}</p>
                    <p className="text-sm text-slate-500 mt-0.5">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Agentic Section ───────────────────────────────────────────────────────────
function AgenticSection() {
  return (
    <section className="py-24 bg-[#1e293b] relative overflow-hidden" id="agentic">
      {/* Background shapes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-slate-500/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative">
        {/* Header */}
        <div className="text-center mb-16 space-y-5">
          <Badge variant="dark">Kernfeature</Badge>
          <h2 className="text-4xl lg:text-5xl font-bold text-white tracking-tight leading-[1.1]">
            Agentic Advertising
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            ONEmatic gibt keine Empfehlungen, die du ignorieren kannst. Der Agentic Layer trifft eigenständig
            Entscheidungen – innerhalb deiner definierten Leitplanken.
          </p>
        </div>

        {/* Main comparison */}
        <div className="grid lg:grid-cols-2 gap-6 mb-12">
          {/* Before */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-5">
            <p className="text-slate-400 font-semibold text-sm tracking-widest uppercase">Bisher</p>
            <div className="space-y-3">
              {[
                "Manuelles Reporting & Analyse",
                "Entscheidungen durch Spezialisten",
                "Verzögerte Optimierungszyklen",
                "Fragmentierte Tool-Landschaft",
                "Empfehlungen bleiben im Dashboard",
              ].map((t) => (
                <div key={t} className="flex items-center gap-3 text-sm text-slate-400">
                  <span className="w-4 h-4 rounded-full border border-slate-600 flex-shrink-0" />
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* After */}
          <div className="bg-white/10 border border-white/20 rounded-2xl p-8 space-y-5">
            <p className="text-white font-semibold text-sm tracking-widest uppercase">
              Mit ONEmatic Agentic Layer
            </p>
            <div className="space-y-3">
              {[
                "Kontinuierliches Signal-Monitoring",
                "Eigenständige Budgetanpassung",
                "Echtzeit-Optimierung ohne Verzögerung",
                "Zentrale Logik über alle Kanäle",
                "Regeln werden direkt übernommen",
              ].map((t) => (
                <div key={t} className="flex items-center gap-3 text-sm text-white">
                  <span className="w-4 h-4 rounded-full bg-white flex items-center justify-center flex-shrink-0 text-slate-900">
                    <Icons.Check />
                  </span>
                  {t}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Agentic capabilities grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Budgets", text: "Dynamische Umverteilung zu leistungsstarken Placements" },
            { label: "Signale", text: "Markt- und Audience-Signale fließen automatisch ein" },
            { label: "Creatives", text: "Performance-basiertes Rotation und Ausspielung" },
            { label: "KPI-Fokus", text: "Eigenständige Ausrichtung auf definierte Ziel-KPIs" },
          ].map((item) => (
            <div key={item.label} className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-2">
              <span className="text-[10px] font-semibold text-slate-400 tracking-widest uppercase">{item.label}</span>
              <p className="text-sm text-white leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>

        {/* Bottom quote */}
        <div className="mt-12 text-center border-t border-white/10 pt-12">
          <p className="text-2xl font-bold text-white max-w-3xl mx-auto leading-snug">
            „Vom Dashboard zur aktiven Media-Logik.<br />
            <span className="text-slate-400">ONEmatic denkt mit – und handelt eigenständig."</span>
          </p>
        </div>
      </div>
    </section>
  );
}

// ── Feature Grid ──────────────────────────────────────────────────────────────
function FeatureGrid() {
  const features = [
    {
      icon: "msg",
      title: "Prompt Center",
      text: "Kampagnen in natürlicher Sprache beschreiben. Das System übernimmt Setup, Segmente und Konfiguration.",
    },
    {
      icon: "layers",
      title: "Zentrale Kampagnensteuerung",
      text: "Alle Kampagnen in einer Oberfläche. Kein Tool-Wechsel zwischen DSPs, Reporting-Systemen und Datenquellen.",
    },
    {
      icon: "db",
      title: "DSP Defaults",
      text: "Vorkonfigurierte Setups für DV360, The Trade Desk & weitere DSPs. Starte schnell, ohne Setup von null.",
    },
    {
      icon: "image",
      title: "Creative Management",
      text: "Banner, Video, DOOH und CTV-Assets direkt hochladen, zuweisen und performance-basiert rotieren lassen.",
    },
    {
      icon: "eye",
      title: "Daten & Verification",
      text: "Drittsegmente, First-Party-Daten und Brand-Safety-Verification nahtlos in jede Kampagne integrieren.",
    },
    {
      icon: "chart",
      title: "Reporting & AI Insights",
      text: "Unified Reporting über alle Kanäle. AI-generierte Insights und Optimierungsvorschläge in Echtzeit.",
    },
  ];

  return (
    <section className="py-24 bg-white" id="funktionen">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16 space-y-4">
          <Badge variant="default">Funktionen</Badge>
          <h2 className="text-4xl font-bold text-slate-900 tracking-tight">
            Alles was du für professionelles<br />
            <span className="text-slate-400">Programmatic brauchst</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div key={f.title} className="bg-[#f8fafc] border border-slate-200 rounded-2xl p-6 space-y-3 hover:border-slate-300 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white">
                {f.icon === "msg" && <Icons.MessageSquare />}
                {f.icon === "layers" && <Icons.Layers />}
                {f.icon === "db" && <Icons.Database />}
                {f.icon === "image" && <Icons.Image />}
                {f.icon === "eye" && <Icons.Eye />}
                {f.icon === "chart" && <Icons.Chart />}
              </div>
              <h3 className="font-bold text-slate-900">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{f.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── How It Works ──────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    {
      step: "01",
      title: "Kampagne beschreiben",
      text: "Du beschreibst deine Kampagne im Prompt Center: Zielgruppe, Strategie, Budget, KPI-Fokus und Märkte – in natürlicher Sprache.",
    },
    {
      step: "02",
      title: "Defaults & Ziele festlegen",
      text: "Wähle DSP-Defaults, Daten- und Verification-Anbieter. Definiere Leitplanken für den Agentic Layer: Budgetgrenzen, Kanäle, Ziel-KPIs.",
    },
    {
      step: "03",
      title: "AI erstellt das Setup",
      text: "Das System analysiert deine Eingaben, schlägt Segmente vor, konfiguriert das DSP-Setup und startet die Kampagne – in Minuten statt Tagen.",
    },
    {
      step: "04",
      title: "Agentic Layer optimiert laufend",
      text: "Der Agentic Layer überwacht Signale, passt Budgets an, rotiert Creatives und justiert Targeting – eigenständig und in Echtzeit.",
    },
  ];

  return (
    <section className="py-24 bg-[#f8fafc]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16 space-y-4">
          <Badge variant="default">So funktioniert es</Badge>
          <h2 className="text-4xl font-bold text-slate-900 tracking-tight">
            Von der Idee zur laufenden Kampagne –<br />
            <span className="text-slate-400">in wenigen Schritten</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((s, i) => (
            <div key={s.step} className="relative">
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-full w-full h-px bg-slate-200 z-0" style={{ width: "calc(100% - 2.5rem)", left: "calc(100% - 2.5rem + 1.25rem)" }} />
              )}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 relative z-10">
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-slate-200">{s.step}</span>
                </div>
                <h3 className="font-bold text-slate-900">{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{s.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── For Whom ──────────────────────────────────────────────────────────────────
function ForWhom() {
  const audiences = [
    {
      label: "Mittelstand",
      title: "Mittelständische Unternehmen (50–500 MA)",
      text: "Du willst erstmals professionelles Programmatic nutzen, ohne eine eigene DSP-Einheit aufzubauen. ONEmatic gibt dir dieselben Möglichkeiten wie große Konzerne – ohne deren Overhead.",
      tags: ["Kein DSP-Team nötig", "DACH-Fokus", "Sofort loslegen"],
    },
    {
      label: "Marketing Teams",
      title: "Teams ohne DSP-Spezialkenntnisse",
      text: "Dein Team kennt Marketing, aber kein Programmatic im Detail. ONEmatic übersetzt dein Know-how in professionelle Kampagnen-Setups – ohne monatelange Einarbeitung.",
      tags: ["Keine Vorkenntnisse", "In 15 Min. live", "Volle Kontrolle"],
    },
    {
      label: "Agenturen",
      title: "Kleinere und mittlere Agenturen",
      text: "Biete deinen Kunden Programmatic-Kampagnen an, ohne eigene DSP-Lizenzen oder Spezialisten. ONEmatic ist dein Self-Service Media-Buying-Backbone für alle Kunden.",
      tags: ["Multi-Client", "Self-Service", "Schnell skalierbar"],
    },
  ];

  return (
    <section className="py-24 bg-white" id="fuer-wen">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16 space-y-4">
          <Badge variant="default">Für wen</Badge>
          <h2 className="text-4xl font-bold text-slate-900 tracking-tight">
            Endlich Programmatic<br />
            <span className="text-slate-400">auch ohne DSP-Spezialist</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {audiences.map((a) => (
            <div key={a.label} className="bg-[#f8fafc] border border-slate-200 rounded-2xl p-7 space-y-4 hover:border-slate-300 transition-colors">
              <Badge variant="default">{a.label}</Badge>
              <h3 className="text-lg font-bold text-slate-900 leading-snug">{a.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{a.text}</p>
              <div className="flex flex-wrap gap-2 pt-2">
                {a.tags.map((t) => (
                  <span key={t} className="text-xs bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full border border-slate-200 font-medium">{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Outcomes ──────────────────────────────────────────────────────────────────
function Outcomes() {
  const outcomes = [
    { value: "< 15 Min.", label: "bis zur ersten Kampagne", sub: "statt Tage mit klassischen DSPs" },
    { value: "−60 %", label: "operative Arbeit", sub: "durch Automation & Agentic Layer" },
    { value: "98,7 %", label: "Verification Rate", sub: "durch integrierte Brand Safety" },
    { value: "1 Oberfläche", label: "für alle DSPs & Kanäle", sub: "kein Tool-Bruch mehr" },
  ];

  return (
    <section className="py-24 bg-[#1e293b]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16 space-y-4">
          <Badge variant="dark">Ergebnisse</Badge>
          <h2 className="text-4xl font-bold text-white tracking-tight">
            Was ONEmatic<br />
            <span className="text-slate-400">konkret verändert</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {outcomes.map((o) => (
            <div key={o.label} className="bg-white/5 border border-white/10 rounded-2xl p-7 space-y-2 text-center">
              <p className="text-4xl font-bold text-white">{o.value}</p>
              <p className="text-sm font-semibold text-slate-300">{o.label}</p>
              <p className="text-xs text-slate-500">{o.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


// ── Final CTA ─────────────────────────────────────────────────────────────────
function FinalCTA() {
  return (
    <section className="py-24 bg-[#f8fafc]">
      <div className="max-w-4xl mx-auto px-6 text-center space-y-8">
        <div className="bg-[#1e293b] rounded-3xl p-12 space-y-8">
          <Badge variant="dark">Jetzt starten</Badge>
          <h2 className="text-4xl lg:text-5xl font-bold text-white tracking-tight leading-[1.1]">
            Programmatic Advertising.<br />
            <span className="text-slate-400">Jetzt selbst in der Hand.</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto leading-relaxed">
            Starte heute mit ONEmatic. Keine Agentur, keine DSP-Vorkenntnisse, kein langes Onboarding.
            Deine erste Kampagne läuft in weniger als 15 Minuten – komplett im Self-Service.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button onClick={handlePlatformStart} className="inline-flex items-center gap-2 bg-white text-slate-900 font-bold px-8 py-3.5 rounded-xl hover:bg-slate-100 transition-all text-sm">
              Self-Service starten <Icons.Arrow />
            </button>
            <Link href="/demo" className="inline-flex items-center gap-2 bg-white/10 text-white border border-white/20 font-semibold px-8 py-3.5 rounded-xl hover:bg-white/20 transition-all text-sm">
              Demo ansehen
            </Link>
          </div>
          <p className="text-slate-500 text-sm">Kein Kreditkarte nötig · Kein Vertrag · Sofort loslegen</p>
        </div>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8 mb-10">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <Icons.Logo />
              <span className="font-bold text-slate-900">ONEmatic</span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
              AI Programmatic Advertising for EveryONE. Zentrale Kampagnensteuerung mit Agentic Optimization Layer.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-900 tracking-widest uppercase">Produkt</p>
            {["Funktionen", "Agentic Layer", "Pricing", "Changelog"].map((l) => (
              <span key={l} className="block text-sm text-slate-500">{l}</span>
            ))}
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-900 tracking-widest uppercase">Unternehmen</p>
            <Link href="/ueber-onematic" className="block text-sm text-slate-500 hover:text-slate-900 transition-colors">Über ONEmatic</Link>
            <Link href="/kontakt" className="block text-sm text-slate-500 hover:text-slate-900 transition-colors">Kontakt</Link>
            <Link href="/impressum" className="block text-sm text-slate-500 hover:text-slate-900 transition-colors">Impressum</Link>
            <Link href="/datenschutz" className="block text-sm text-slate-500 hover:text-slate-900 transition-colors">Datenschutz</Link>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-6 flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-xs text-slate-400">© 2025 ONEmatic. Alle Rechte vorbehalten.</p>
          <p className="text-xs text-slate-400">AI Programmatic Advertising for EveryONE</p>
        </div>
      </div>
    </footer>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <Navigation />
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <AgenticSection />
      <FeatureGrid />
      <HowItWorks />
      <ForWhom />
      <Outcomes />
      <FinalCTA />
      <Footer />
    </main>
  );
}
