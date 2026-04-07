"use client";

import { useState } from "react";
import Link from "next/link";

const THEMA_OPTIONEN = [
  "Demo anfragen",
  "Preise & Pakete",
  "Technische Fragen",
  "Partnerschaft",
  "Sonstiges",
] as const;

export default function KontaktPage() {
  const [form, setForm] = useState({ name: "", email: "", firma: "", thema: "Demo anfragen", nachricht: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Fehler beim Senden");
      }
      setSuccess(true);
      setForm({ name: "", email: "", firma: "", thema: "Demo anfragen", nachricht: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  };

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

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-16 items-start">

          {/* Left — Contact info */}
          <div className="space-y-8">
            <div className="space-y-4">
              <span className="inline-block text-[10px] font-semibold text-slate-400 tracking-[0.2em] uppercase border border-slate-700 rounded-full px-3 py-1">
                Kontakt
              </span>
              <h1 className="text-4xl font-bold text-white tracking-tight leading-tight">
                Sprechen Sie<br />
                <span className="text-slate-400">uns an</span>
              </h1>
              <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
                Sie haben Fragen zu ONEmatic, möchten eine Demo buchen oder über eine Partnerschaft sprechen?
                Wir melden uns innerhalb von 24 Stunden bei Ihnen.
              </p>
            </div>

            <div className="space-y-4">
              <a href="mailto:kontakt@onetitel.de"
                 className="flex items-center gap-3 text-sm text-slate-300 hover:text-white transition-colors group">
                <span className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center group-hover:border-slate-500 transition-colors shrink-0">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.4" />
                    <path d="M1 5l7 5 7-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                </span>
                kontakt@onetitel.de
              </a>

              <a href="https://www.linkedin.com/in/olivermueller-onetitel"
                 target="_blank"
                 rel="noopener noreferrer"
                 className="flex items-center gap-3 text-sm text-slate-300 hover:text-white transition-colors group">
                <span className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center group-hover:border-slate-500 transition-colors shrink-0">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="1" y="1" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.4" />
                    <path d="M4.5 6.5v5M4.5 4.5v.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M7.5 11.5V9a2 2 0 014 0v2.5M7.5 6.5v5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                </span>
                LinkedIn · Oliver M. Müller
              </a>
            </div>

            <div className="rounded-2xl bg-slate-800/60 border border-slate-700 p-5 space-y-1">
              <p className="text-xs font-semibold text-slate-400 tracking-widest uppercase">Antwortzeit</p>
              <p className="text-white font-semibold">Innerhalb von 24 Stunden</p>
              <p className="text-sm text-slate-400">Mo – Fr, 9:00 – 18:00 Uhr</p>
            </div>
          </div>

          {/* Right — Form */}
          <div className="bg-slate-800/40 border border-slate-700 rounded-3xl p-8">
            {success ? (
              <div className="flex flex-col items-center justify-center text-center py-8 space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M4 12l6 6L20 6" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-semibold text-lg">Vielen Dank!</p>
                  <p className="text-slate-400 text-sm mt-1">Wir melden uns bald bei Ihnen.</p>
                </div>
                <button
                  onClick={() => setSuccess(false)}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors mt-2"
                >
                  Weitere Nachricht senden
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                      Name <span className="text-slate-500">*</span>
                    </label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      placeholder="Max Mustermann"
                      className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-slate-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                      E-Mail <span className="text-slate-500">*</span>
                    </label>
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      placeholder="max@firma.de"
                      className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-slate-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                    Firma <span className="text-slate-600">(optional)</span>
                  </label>
                  <input
                    name="firma"
                    value={form.firma}
                    onChange={handleChange}
                    placeholder="Ihre Agentur oder Ihr Unternehmen"
                    className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-slate-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                    Thema
                  </label>
                  <select
                    name="thema"
                    value={form.thema}
                    onChange={handleChange}
                    className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-slate-500 transition-colors"
                  >
                    {THEMA_OPTIONEN.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                    Nachricht <span className="text-slate-500">*</span>
                  </label>
                  <textarea
                    name="nachricht"
                    value={form.nachricht}
                    onChange={handleChange}
                    required
                    rows={4}
                    placeholder="Wie können wir Ihnen helfen?"
                    className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-slate-500 transition-colors resize-none"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-400 rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white text-slate-900 font-semibold text-sm py-3 rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                        <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                      Wird gesendet…
                    </>
                  ) : (
                    "Nachricht senden"
                  )}
                </button>
              </form>
            )}
          </div>

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
