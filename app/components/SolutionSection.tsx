import { cn } from "../lib/utils";
import { Badge } from "./HeroDashboard";
import { Icons } from "./icons";

export function SolutionSection() {
  return (
    <section className="py-24 bg-[#f8fafc]" id="funktionen">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
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
                  i === 3 ? "bg-white/10 border-white/20" : "bg-white/5 border-white/10"
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
