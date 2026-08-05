import Link from "next/link";
import { Icons } from "./icons";

export function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8 mb-10">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <Icons.Logo />
              <span className="font-bold text-slate-900">ONEmatic</span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
              AI Programmatic Advertising for EveryONE. Zentrale Kampagnensteuerung mit Agentic Optimization Layer.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-900 tracking-widest uppercase">Produkt</p>
            {["Funktionen", "Agentic Layer", "Pricing", "Changelog"].map((l) => (
              <span key={l} className="block text-sm text-slate-500">{l}</span>
            ))}
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-900 tracking-widest uppercase">Unternehmen</p>
            <Link href="/ueber-onematic" className="block text-sm text-slate-500 hover:text-slate-900 transition-colors">Über ONEmatic</Link>
            <Link href="/kontakt" className="block text-sm text-slate-500 hover:text-slate-900 transition-colors">Kontakt</Link>
            <Link href="/impressum" className="block text-sm text-slate-500 hover:text-slate-900 transition-colors">Impressum</Link>
            <Link href="/datenschutz" className="block text-sm text-slate-500 hover:text-slate-900 transition-colors">Datenschutz</Link>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-6 flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-xs text-slate-400">© 2025 ONEmatic. Alle Rechte vorbehalten.</p>
          <p className="text-xs text-slate-400">AI Programmatic Advertising for EveryONE</p>
        </div>
      </div>
    </footer>
  );
}
