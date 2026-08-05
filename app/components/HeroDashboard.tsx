import { cn } from "../lib/utils";

export function Badge({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "dark" | "live" }) {
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

export function HeroDashboard() {
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

          {/* AI recommendations */}
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
