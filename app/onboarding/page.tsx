"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

const STEPS = ["Unternehmen", "DSP & Markt", "Ziele"] as const;

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    company: "",
    dsp: "DV360",
    markt: "DACH",
    ziel: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const next = async () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      return;
    }

    // Last step — save to profiles
    setLoading(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { error: upsertError } = await supabase.from("profiles").upsert({
      id: user.id,
      firma: data.company,
      dsp_praeferenz: data.dsp,
      branche: data.markt,
      kampagnenziel: data.ziel,
      onboarded: true,
    });

    if (upsertError) {
      setError(upsertError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard?redirect=billing");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900 mb-4">
            <span className="text-white font-bold text-sm">O</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Setup</h1>
          <p className="text-slate-500 text-sm mt-1">Schritt {step + 1} von {STEPS.length}: {STEPS[step]}</p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-6">
          {STEPS.map((_, i) => (
            <div key={i} className={`flex-1 h-1.5 rounded-full transition-colors ${i <= step ? "bg-slate-900" : "bg-slate-200"}`} />
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          {step === 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Unternehmensname</label>
              <input
                type="text"
                value={data.company}
                onChange={(e) => setData({ ...data, company: e.target.value })}
                placeholder="Dein Unternehmen"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bevorzugter DSP</label>
                <select
                  value={data.dsp}
                  onChange={(e) => setData({ ...data, dsp: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50"
                >
                  <option>DV360</option>
                  <option>The Trade Desk</option>
                  <option>Xandr</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Zielmarkt</label>
                <select
                  value={data.markt}
                  onChange={(e) => setData({ ...data, markt: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50"
                >
                  <option>DACH</option>
                  <option>Deutschland</option>
                  <option>Europa</option>
                </select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Primäres Kampagnenziel</label>
              <select
                value={data.ziel}
                onChange={(e) => setData({ ...data, ziel: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50"
              >
                <option value="" disabled>Ziel auswählen</option>
                <option>Leadgenerierung</option>
                <option>Brand Awareness</option>
                <option>Conversions</option>
                <option>Abverkauf / Sales</option>
              </select>
            </div>
          )}

          <button
            onClick={next}
            disabled={loading}
            className="w-full bg-slate-900 text-white font-semibold py-2.5 rounded-xl text-sm hover:bg-slate-800 transition-colors disabled:opacity-60"
          >
            {loading ? "Wird gespeichert…" : step < STEPS.length - 1 ? "Weiter" : "Dashboard öffnen"}
          </button>

          {error && (
            <p className="text-sm text-red-600 text-center">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
