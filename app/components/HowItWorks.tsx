import { Badge } from "./HeroDashboard";

// ── How It Works ──────────────────────────────────────────────────────────────
export function HowItWorks() {
  const steps = [
    { step: "01", title: "Kampagne beschreiben", text: "Du beschreibst deine Kampagne im Prompt Center: Zielgruppe, Strategie, Budget, KPI-Fokus und Märkte – in natürlicher Sprache." },
    { step: "02", title: "Defaults & Ziele festlegen", text: "Wähle DSP-Defaults, Daten- und Verification-Anbieter. Definiere Leitplanken für den Agentic Layer: Budgetgrenzen, Kanäle, Ziel-KPIs." },
    { step: "03", title: "AI erstellt das Setup", text: "Das System analysiert deine Eingaben, schlägt Segmente vor, konfiguriert das DSP-Setup und startet die Kampagne – in Minuten statt Tagen." },
    { step: "04", title: "Agentic Layer optimiert laufend", text: "Der Agentic Layer überwacht Signale, passt Budgets an, rotiert Creatives und justiert Targeting – eigenständig und in Echtzeit." },
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
export function ForWhom() {
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
export function Outcomes() {
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
