import Link from "next/link";

export const metadata = {
  title: "Über ONEmatic",
  description: "ONEmatic macht Programmatic Advertising zugänglich für jeden – ohne DSP-Vorkenntnisse, ohne Agentur.",
};

export default function UeberOnematicPage() {
  return (
    <div className="min-h-screen bg-[#1e293b]">
      {/* Nav */}
      <header className="border-b border-slate-700/60">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-white hover:text-slate-300 transition-colors">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <rect width="22" height="22" rx="6" fill="white" fillOpacity="0.1" />
              <circle cx="11" cy="11" r="4.5" fill="white" />
              <circle cx="11" cy="11" r="2" fill="#1e293b" />
            </svg>
            ONEmatic
          </Link>
          <Link href="/" className="text-sm text-slate-400 hover:text-white transition-colors">
            ← Zurück zur Startseite
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-4xl mx-auto px-6 py-20">
        <div className="space-y-4 mb-16">
          <span className="inline-block text-[10px] font-semibold text-slate-400 tracking-[0.2em] uppercase border border-slate-700 rounded-full px-3 py-1">
            Über ONEmatic
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight">
            AI Programmatic Advertising<br />
            <span className="text-slate-400">for EveryONE.</span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed max-w-xl">
            ONEmatic macht Programmatic Advertising so einfach wie das Buchen einer Anzeige –
            ohne DSP-Vorkenntnisse, ohne Agentur, ohne monatelange Einarbeitung.
          </p>
        </div>

        {/* Mission */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-slate-800/40 border border-slate-700 rounded-3xl p-8 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="9" r="7" stroke="#60a5fa" strokeWidth="1.5" />
                <circle cx="9" cy="9" r="3" fill="#60a5fa" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-white">Die Idee</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Programmatic Advertising war lange eine Black Box: komplexe DSP-Interfaces,
              intransparente Agenturgebühren und ein Wissensvorsprung, der kleinen und
              mittleren Unternehmen den Zugang erschwerte. ONEmatic ändert das –
              mit KI als Co-Pilot.
            </p>
          </div>

          <div className="bg-slate-800/40 border border-slate-700 rounded-3xl p-8 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 2l2 5h5l-4 3 1.5 5L9 12l-4.5 3L6 10 2 7h5z" stroke="#f59e0b" strokeWidth="1.4" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-white">Die Vision</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Eine Welt, in der jedes Unternehmen – unabhängig von Budget oder
              Mediakompetenz – professionelle Programmatic-Kampagnen schalten kann.
              ONEmatic ist der zentrale Layer zwischen Marketer und DSP.
            </p>
          </div>
        </div>

        {/* Founder */}
        <div className="bg-slate-800/40 border border-slate-700 rounded-3xl p-8 mb-16">
          <p className="text-[10px] font-semibold text-slate-500 tracking-[0.2em] uppercase mb-6">Gründer</p>
          <div className="flex items-start gap-6">
            <div className="w-14 h-14 rounded-2xl bg-slate-700 border border-slate-600 flex items-center justify-center shrink-0 text-xl font-bold text-white">
              O
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-white font-semibold">Oliver Müller</p>
                <p className="text-sm text-slate-400">Gründer & CEO, OneTitel</p>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed max-w-lg">
                Oliver ist Unternehmer und Mediaexperte aus dem Rheinland mit Erfahrung in
                Programmatic Advertising, AdTech und KI-gestützter Automatisierung.
                Mit ONEmatic baut er das fehlende Glied zwischen Werbetreibenden und der
                komplexen DSP-Landschaft.
              </p>
              <a
                href="https://www.linkedin.com/in/olivermueller-onetitel"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors mt-1"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <rect x="1" y="1" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M4.5 6.5v5M4.5 4.5v.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M7.5 11.5V9a2 2 0 014 0v2.5M7.5 6.5v5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                LinkedIn
              </a>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/demo"
            className="inline-flex items-center justify-center gap-2 bg-white text-slate-900 font-bold px-6 py-3 rounded-xl hover:bg-slate-100 transition-all text-sm"
          >
            Demo ansehen
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <Link
            href="/kontakt"
            className="inline-flex items-center justify-center gap-2 bg-slate-800 text-white border border-slate-700 font-semibold px-6 py-3 rounded-xl hover:bg-slate-700 transition-all text-sm"
          >
            Kontakt aufnehmen
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700/60 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between text-xs text-slate-500">
          <span>© {new Date().getFullYear()} ONEmatic · Oliver M. Müller</span>
          <div className="flex gap-4">
            <Link href="/impressum" className="hover:text-slate-300 transition-colors">Impressum</Link>
            <Link href="/datenschutz" className="hover:text-slate-300 transition-colors">Datenschutz</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
