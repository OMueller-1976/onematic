import { Badge } from "./HeroDashboard";
import { Icons } from "./icons";

export function AgenticSection() {
  return (
    <section className="py-24 bg-[#1e293b] relative overflow-hidden" id="agentic">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-slate-500/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative">
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

        <div className="grid lg:grid-cols-2 gap-6 mb-12">
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
