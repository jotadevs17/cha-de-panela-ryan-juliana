"use client";

import {
  ArrowUpDown,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Gift,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  LogOut,
  Search,
  StickyNote,
  UsersRound,
  X
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatCurrencyFromCents, normalizeText } from "@/lib/format";
import type { AdminGift, ApiResult } from "@/lib/types";

type AdminReceiptsPanelProps = {
  gifts: AdminGift[];
  loadError: string | null;
};

type PaymentFilter = "todos" | "recebidos" | "debito";
type SortOrder = "recentes" | "antigos";

type NoteDraft = {
  gift: AdminGift;
  note: string;
};

type PaymentUpdate = {
  reservation: {
    id: number;
    paidAt: string | null;
    paymentNote: string | null;
    updatedAt: string;
  };
};

const pageSize = 10;

export function AdminReceiptsPanel({ gifts, loadError }: AdminReceiptsPanelProps) {
  const router = useRouter();
  const [items, setItems] = useState(gifts);
  const [query, setQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("todos");
  const [sortOrder, setSortOrder] = useState<SortOrder>("recentes");
  const [currentPage, setCurrentPage] = useState(1);
  const [feedback, setFeedback] = useState<ApiResult<unknown> | null>(null);
  const [noteDraft, setNoteDraft] = useState<NoteDraft | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setItems(gifts);
  }, [gifts]);

  useEffect(() => {
    setCurrentPage(1);
  }, [paymentFilter, query, sortOrder]);

  const reservedGifts = useMemo(
    () =>
      items.filter((gift) => gift.reservation),
    [items]
  );

  const summary = useMemo(
    () =>
      reservedGifts.reduce(
        (acc, gift) => {
          const cents = gift.priceCents ?? 0;

          if (gift.reservation?.paidAt) {
            acc.received += 1;
            acc.receivedTotalCents += cents;
          } else {
            acc.pending += 1;
            acc.pendingTotalCents += cents;
          }

          return acc;
        },
        {
          received: 0,
          pending: 0,
          receivedTotalCents: 0,
          pendingTotalCents: 0
        }
      ),
    [reservedGifts]
  );

  const filtered = useMemo(() => {
    const normalizedQuery = normalizeText(query);

    return reservedGifts.filter((gift) => {
      const isPaid = Boolean(gift.reservation?.paidAt);
      const matchesPayment =
        paymentFilter === "todos" ||
        (paymentFilter === "recebidos" && isPaid) ||
        (paymentFilter === "debito" && !isPaid);
      const matchesQuery =
        normalizedQuery.length === 0 ||
        normalizeText(`${gift.name} ${gift.reservation?.guestName ?? ""} ${gift.reservation?.paymentNote ?? ""}`).includes(
          normalizedQuery
        );

      return matchesPayment && matchesQuery;
    });
  }, [paymentFilter, query, reservedGifts]);

  const sortedGifts = useMemo(
    () =>
      [...filtered].sort((a, b) => {
        const firstDate = a.reservation ? new Date(a.reservation.createdAt).getTime() : 0;
        const secondDate = b.reservation ? new Date(b.reservation.createdAt).getTime() : 0;
        return sortOrder === "recentes" ? secondDate - firstDate : firstDate - secondDate;
      }),
    [filtered, sortOrder]
  );

  const pageCount = Math.max(1, Math.ceil(sortedGifts.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, pageCount);
  const pageStart = sortedGifts.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const pageEnd = Math.min(safeCurrentPage * pageSize, sortedGifts.length);
  const paginatedGifts = sortedGifts.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);

  function updateReservationState(data: PaymentUpdate["reservation"]) {
    setItems((current) =>
      current.map((gift) =>
        gift.reservation?.id === data.id
          ? {
              ...gift,
              reservation: {
                ...gift.reservation,
                paidAt: data.paidAt,
                paymentNote: data.paymentNote,
                updatedAt: data.updatedAt
              }
            }
          : gift
      )
    );
  }

  function runMutation(task: () => Promise<ApiResult<PaymentUpdate>>, success?: (data: PaymentUpdate) => void) {
    setFeedback(null);
    startTransition(async () => {
      const result = await task();
      setFeedback(result);

      if (result.ok && result.data) {
        updateReservationState(result.data.reservation);
        success?.(result.data);
        router.refresh();
      }
    });
  }

  function updatePayment(gift: AdminGift, paid: boolean, paymentNote?: string | null, onSuccess?: () => void) {
    if (!gift.reservation) {
      return;
    }

    runMutation(
      async () => {
        const response = await fetch(`/api/admin/reservations/${gift.reservation?.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            paid,
            ...(paymentNote !== undefined ? { paymentNote } : {})
          })
        });
        return (await response.json()) as ApiResult<PaymentUpdate>;
      },
      onSuccess
    );
  }

  function saveNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!noteDraft?.gift.reservation) {
      return;
    }

    updatePayment(noteDraft.gift, Boolean(noteDraft.gift.reservation.paidAt), noteDraft.note, () => setNoteDraft(null));
  }

  function logout() {
    setFeedback(null);
    startTransition(async () => {
      const response = await fetch("/api/admin/logout", { method: "POST" });
      const result = (await response.json()) as ApiResult;
      setFeedback(result);

      if (result.ok) {
        router.push("/admin");
        router.refresh();
      }
    });
  }

  return (
    <main className="min-h-screen bg-[#f6f8fa]">
      <header className="border-b border-blueink-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-6 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div>
            <p className="text-sm font-semibold uppercase text-blueink-600">Admin</p>
            <h1 className="mt-2 text-3xl font-semibold text-blueink-900">Recebimentos</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href="/admin"
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border border-blueink-200 bg-white px-4 py-2 text-sm font-semibold text-blueink-800 transition hover:bg-blueink-50"
            >
              <Gift size={17} />
              Presentes
            </a>
            <a
              href="/admin/confirmacoes"
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border border-blueink-200 bg-white px-4 py-2 text-sm font-semibold text-blueink-800 transition hover:bg-blueink-50"
            >
              <UsersRound size={17} />
              Confirmações
            </a>
            <a
              href="/"
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border border-blueink-200 bg-white px-4 py-2 text-sm font-semibold text-blueink-800 transition hover:bg-blueink-50"
            >
              Ver site
            </a>
            <button
              type="button"
              onClick={logout}
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-blueink-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blueink-800"
            >
              <LogOut size={17} />
              Sair
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
        {loadError ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
            {loadError}
          </div>
        ) : null}

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

        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Metric label="Reservas" value={reservedGifts.length} />
          <Metric label="Recebidos" value={summary.received} tone="green" />
          <Metric label="Em débito" value={summary.pending} tone="rose" />
          <Metric
            label="Valor recebido"
            value={formatCurrencyFromCents(summary.receivedTotalCents) ?? "R$ 0,00"}
            tone="green"
          />
          <Metric label="Valor em débito" value={formatCurrencyFromCents(summary.pendingTotalCents) ?? "R$ 0,00"} />
        </div>

        <div className="mb-6 grid gap-3 rounded-lg border border-blueink-100 bg-white p-4 shadow-sm lg:grid-cols-[1fr_auto_auto]">
          <label className="relative block">
            <span className="sr-only">Pesquisar recebimentos</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-pewter" size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar convidado, presente ou observação"
              className="focus-ring h-12 w-full rounded-full border border-blueink-100 bg-blueink-50/60 pl-11 pr-4 text-sm text-blueink-900"
            />
          </label>

          <div className="grid grid-cols-3 gap-2 rounded-full bg-blueink-50 p-1">
            {[
              ["todos", "Todos"],
              ["debito", "Débitos"],
              ["recebidos", "Recebidos"]
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setPaymentFilter(value as PaymentFilter)}
                className={`focus-ring rounded-full px-4 py-2 text-sm font-semibold transition ${
                  paymentFilter === value
                    ? "bg-white text-blueink-900 shadow-sm"
                    : "text-blueink-700 hover:bg-white/70"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <label className="relative block">
            <span className="sr-only">Ordenar por inclusão</span>
            <ArrowUpDown className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-pewter" size={17} />
            <select
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value as SortOrder)}
              className="focus-ring h-12 min-w-52 rounded-full border border-blueink-100 bg-blueink-50/60 pl-11 pr-9 text-sm font-semibold text-blueink-900"
            >
              <option value="recentes">Mais recentes</option>
              <option value="antigos">Mais antigos</option>
            </select>
          </label>
        </div>

        <div className="overflow-hidden rounded-lg border border-blueink-100 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-blueink-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-pewter">
              Exibindo {pageStart}-{pageEnd} de {sortedGifts.length} presentes preenchidos
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={safeCurrentPage === 1}
                className="focus-ring inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-blueink-200 px-3 text-sm font-semibold text-blueink-800 transition hover:bg-blueink-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
              >
                <ChevronsLeft size={16} />
                Primeira
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={safeCurrentPage === 1}
                className="focus-ring inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-blueink-200 px-3 text-sm font-semibold text-blueink-800 transition hover:bg-blueink-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
              >
                <ChevronLeft size={16} />
                Anterior
              </button>
              <span className="inline-flex h-10 items-center rounded-full bg-blueink-50 px-3 text-sm font-semibold text-blueink-800">
                {safeCurrentPage}/{pageCount}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}
                disabled={safeCurrentPage === pageCount}
                className="focus-ring inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-blueink-200 px-3 text-sm font-semibold text-blueink-800 transition hover:bg-blueink-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
              >
                Próxima
                <ChevronRight size={16} />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(pageCount)}
                disabled={safeCurrentPage === pageCount}
                className="focus-ring inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-blueink-200 px-3 text-sm font-semibold text-blueink-800 transition hover:bg-blueink-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
              >
                Última
                <ChevronsRight size={16} />
              </button>
            </div>
          </div>

          <div className="hidden grid-cols-[1.2fr_1.1fr_0.7fr_0.8fr_1fr] gap-4 border-b border-blueink-100 bg-blueink-50 px-5 py-3 text-xs font-semibold uppercase text-blueink-700 md:grid">
            <span>Convidado</span>
            <span>Presente</span>
            <span>Valor</span>
            <span>Status</span>
            <span className="text-right">Ações</span>
          </div>

          {sortedGifts.length === 0 ? (
            <div className="p-8 text-center text-pewter">Nenhum recebimento encontrado.</div>
          ) : (
            paginatedGifts.map((gift) => {
              const reservation = gift.reservation;
              const isPaid = Boolean(reservation?.paidAt);

              return (
                <article
                  key={gift.id}
                  className="grid gap-4 border-b border-blueink-100 px-5 py-5 last:border-b-0 md:grid-cols-[1.2fr_1.1fr_0.7fr_0.8fr_1fr] md:items-center"
                >
                  <div>
                    <p className="font-semibold text-blueink-950">{reservation?.guestName}</p>
                    <p className="mt-1 text-xs text-pewter">
                      Reservado em{" "}
                      {reservation ? formatDateTime(reservation.createdAt) : "-"}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p className="break-words text-sm font-semibold text-graphite">{gift.name}</p>
                    {reservation?.paymentNote ? (
                      <p className="mt-1 break-words text-xs text-pewter">{reservation.paymentNote}</p>
                    ) : null}
                  </div>

                  <p className="text-sm font-semibold text-blueink-900">
                    {gift.priceLabel ?? formatCurrencyFromCents(gift.priceCents) ?? "Sem valor"}
                  </p>

                  <div>
                    <PaymentPill paid={isPaid} />
                    {reservation?.paidAt ? (
                      <p className="mt-1 text-xs text-pewter">
                        {formatDateTime(reservation.paidAt)}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap justify-start gap-2 md:justify-end">
                    <button
                      type="button"
                      onClick={() => updatePayment(gift, !isPaid)}
                      disabled={isPending}
                      className={`focus-ring inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 ${
                        isPaid
                          ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
                          : "bg-emerald-600 text-white hover:bg-emerald-700"
                      }`}
                    >
                      {isPending ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                      {isPaid ? "Marcar débito" : "Dar baixa"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setNoteDraft({ gift, note: reservation?.paymentNote ?? "" })}
                      className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-full bg-blueink-50 text-blueink-800 transition hover:bg-blueink-100"
                      aria-label="Editar observação"
                      title="Editar observação"
                    >
                      <StickyNote size={17} />
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      {noteDraft ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-blueink-900/45 px-4 py-6 backdrop-blur-sm sm:items-center">
          <form onSubmit={saveNote} className="w-full max-w-xl rounded-lg bg-white p-5 shadow-soft sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase text-blueink-600">Observação</p>
                <h2 className="mt-2 text-2xl font-semibold text-blueink-900">{noteDraft.gift.name}</h2>
              </div>
              <button
                type="button"
                onClick={() => setNoteDraft(null)}
                className="focus-ring inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blueink-50 text-blueink-800 transition hover:bg-blueink-100"
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <label className="mt-6 block">
              <span className="text-sm font-semibold text-blueink-900">Observação de pagamento</span>
              <textarea
                value={noteDraft.note}
                onChange={(event) => setNoteDraft({ ...noteDraft, note: event.target.value })}
                className="focus-ring mt-2 min-h-28 w-full resize-y rounded-lg border border-blueink-100 bg-blueink-50/70 px-4 py-3 text-blueink-900"
                placeholder="Ex.: pago via Pix, aguardando comprovante, combinado para outra data..."
              />
            </label>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setNoteDraft(null)}
                className="focus-ring inline-flex items-center justify-center rounded-full border border-blueink-200 px-5 py-3 font-semibold text-blueink-800 transition hover:bg-blueink-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-blueink-700 px-5 py-3 font-semibold text-white transition hover:bg-blueink-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isPending ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                Salvar
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </main>
  );
}

function Metric({
  label,
  value,
  tone = "blue"
}: {
  label: string;
  value: number | string;
  tone?: "blue" | "green" | "rose";
}) {
  const toneClass =
    tone === "green" ? "text-emerald-700" : tone === "rose" ? "text-rose-600" : "text-blueink-900";

  return (
    <div className="rounded-lg border border-blueink-100 bg-white p-5 shadow-sm">
      <p className={`text-3xl font-semibold ${toneClass}`}>{value}</p>
      <p className="mt-1 text-sm font-medium text-pewter">{label}</p>
    </div>
  );
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  });
}

function PaymentPill({ paid }: { paid: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        paid ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
      }`}
    >
      {paid ? <CheckCircle2 size={13} /> : <Clock3 size={13} />}
      {paid ? "Recebido" : "Em débito"}
    </span>
  );
}
