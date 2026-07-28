"use client";

import { Loader2, LockKeyhole } from "lucide-react";
import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ApiResult } from "@/lib/types";

export function AdminLogin({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState<ApiResult | null>(
    configured
      ? null
      : {
          ok: false,
          message: "ADMIN_PASSWORD ainda não foi configurada."
        }
  );
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ password })
      });

      const result = (await response.json()) as ApiResult;
      setFeedback(result);

      if (result.ok) {
        router.refresh();
      }
    });
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(143,161,79,0.24),transparent_34%),linear-gradient(135deg,#fcfdf6_0%,#edf1df_52%,#f7f8ef_100%)] px-5 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center">
        <section className="w-full rounded-lg border border-blueink-100 bg-white p-6 shadow-soft">
          <div className="mb-7 inline-flex h-12 w-12 items-center justify-center rounded-full bg-blueink-50 text-blueink-700">
            <LockKeyhole size={22} />
          </div>
          <h1 className="text-3xl font-semibold text-blueink-900">Admin do Chá de Casa Nova</h1>
          <p className="mt-3 text-sm leading-6 text-pewter">
            Acesso reservado para gerenciar presentes e reservas.
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <label className="block">
              <span className="text-sm font-semibold text-blueink-900">Senha</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="focus-ring mt-2 h-12 w-full rounded-lg border border-blueink-100 bg-blueink-50/70 px-4 text-blueink-900"
                autoComplete="current-password"
              />
            </label>

            {feedback ? (
              <div
                className={`rounded-lg border p-3 text-sm font-medium ${
                  feedback.ok
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-rose-200 bg-rose-50 text-rose-800"
                }`}
                role="status"
              >
                {feedback.message}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isPending || !configured || password.trim().length === 0}
              className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-full bg-blueink-700 px-5 py-3 font-semibold text-white transition hover:bg-blueink-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isPending ? <Loader2 className="animate-spin" size={18} /> : <LockKeyhole size={18} />}
              Entrar
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
