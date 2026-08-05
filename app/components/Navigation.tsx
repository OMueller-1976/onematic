"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "../lib/utils";
import { handlePlatformStart } from "../lib/platform";
import { Icons } from "./icons";

export function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const links = [
    { label: "Produkt", href: "#produkt" },
    { label: "Funktionen", href: "#funktionen" },
    { label: "Agentic Layer", href: "#agentic" },
    { label: "Für wen", href: "#fuer-wen" },
    { label: "Kontakt", href: "/kontakt" },
  ];

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
      scrolled ? "bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-sm" : "bg-transparent"
    )}>
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <Icons.Logo />
          <span className="font-bold text-slate-900 tracking-tight text-lg">ONEmatic</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a key={l.label} href={l.href} className="text-sm text-slate-500 hover:text-slate-900 transition-colors font-medium">
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/demo" className="text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors">Demo ansehen</Link>
          <button onClick={handlePlatformStart} className="inline-flex items-center gap-2 bg-slate-900 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-slate-800 transition-colors">
            Plattform starten <Icons.Arrow />
          </button>
        </div>

        <button className="md:hidden text-slate-600" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <Icons.X /> : <Icons.Menu />}
        </button>
      </nav>

      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-slate-200 px-6 py-4 space-y-4">
          {links.map((l) => (
            <a key={l.label} href={l.href} className="block text-sm text-slate-600 font-medium" onClick={() => setMobileOpen(false)}>
              {l.label}
            </a>
          ))}
          <button onClick={handlePlatformStart} className="block w-full text-center bg-slate-900 text-white text-sm font-semibold px-4 py-2.5 rounded-xl">
            Plattform starten
          </button>
        </div>
      )}
    </header>
  );
}
