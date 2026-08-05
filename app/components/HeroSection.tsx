"use client";

import Link from "next/link";
import { handlePlatformStart } from "../lib/platform";
import { Icons } from "./icons";
import { Badge, HeroDashboard } from "./HeroDashboard";

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-24 overflow-hidden bg-[#f8fafc]" id="produkt">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-slate-200/40 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-20 right-0 w-72 h-72 bg-blue-100/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-10 w-48 h-48 bg-slate-300/20 rounded-full blur-2xl" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
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
              {["Keine Vorkenntnisse nötig", "In 15 Minuten live", "100% Self-Service"].map((t) => (
                <div key={t} className="flex items-center gap-2 text-sm text-slate-500">
                  <span className="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <Icons.Check />
                  </span>
                  {t}
                </div>
              ))}
            </div>
          </div>

          <div className="hidden lg:block">
            <HeroDashboard />
          </div>
        </div>
      </div>
    </section>
  );
}
