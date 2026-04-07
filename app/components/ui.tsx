"use client";

import { useState } from "react";

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2 9.5V2.5C2 1.95 2.45 1.5 3 1.5H10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2.5 7L5.5 10L11.5 4" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CopyIdField({ value, className }: { value: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`relative ${className ?? ""}`}>
      <input
        type="text"
        readOnly
        value={value}
        className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-600 pr-8 cursor-default select-all focus:outline-none"
      />
      <div
        onClick={handleCopy}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && handleCopy(e as any)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        title={copied ? "Kopiert!" : "In Zwischenablage kopieren"}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </div>
    </div>
  );
}

/** @deprecated use CopyIdField */
export function CopyButton({ value }: { value: string }) {
  return <CopyIdField value={value} />;
}

export function DarkCard({
  title,
  children,
  subtitle,
  className,
  style,
}: {
  title: string;
  children: React.ReactNode;
  subtitle?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={`bg-[#111827] text-white rounded-3xl p-5 shadow-sm border border-slate-800 flex flex-col ${className || ""}`.trimEnd()} style={style}>
      {subtitle && (
        <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400 mb-2">
          {subtitle}
        </div>
      )}
      <div className="text-lg font-semibold mb-4">{title}</div>
      {children}
    </div>
  );
}

export function LightCard({
  title,
  children,
  subtitle,
  className,
  style,
}: {
  title: string;
  children: React.ReactNode;
  subtitle?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={`bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col ${className || ""}`.trimEnd()} style={style}>
      {subtitle && (
        <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500 mb-2">
          {subtitle}
        </div>
      )}
      <div className="text-xl font-bold mb-4">{title}</div>
      {children}
    </div>
  );
}
