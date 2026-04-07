"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";

export default function LoginPage() {
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = emailRef.current?.value || "";
    const password = passwordRef.current?.value || "";
    setLoading(true);
    setError("");

    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    setTimeout(() => { window.location.replace("/dashboard"); }, 500);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900 mb-4">
            <span className="text-white font-bold text-sm">O</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Willkommen zurück</h1>
          <p className="text-slate-500 text-sm mt-1">Melde dich bei ONEmatic an</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">E-Mail</label>
            <input
              type="email"
              ref={emailRef}
              placeholder="deine@email.de"
              autoComplete="email"
              required
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Passwort</label>
            <input
              type="password"
              ref={passwordRef}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white font-semibold py-2.5 rounded-xl text-sm hover:bg-slate-800 transition-colors disabled:opacity-60"
          >
            {loading ? "Wird angemeldet…" : "Anmelden"}
          </button>
          {error && (
            <p className="text-sm text-red-600 text-center">{error}</p>
          )}
        </form>

        <p className="text-center text-sm text-slate-500 mt-4">
          Noch kein Account?{" "}
          <Link href="/register" className="text-slate-900 font-semibold hover:underline">
            Jetzt registrieren
          </Link>
        </p>
      </div>
    </div>
  );
}
