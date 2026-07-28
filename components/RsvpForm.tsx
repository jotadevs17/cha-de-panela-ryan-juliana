"use client";

import { CheckCircle2, Loader2, Send, UsersRound } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { ApiResult } from "@/lib/types";

function hasAtLeastOneLetter(value: string) {
  return /[A-Za-zÀ-ÿ]/.test(value.trim());
}

export function RsvpForm() {
  const router = useRouter();
  const [attendeeNames, setAttendeeNames] = useState([""]);
  const [guestWhatsapp, setGuestWhatsapp] = useState("");
  const [guestsCount, setGuestsCount] = useState("1");
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState<ApiResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const requestedGuests = Number(guestsCount);
  const canSubmit =
    attendeeNames.length === requestedGuests &&
    attendeeNames.every(hasAtLeastOneLetter);

  useEffect(() => {
    setAttendeeNames((current) =>
      Array.from({ length: requestedGuests }, (_, index) => current[index] ?? "")
    );
  }, [requestedGuests]);

  function updateAttendeeName(index: number, value: string) {
    setAttendeeNames((current) => current.map((name, currentIndex) => (currentIndex === index ? value : name)));
  }

  function submitRsvp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      const response = await fetch("/api/rsvps", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          attendeeNames,
          guestWhatsapp,
          guestsCount: Number(guestsCount),
          message
        })
      });

      const result = (await response.json()) as ApiResult;
      setFeedback(result);

      if (result.ok) {
        const thankYouParams = new URLSearchParams({
          tipo: "presenca",
          pessoas: String(requestedGuests)
        });

        setAttendeeNames([""]);
        setGuestWhatsapp("");
        setGuestsCount("1");
        setMessage("");
        router.push(`/obrigado?${thankYouParams.toString()}`);
      }
    });
  }

  return (
    <section id="presenca" className="bg-blueink-900 py-14 text-white sm:py-16">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-10">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-blueink-50">
            <UsersRound size={17} />
            Confirmação de presença
          </p>
          <h2 className="mt-5 text-3xl font-semibold leading-tight sm:text-4xl">
            Confirme sua presença no Chá de Panela
          </h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-blueink-50/85 sm:text-lg">
            Sua confirmação ajuda a gente a organizar esse dia com mais carinho e tranquilidade.
          </p>

        </div>

        <div className="rounded-lg border border-white/15 bg-white p-5 text-blueink-950 shadow-soft sm:p-6">
          {feedback ? (
            <div
              className={`mb-5 rounded-lg border p-4 text-sm font-medium ${
                feedback.ok
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-rose-200 bg-rose-50 text-rose-800"
              }`}
              role="status"
            >
              {feedback.message}
            </div>
          ) : null}

          <form onSubmit={submitRsvp}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-blueink-900">WhatsApp</span>
              <input
                value={guestWhatsapp}
                onChange={(event) => setGuestWhatsapp(event.target.value)}
                className="focus-ring mt-2 h-12 w-full rounded-lg border border-blueink-100 bg-blueink-50/70 px-4 text-blueink-900 placeholder:text-pewter"
                placeholder="(21) 99999-9999"
                inputMode="tel"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-blueink-900">Quantidade de pessoas</span>
              <select
                value={guestsCount}
                onChange={(event) => setGuestsCount(event.target.value)}
                className="focus-ring mt-2 h-12 w-full rounded-lg border border-blueink-100 bg-blueink-50/70 px-4 text-blueink-900"
              >
                {Array.from({ length: 10 }, (_, index) => index + 1).map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-3 sm:col-span-2">
              <div>
                <p className="text-sm font-semibold text-blueink-900">Nomes confirmados</p>
                <p className="mt-1 text-xs leading-5 text-pewter">
                  Informe nome e sobrenome de cada pessoa para a lista de presença. O WhatsApp pode ser o mesmo para todos.
                </p>
              </div>
              {attendeeNames.map((name, index) => (
                <label key={index} className="block">
                  <span className="text-sm font-semibold text-blueink-900">Pessoa {index + 1}</span>
                  <input
                    value={name}
                    onChange={(event) => updateAttendeeName(index, event.target.value)}
                    className="focus-ring mt-2 h-12 w-full rounded-lg border border-blueink-100 bg-blueink-50/70 px-4 text-blueink-900 placeholder:text-pewter"
                    placeholder="Nome e sobrenome"
                  />
                </label>
              ))}
            </div>

            <label className="block sm:col-span-2">
              <span className="text-sm font-semibold text-blueink-900">Mensagem</span>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className="focus-ring mt-2 min-h-24 w-full resize-y rounded-lg border border-blueink-100 bg-blueink-50/70 px-4 py-3 text-blueink-900 placeholder:text-pewter"
                placeholder="Opcional"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={isPending || !canSubmit}
            className="focus-ring mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-blueink-700 px-5 py-3 font-semibold text-white transition hover:bg-blueink-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isPending ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
            Confirmar presença
            <Send size={16} />
          </button>
          </form>
        </div>
      </div>
    </section>
  );
}
