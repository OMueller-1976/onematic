"use client";

import Link from "next/link";
import { handlePlatformStart } from "../lib/platform";
import { Icons } from "./icons";
import { Badge } from "./HeroDashboard";

export function FinalCTA() {
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
