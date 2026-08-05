import { Badge } from "./HeroDashboard";

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

export function ProblemSection() {
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
