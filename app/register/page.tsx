"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

// ── 6-digit OTP input ──────────────────────────────────────────────
function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(6, "").split("").slice(0, 6);

  const focus = (i: number) => inputs.current[i]?.focus();

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const next = value.slice(0, i) + value.slice(i + 1);
      onChange(next);
      if (i > 0) focus(i - 1);
    } else if (e.key === "ArrowLeft" && i > 0) {
      focus(i - 1);
    } else if (e.key === "ArrowRight" && i < 5) {
      focus(i + 1);
    }
  };

  const handleChange = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) return;
    // Handle paste of multiple digits
    if (raw.length > 1) {
      const next = (value.slice(0, i) + raw).slice(0, 6);
      onChange(next);
      focus(Math.min(i + raw.length, 5));
      return;
    }
    const next = value.slice(0, i) + raw[0] + value.slice(i + 1);
    onChange(next.slice(0, 6));
    if (i < 5) focus(i + 1);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted);
    focus(Math.min(pasted.length, 5));
  };

  return (
    <div className="flex gap-3 justify-center">
      {Array.from({ length: 6 }, (_, i) => (
        <input
          key={i}
          ref={(el) => { inputs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i] === " " ? "" : digits[i]}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKey(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className="w-11 h-14 text-center text-xl font-bold border-2 rounded-xl bg-slate-800 text-white border-slate-600 focus:border-white focus:outline-none transition-colors caret-transparent"
        />
      ))}
    </div>
  );
}

export default function RegisterPage() {
  const [step, setStep] = useState<"register" | "verify">("register");

  // Registration fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Verification fields
  const [otp, setOtp] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState("");

  const router = useRouter();

  // ── Step 1: Register ──────────────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      await supabase.from("profiles").upsert({ id: data.user.id, name, onboarded: false });
    }

    setLoading(false);
    setStep("verify");
  };

  // ── Step 2: Verify OTP ────────────────────────────────────────────
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) {
      setVerifyError("Bitte alle 6 Ziffern eingeben.");
      return;
    }
    setVerifyLoading(true);
    setVerifyError("");

    const { error: verifyErr } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "signup",
    });

    if (verifyErr) {
      setVerifyError("Ungültiger Code. Bitte erneut versuchen.");
      setVerifyLoading(false);
      return;
    }

    router.push("/onboarding");
  };

  const handleResend = async () => {
    setResendMsg("");
    const { error: resendErr } = await supabase.auth.resend({ type: "signup", email });
    if (resendErr) {
      setResendMsg("Fehler beim Senden. Bitte versuche es erneut.");
    } else {
      setResendMsg("Code wurde erneut gesendet ✓");
    }
    setTimeout(() => setResendMsg(""), 5000);
  };

  // ── Shared logo/header ────────────────────────────────────────────
  const Logo = () => (
    <div className="text-center mb-8">
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 mb-4">
        <span className="text-white font-bold text-sm">O</span>
      </div>
    </div>
  );

  // ── Render: Verify step ───────────────────────────────────────────
  if (step === "verify") {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <Logo />

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white">Email bestätigen</h1>
            <p className="text-slate-400 text-sm mt-2 leading-relaxed">
              Wir haben einen 6-stelligen Code an{" "}
              <span className="text-white font-medium">{email}</span> gesendet.
              <br />Bitte gib ihn unten ein.
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-6">
            <OtpInput value={otp} onChange={setOtp} />

            {verifyError && (
              <p className="text-sm text-red-400 text-center">{verifyError}</p>
            )}
            {resendMsg && (
              <p className="text-sm text-emerald-400 text-center">{resendMsg}</p>
            )}

            <button
              type="submit"
              disabled={verifyLoading || otp.length < 6}
              className="w-full bg-white text-slate-900 font-semibold py-2.5 rounded-xl text-sm hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              {verifyLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-slate-400 border-t-slate-800 rounded-full animate-spin" />
                  Wird geprüft…
                </span>
              ) : "Code bestätigen"}
            </button>
          </form>

          <div className="mt-6 flex flex-col items-center gap-3 text-sm">
            <button
              onClick={handleResend}
              className="text-slate-400 hover:text-white transition-colors underline underline-offset-2"
            >
              Code erneut senden
            </button>
            <button
              onClick={() => { setStep("register"); setOtp(""); setVerifyError(""); }}
              className="text-slate-500 hover:text-slate-300 transition-colors"
            >
              ← Zurück zur Registrierung
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: Register step ─────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900 mb-4">
            <span className="text-white font-bold text-sm">O</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Account erstellen</h1>
          <p className="text-slate-500 text-sm mt-1">Starte kostenlos mit ONEmatic</p>
        </div>

        <form onSubmit={handleRegister} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Dein Name"
              required
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">E-Mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="deine@email.de"
              required
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Passwort</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 Zeichen"
              required
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white font-semibold py-2.5 rounded-xl text-sm hover:bg-slate-800 transition-colors disabled:opacity-60"
          >
            {loading ? "Wird registriert…" : "Kostenlos starten"}
          </button>
          {error && (
            <p className="text-sm text-red-600 text-center">{error}</p>
          )}
        </form>

        <p className="text-center text-sm text-slate-500 mt-4">
          Bereits registriert?{" "}
          <Link href="/login" className="text-slate-900 font-semibold hover:underline">
            Anmelden
          </Link>
        </p>
      </div>
    </div>
  );
}
