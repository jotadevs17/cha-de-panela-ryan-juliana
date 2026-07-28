"use client";

import {
  ArrowUpDown,
  BarChart3,
  CheckCircle2,
  CircleOff,
  Clock3,
  Download,
  Filter,
  Gift,
  Loader2,
  LogOut,
  Pencil,
  Plus,
  Search,
  Trash2,
  UsersRound,
  WalletCards,
  X
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { centsFromDecimalInput, formatCurrencyFromCents, getCategoryLabel, normalizeText } from "@/lib/format";
import type { AdminGift, AdminRsvp, ApiResult, GiftStatusLabel } from "@/lib/types";

type AdminPanelProps = {
  gifts: AdminGift[];
  rsvps: AdminRsvp[];
  loadError: string | null;
};

type StatusFilter = "todos" | GiftStatusLabel;
type SortOrder = "recentes" | "antigos";

type DraftGift = {
  id?: number;
  name: string;
  category: string;
  description: string;
  price: string;
};

const defaultCategories = ["Cozinha", "Mesa posta", "Eletroportateis", "Cama e banho", "Organizacao", "Casa"];

function emptyDraft(): DraftGift {
  return {
    name: "",
    category: "",
    description: "",
    price: ""
  };
}

function draftFromGift(gift: AdminGift): DraftGift {
  return {
    id: gift.id,
    name: gift.name,
    category: gift.category ?? "",
    description: gift.description ?? "",
    price: gift.priceCents ? String((gift.priceCents / 100).toFixed(2)).replace(".", ",") : ""
  };
}

export function AdminPanel({ gifts, rsvps, loadError }: AdminPanelProps) {
  const router = useRouter();
  const [items, setItems] = useState(gifts);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");
  const [categoryFilter, setCategoryFilter] = useState("todos");
  const [sortOrder, setSortOrder] = useState<SortOrder>("recentes");
  const [draft, setDraft] = useState<DraftGift | null>(null);
  const [feedback, setFeedback] = useState<ApiResult | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setItems(gifts);
  }, [gifts]);

  const categories = useMemo(() => {
    const values = new Set(defaultCategories);
    items.forEach((gift) => {
      if (gift.category) {
        values.add(gift.category);
      }
    });
    return Array.from(values);
  }, [items]);

  const summary = useMemo(
    () =>
      items.reduce(
        (acc, gift) => {
          acc.total += 1;
          if (gift.status === "reservado") {
            acc.reserved += 1;
            acc.reservedTotalCents += gift.priceCents ?? 0;
          } else {
            acc.available += 1;
          }
          return acc;
        },
        { total: 0, available: 0, reserved: 0, reservedTotalCents: 0 }
      ),
    [items]
  );

  const latestReservations = useMemo(
    () =>
      items
        .filter((gift) => gift.reservation)
        .sort((a, b) => {
          const firstDate = a.reservation ? new Date(a.reservation.createdAt).getTime() : 0;
          const secondDate = b.reservation ? new Date(b.reservation.createdAt).getTime() : 0;
          return secondDate - firstDate;
        })
        .slice(0, 5),
    [items]
  );

  const latestRsvps = useMemo(() => rsvps.slice(0, 5), [rsvps]);

  const filtered = useMemo(() => {
    const normalizedQuery = normalizeText(query);

    return items.filter((gift) => {
      const matchesStatus = statusFilter === "todos" || gift.status === statusFilter;
      const matchesCategory = categoryFilter === "todos" || gift.category === categoryFilter;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        normalizeText(`${gift.name} ${gift.categoryLabel} ${gift.reservation?.guestName ?? ""}`).includes(normalizedQuery);

      return matchesStatus && matchesCategory && matchesQuery;
    });
  }, [items, query, statusFilter, categoryFilter]);

  const sortedGifts = useMemo(
    () =>
      [...filtered].sort((a, b) => {
        const firstDate = getGiftInclusionTimestamp(a);
        const secondDate = getGiftInclusionTimestamp(b);

        if (firstDate === secondDate) {
          return sortOrder === "recentes" ? b.id - a.id : a.id - b.id;
        }

        return sortOrder === "recentes" ? secondDate - firstDate : firstDate - secondDate;
      }),
    [filtered, sortOrder]
  );

  function runMutation(task: () => Promise<ApiResult>, success?: () => void) {
    setFeedback(null);
    startTransition(async () => {
      const result = await task();
      setFeedback(result);

      if (result.ok) {
        success?.();
        router.refresh();
      }
    });
  }

  function saveDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draft) {
      return;
    }

    const body = {
      name: draft.name,
      category: draft.category || null,
      description: draft.description || null,
      priceCents: centsFromDecimalInput(draft.price)
    };

    runMutation(
      async () => {
        const response = await fetch(draft.id ? `/api/admin/gifts/${draft.id}` : "/api/admin/gifts", {
          method: draft.id ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(body)
        });
        return (await response.json()) as ApiResult;
      },
      () => setDraft(null)
    );
  }

  function deleteGift(gift: AdminGift) {
    const reservedNotice = gift.reservation ? " A reserva atual também será removida." : "";
    if (!window.confirm(`Remover "${gift.name}"?${reservedNotice}`)) {
      return;
    }

    runMutation(async () => {
      const response = await fetch(`/api/admin/gifts/${gift.id}`, { method: "DELETE" });
      return (await response.json()) as ApiResult;
    });
  }

  function cancelReservation(gift: AdminGift) {
    if (!window.confirm(`Liberar a reserva de "${gift.name}"?`)) {
      return;
    }

    runMutation(async () => {
      const response = await fetch(`/api/admin/gifts/${gift.id}/reservation`, { method: "DELETE" });
      return (await response.json()) as ApiResult;
    });
  }

  function logout() {
    runMutation(async () => {
      const response = await fetch("/api/admin/logout", { method: "POST" });
      return (await response.json()) as ApiResult;
    });
  }

  return (
    <main className="min-h-screen bg-[#f6f8fa]">
      <header className="border-b border-blueink-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-6 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div>
            <p className="text-sm font-semibold uppercase text-blueink-600">Admin</p>
            <h1 className="mt-2 text-3xl font-semibold text-blueink-900">Presentes e reservas</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href="/api/admin/export"
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border border-blueink-200 bg-white px-4 py-2 text-sm font-semibold text-blueink-800 transition hover:bg-blueink-50"
            >
              <Download size={17} />
              Lista de convidados
            </a>
            <a
              href="/admin/recebimentos"
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border border-blueink-200 bg-white px-4 py-2 text-sm font-semibold text-blueink-800 transition hover:bg-blueink-50"
            >
              <WalletCards size={17} />
              Recebimentos
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
              <Gift size={17} />
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
          <Metric label="Total" value={summary.total} />
          <Metric label="Disponíveis" value={summary.available} tone="green" />
          <Metric label="Reservados" value={summary.reserved} tone="slate" />
          <Metric label="Pessoas confirmadas" value={rsvps.reduce((total, rsvp) => total + rsvp.guestsCount, 0)} />
          <Metric label="Total reservado" value={formatCurrencyFromCents(summary.reservedTotalCents) ?? "R$ 0,00"} />
        </div>

        <AdminDashboard gifts={items} rsvps={rsvps} />

        <section className="mb-6 rounded-lg border border-blueink-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase text-blueink-600">Últimas reservas</p>
              <h2 className="mt-1 text-xl font-semibold text-blueink-900">Últimos 5 presentes preenchidos</h2>
            </div>
            <button
              type="button"
              onClick={() => {
                setStatusFilter("reservado");
                setCategoryFilter("todos");
                setQuery("");
              }}
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border border-blueink-200 bg-white px-4 py-2 text-sm font-semibold text-blueink-800 transition hover:bg-blueink-50"
            >
              <Filter size={16} />
              Ver reservados
            </button>
          </div>

          {latestReservations.length > 0 ? (
            <div className="mt-4 grid gap-3 lg:grid-cols-5">
              {latestReservations.map((gift) => (
                <article key={gift.id} className="rounded-lg border border-blueink-100 bg-blueink-50/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 break-words text-sm font-semibold text-blueink-950">{gift.name}</p>
                    <Clock3 className="mt-0.5 shrink-0 text-blueink-500" size={16} />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-graphite">{gift.reservation?.guestName}</p>
                  <p className="mt-1 text-xs text-pewter">
                    {gift.priceLabel ?? formatCurrencyFromCents(gift.priceCents) ?? "Sem valor"}
                  </p>
                  <p className="mt-3 text-xs font-medium text-blueink-700">
                    {gift.reservation
                      ? new Date(gift.reservation.createdAt).toLocaleString("pt-BR", {
                          dateStyle: "short",
                          timeStyle: "short"
                        })
                      : null}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-dashed border-blueink-100 bg-blueink-50/50 p-5 text-sm text-pewter">
              Nenhuma reserva preenchida ainda.
            </div>
          )}
        </section>

        <section className="mb-6 rounded-lg border border-blueink-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase text-blueink-600">Presença no evento</p>
              <h2 className="mt-1 text-xl font-semibold text-blueink-900">Últimas confirmações</h2>
            </div>
            <a
              href="/admin/confirmacoes"
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border border-blueink-200 bg-white px-4 py-2 text-sm font-semibold text-blueink-800 transition hover:bg-blueink-50"
            >
              <UsersRound size={16} />
              Ver todas
            </a>
          </div>

          {latestRsvps.length > 0 ? (
            <div className="mt-4 grid gap-3 lg:grid-cols-5">
              {latestRsvps.map((rsvp) => (
                <article key={rsvp.id} className="rounded-lg border border-blueink-100 bg-blueink-50/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 break-words text-sm font-semibold text-blueink-950">{rsvp.guestName}</p>
                    <UsersRound className="mt-0.5 shrink-0 text-blueink-500" size={16} />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-graphite">
                    {rsvp.guestsCount} {rsvp.guestsCount === 1 ? "pessoa" : "pessoas"}
                  </p>
                  <ul className="mt-2 space-y-1 text-xs text-graphite">
                    {rsvp.attendeeNames.map((name, index) => (
                      <li key={`${rsvp.id}-${index}`} className="break-words">
                        {index + 1}. {name}
                      </li>
                    ))}
                  </ul>
                  {rsvp.guestWhatsapp ? <p className="mt-1 text-xs text-pewter">{rsvp.guestWhatsapp}</p> : null}
                  <p className="mt-3 text-xs font-medium text-blueink-700">{formatDateTime(rsvp.createdAt)}</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-dashed border-blueink-100 bg-blueink-50/50 p-5 text-sm text-pewter">
              Nenhuma presença confirmada ainda.
            </div>
          )}
        </section>

        <div className="mb-6 grid gap-3 rounded-lg border border-blueink-100 bg-white p-4 shadow-sm lg:grid-cols-[1fr_auto_auto_auto]">
          <label className="relative block">
            <span className="sr-only">Pesquisar presentes</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-pewter" size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar presente ou convidado"
              className="focus-ring h-12 w-full rounded-full border border-blueink-100 bg-blueink-50/60 pl-11 pr-4 text-sm text-blueink-900"
            />
          </label>

          <label className="relative block">
            <span className="sr-only">Filtrar por status</span>
            <Filter className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-pewter" size={17} />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              className="focus-ring h-12 min-w-44 rounded-full border border-blueink-100 bg-blueink-50/60 pl-11 pr-9 text-sm font-semibold text-blueink-900"
            >
              <option value="todos">Todos</option>
              <option value="disponivel">Disponíveis</option>
              <option value="reservado">Reservados</option>
            </select>
          </label>

          <label className="relative block">
            <span className="sr-only">Filtrar por categoria</span>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="focus-ring h-12 min-w-48 rounded-full border border-blueink-100 bg-blueink-50/60 px-4 pr-9 text-sm font-semibold text-blueink-900"
            >
              <option value="todos">Categorias</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {getCategoryLabel(category)}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={() => setDraft(emptyDraft())}
            className="focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-full bg-blueink-700 px-5 font-semibold text-white transition hover:bg-blueink-800"
          >
            <Plus size={18} />
            Adicionar
          </button>
        </div>

        <div className="overflow-hidden rounded-lg border border-blueink-100 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-blueink-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-pewter">
              Ordenando {sortedGifts.length} presentes por inclusão
            </p>
            <div className="inline-flex w-full rounded-full bg-blueink-50 p-1 sm:w-auto">
              {[
                ["recentes", "Mais recentes"],
                ["antigos", "Mais antigos"]
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSortOrder(value as SortOrder)}
                  className={`focus-ring inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition sm:flex-none ${
                    sortOrder === value
                      ? "bg-white text-blueink-900 shadow-sm"
                      : "text-blueink-700 hover:bg-white/70"
                  }`}
                >
                  <ArrowUpDown size={15} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="hidden grid-cols-[1.5fr_0.8fr_0.7fr_1fr_0.8fr] gap-4 border-b border-blueink-100 bg-blueink-50 px-5 py-3 text-xs font-semibold uppercase text-blueink-700 md:grid">
            <span>Presente</span>
            <span>Categoria</span>
            <span>Valor</span>
            <span>Reserva</span>
            <span className="text-right">Ações</span>
          </div>

          {sortedGifts.length === 0 ? (
            <div className="p-8 text-center text-pewter">Nenhum item encontrado.</div>
          ) : (
            sortedGifts.map((gift) => (
              <article
                key={gift.id}
                className="grid gap-4 border-b border-blueink-100 px-5 py-5 last:border-b-0 md:grid-cols-[1.5fr_0.8fr_0.7fr_1fr_0.8fr] md:items-center"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="break-words text-base font-semibold text-blueink-950">{gift.name}</h2>
                    <StatusPill status={gift.status} />
                  </div>
                  {gift.description ? <p className="mt-1 text-sm text-pewter">{gift.description}</p> : null}
                  <p className="mt-1 text-xs text-pewter">Incluído em {formatDateTime(gift.createdAt)}</p>
                </div>

                <p className="text-sm font-medium text-graphite">{gift.categoryLabel}</p>
                <p className="text-sm font-semibold text-blueink-900">
                  {gift.priceLabel ?? formatCurrencyFromCents(gift.priceCents) ?? "Sem valor"}
                </p>
                <div className="text-sm text-graphite">
                  {gift.reservation ? (
                    <>
                      <p className="font-semibold">{gift.reservation.guestName}</p>
                      <p className="mt-1 text-xs text-pewter">
                        Reservado em {formatDateTime(gift.reservation.createdAt)}
                      </p>
                    </>
                  ) : (
                    <span className="text-pewter">Sem reserva</span>
                  )}
                </div>

                <div className="flex flex-wrap justify-start gap-2 md:justify-end">
                  <IconButton label="Editar" onClick={() => setDraft(draftFromGift(gift))}>
                    <Pencil size={17} />
                  </IconButton>
                  {gift.reservation ? (
                    <IconButton label="Liberar reserva" onClick={() => cancelReservation(gift)}>
                      <CircleOff size={17} />
                    </IconButton>
                  ) : null}
                  <IconButton label="Remover" tone="danger" onClick={() => deleteGift(gift)}>
                    <Trash2 size={17} />
                  </IconButton>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      {draft ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-blueink-900/45 px-4 py-6 backdrop-blur-sm sm:items-center">
          <form
            onSubmit={saveDraft}
            className="w-full max-w-2xl rounded-lg bg-white p-5 shadow-soft sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase text-blueink-600">
                  {draft.id ? "Editar presente" : "Novo presente"}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-blueink-900">
                  {draft.id ? "Atualizar item" : "Adicionar item"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="focus-ring inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blueink-50 text-blueink-800 transition hover:bg-blueink-100"
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="text-sm font-semibold text-blueink-900">Nome do presente</span>
                <input
                  value={draft.name}
                  onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                  className="focus-ring mt-2 h-12 w-full rounded-lg border border-blueink-100 bg-blueink-50/70 px-4 text-blueink-900"
                  required
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-blueink-900">Categoria</span>
                <select
                  value={draft.category}
                  onChange={(event) => setDraft({ ...draft, category: event.target.value })}
                  className="focus-ring mt-2 h-12 w-full rounded-lg border border-blueink-100 bg-blueink-50/70 px-4 text-blueink-900"
                >
                  <option value="">Sem categoria</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {getCategoryLabel(category)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-blueink-900">Valor</span>
                <input
                  value={draft.price}
                  onChange={(event) => setDraft({ ...draft, price: event.target.value })}
                  className="focus-ring mt-2 h-12 w-full rounded-lg border border-blueink-100 bg-blueink-50/70 px-4 text-blueink-900"
                  placeholder="Ex.: 120,00"
                  inputMode="decimal"
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="text-sm font-semibold text-blueink-900">Descrição</span>
                <textarea
                  value={draft.description}
                  onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                  className="focus-ring mt-2 min-h-28 w-full resize-y rounded-lg border border-blueink-100 bg-blueink-50/70 px-4 py-3 text-blueink-900"
                />
              </label>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="focus-ring inline-flex items-center justify-center rounded-full border border-blueink-200 px-5 py-3 font-semibold text-blueink-800 transition hover:bg-blueink-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending || draft.name.trim().length < 2}
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

function getGiftInclusionTimestamp(gift: AdminGift) {
  return new Date(gift.reservation?.createdAt ?? gift.createdAt).getTime();
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  });
}

function AdminDashboard({ gifts, rsvps }: { gifts: AdminGift[]; rsvps: AdminRsvp[] }) {
  const reservedGifts = gifts.filter((gift) => gift.reservation);
  const received = reservedGifts.filter((gift) => gift.reservation?.paidAt);
  const pending = reservedGifts.length - received.length;
  const receivedTotalCents = received.reduce((total, gift) => total + (gift.priceCents ?? 0), 0);
  const pendingTotalCents = reservedGifts.reduce(
    (total, gift) => total + (gift.reservation?.paidAt ? 0 : gift.priceCents ?? 0),
    0
  );
  const totalPaymentCents = receivedTotalCents + pendingTotalCents;
  const receivedPercent = totalPaymentCents > 0 ? Math.round((receivedTotalCents / totalPaymentCents) * 100) : 0;
  const pendingPercent = totalPaymentCents > 0 ? 100 - receivedPercent : 0;
  const series = buildReservationSeries(gifts);
  const maxReservations = Math.max(1, ...series.map((day) => day.count));
  const confirmedGuests = rsvps.reduce((total, rsvp) => total + rsvp.guestsCount, 0);

  return (
    <section className="mb-6 grid gap-4 lg:grid-cols-[0.95fr_1.15fr_0.9fr]">
      <div className="rounded-lg border border-blueink-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase text-blueink-600">Pagamentos</p>
            <h2 className="mt-1 text-xl font-semibold text-blueink-900">Recebidos x débitos</h2>
          </div>
          <BarChart3 className="text-blueink-500" size={22} />
        </div>
        <div className="mt-5 overflow-hidden rounded-full bg-blueink-50">
          <div className="flex h-4">
            <span className="bg-emerald-500" style={{ width: `${receivedPercent}%` }} />
            <span className="bg-rose-400" style={{ width: `${pendingPercent}%` }} />
          </div>
        </div>
        <div className="mt-5 grid gap-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-graphite">Valor recebido</span>
            <strong className="text-emerald-700">{formatCurrencyFromCents(receivedTotalCents) ?? "R$ 0,00"}</strong>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-graphite">Valor em débito</span>
            <strong className="text-rose-600">{formatCurrencyFromCents(pendingTotalCents) ?? "R$ 0,00"}</strong>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-graphite">Itens pendentes</span>
            <strong className="text-blueink-900">{pending}</strong>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-blueink-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase text-blueink-600">Reservas</p>
            <h2 className="mt-1 text-xl font-semibold text-blueink-900">Evolução dos últimos 7 dias</h2>
          </div>
          <Clock3 className="text-blueink-500" size={22} />
        </div>
        <div className="mt-6 flex h-44 items-end gap-2">
          {series.map((day) => (
            <div key={day.key} className="flex h-full flex-1 flex-col justify-end gap-2">
              <div className="flex min-h-24 items-end rounded-md bg-blueink-50 px-1">
                <div
                  className="w-full rounded-t-md bg-blueink-600"
                  style={{ height: `${Math.max(6, (day.count / maxReservations) * 100)}%` }}
                  title={`${day.count} reservas`}
                />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-blueink-900">{day.count}</p>
                <p className="text-[11px] font-medium text-pewter">{day.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-blueink-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase text-blueink-600">Presença</p>
            <h2 className="mt-1 text-xl font-semibold text-blueink-900">Confirmações</h2>
          </div>
          <UsersRound className="text-blueink-500" size={22} />
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-blueink-50 p-4">
            <p className="text-3xl font-semibold text-blueink-900">{rsvps.length}</p>
            <p className="mt-1 text-sm text-pewter">respostas</p>
          </div>
          <div className="rounded-lg bg-blueink-50 p-4">
            <p className="text-3xl font-semibold text-emerald-700">{confirmedGuests}</p>
            <p className="mt-1 text-sm text-pewter">pessoas</p>
          </div>
        </div>
        <p className="mt-5 text-sm leading-6 text-graphite">
          O PDF exporta uma lista numerada de convidados para controle de entrada no evento.
        </p>
      </div>
    </section>
  );
}

function buildReservationSeries(gifts: AdminGift[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));

    return {
      key: getDateKey(date),
      label: date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit"
      }),
      count: 0
    };
  });

  const byDay = new Map(days.map((day) => [day.key, day]));

  gifts.forEach((gift) => {
    if (!gift.reservation) {
      return;
    }

    const date = new Date(gift.reservation.createdAt);
    date.setHours(0, 0, 0, 0);
    const day = byDay.get(getDateKey(date));

    if (day) {
      day.count += 1;
    }
  });

  return days;
}

function getDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function Metric({
  label,
  value,
  tone = "blue"
}: {
  label: string;
  value: number | string;
  tone?: "blue" | "green" | "slate";
}) {
  const toneClass =
    tone === "green" ? "text-emerald-700" : tone === "slate" ? "text-slate-500" : "text-blueink-900";

  return (
    <div className="rounded-lg border border-blueink-100 bg-white p-5 shadow-sm">
      <p className={`text-3xl font-semibold ${toneClass}`}>{value}</p>
      <p className="mt-1 text-sm font-medium text-pewter">{label}</p>
    </div>
  );
}

function StatusPill({ status }: { status: GiftStatusLabel }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        status === "disponivel" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
      }`}
    >
      {status === "disponivel" ? "Disponível" : "Reservado"}
    </span>
  );
}

function IconButton({
  label,
  tone = "default",
  onClick,
  children
}: {
  label: string;
  tone?: "default" | "danger";
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`focus-ring inline-flex h-10 w-10 items-center justify-center rounded-full transition ${
        tone === "danger"
          ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
          : "bg-blueink-50 text-blueink-800 hover:bg-blueink-100"
      }`}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}
