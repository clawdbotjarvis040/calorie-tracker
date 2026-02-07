"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [status, setStatus] = useState<"idle" | "working" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus("working");

    const supabase = createClient();

    const result =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    if (result.error) {
      setError(result.error.message);
      setStatus("error");
      return;
    }

    // If email confirmations are enabled in Supabase, signup may require email verification.
    // If confirmations are disabled, session will be created immediately.
    window.location.href = "/";
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4">
      <h1 className="text-2xl font-semibold">Calorie Tracker</h1>
      <p className="mt-2 text-sm text-slate-300">
        Sign in with email + password.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode("signin")}
            className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium ${
              mode === "signin"
                ? "bg-slate-800 text-slate-50"
                : "bg-slate-950 text-slate-300"
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium ${
              mode === "signup"
                ? "bg-slate-800 text-slate-50"
                : "bg-slate-950 text-slate-300"
            }`}
          >
            Sign up
          </button>
        </div>

        <label className="block text-sm font-medium">Email</label>
        <input
          type="email"
          required
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-slate-50 placeholder:text-slate-500"
          placeholder="you@example.com"
        />

        <label className="block text-sm font-medium">Password</label>
        <input
          type="password"
          required
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-slate-50 placeholder:text-slate-500"
          placeholder="••••••••"
        />

        <button
          type="submit"
          disabled={status === "working"}
          className="w-full rounded-xl bg-blue-600 px-4 py-2 font-medium disabled:opacity-60"
        >
          {status === "working"
            ? "Working…"
            : mode === "signin"
              ? "Sign in"
              : "Create account"}
        </button>

        {mode === "signup" ? (
          <p className="text-xs text-slate-500">
            If Supabase email confirmations are enabled, you may need to verify
            your email before the account can sign in.
          </p>
        ) : null}

        {error ? <p className="text-sm text-red-300">{error}</p> : null}
      </form>

      <p className="mt-6 text-xs text-slate-500">
        Tip: Add this to your iPhone Home Screen after you sign in.
      </p>
    </main>
  );
}
