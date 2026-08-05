import { Badge } from "./HeroDashboard";
import { Icons } from "./icons";

const features = [
  { icon: "msg", title: "Prompt Center", text: "Kampagnen in natürlicher Sprache beschreiben. Das System übernimmt Setup, Segmente und Konfiguration." },
  { icon: "layers", title: "Zentrale Kampagnensteuerung", text: "Alle Kampagnen in einer Oberfläche. Kein Tool-Wechsel zwischen DSPs, Reporting-Systemen und Datenquellen." },
  { icon: "db", title: "DSP Defaults", text: "Vorkonfigurierte Setups für DV360, The Trade Desk & weitere DSPs. Starte schnell, ohne Setup von null." },
  { icon: "image", title: "Creative Management", text: "Banner, Video, DOOH und CTV-Assets direkt hochladen, zuweisen und performance-basiert rotieren lassen." },
  { icon: "eye", title: "Daten & Verification", text: "Drittsegmente, First-Party-Daten und Brand-Safety-Verification nahtlos in jede Kampagne integrieren." },
  { icon: "chart", title: "Reporting & AI Insights", text: "Unified Reporting über alle Kanäle. AI-generierte Insights und Optimierungsvorschläge in Echtzeit." },
];

export function FeatureGrid() {
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
