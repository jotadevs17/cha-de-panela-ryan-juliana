"use client";

import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock3,
  Download,
  Gift,
  Loader2,
  LogOut,
  MessageCircle,
  Search,
  StickyNote,
  Trash2,
  UsersRound,
  WalletCards
} from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { normalizeText } from "@/lib/format";
import type { AdminRsvp, ApiResult } from "@/lib/types";

type AdminConfirmationsPanelProps = {
  rsvps: AdminRsvp[];
  loadError: string | null;
};

type SortOrder = "recentes" | "antigos";

const pageSize = 10;

export function AdminConfirmationsPanel({ rsvps, loadError }: AdminConfirmationsPanelProps) {
  const router = useRouter();
  const [items, setItems] = useState(rsvps);
  const [query, setQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("recentes");
  const [currentPage, setCurrentPage] = useState(1);
  const [feedback, setFeedback] = useState<ApiResult<unknown> | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setItems(rsvps);
  }, [rsvps]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, sortOrder]);

  const summary = useMemo(
    () =>
      items.reduce(
        (acc, rsvp) => {
          acc.confirmations += 1;
          acc.guests += rsvp.guestsCount;

          if (rsvp.guestWhatsapp) {
            acc.withWhatsapp += 1;
          }

          if (rsvp.message) {
            acc.withMessage += 1;
          }

          return acc;
        },
        {
          confirmations: 0,
          guests: 0,
          withWhatsapp: 0,
          withMessage: 0
        }
      ),
    [items]
  );

  const filtered = useMemo(() => {
    const normalizedQuery = normalizeText(query);

    return items.filter((rsvp) => {
      if (normalizedQuery.length === 0) {
        return true;
      }

      const searchableText = [
        rsvp.guestName,
        rsvp.guestWhatsapp,
        rsvp.message,
        ...rsvp.attendeeNames
      ]
        .filter(Boolean)
        .join(" ");

      return normalizeText(searchableText).includes(normalizedQuery);
    });
  }, [items, query]);

  const sortedRsvps = useMemo(
    () =>
      [...filtered].sort((a, b) => {
        const firstDate = new Date(a.createdAt).getTime();
        const secondDate = new Date(b.createdAt).getTime();

        if (firstDate === secondDate) {
          return sortOrder === "recentes" ? b.id - a.id : a.id - b.id;
        }

        return sortOrder === "recentes" ? secondDate - firstDate : firstDate - secondDate;
      }),
    [filtered, sortOrder]
  );

  const pageCount = Math.max(1, Math.ceil(sortedRsvps.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, pageCount);
  const pageStart = sortedRsvps.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const pageEnd = Math.min(safeCurrentPage * pageSize, sortedRsvps.length);
  const paginatedRsvps = sortedRsvps.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);

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

  function deleteRsvp(rsvp: AdminRsvp) {
    if (!window.confirm(`Excluir a confirmação de "${rsvp.guestName}"?`)) {
      return;
    }

    setFeedback(null);
    startTransition(async () => {
      const response = await fetch(`/api/admin/rsvps/${rsvp.id}`, { method: "DELETE" });
      const result = (await response.json()) as ApiResult;
      setFeedback(result);

      if (result.ok) {
        setItems((current) => current.filter((item) => item.id !== rsvp.id));
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
            <h1 className="mt-2 text-3xl font-semibold text-blueink-900">Confirmações</h1>
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
              href="/admin/recebimentos"
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border border-blueink-200 bg-white px-4 py-2 text-sm font-semibold text-blueink-800 transition hover:bg-blueink-50"
            >
              <WalletCards size={17} />
              Recebimentos
            </a>
            <a
              href="/api/admin/export"
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border border-blueink-200 bg-white px-4 py-2 text-sm font-semibold text-blueink-800 transition hover:bg-blueink-50"
            >
              <Download size={17} />
              Lista de convidados
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
              disabled={isPending}
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-blueink-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blueink-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isPending ? <Loader2 className="animate-spin" size={17} /> : <LogOut size={17} />}
              Sair
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
        {loadError ? (
          <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
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

        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Respostas" value={summary.confirmations} />
          <Metric label="Pessoas confirmadas" value={summary.guests} tone="green" />
          <Metric label="Com WhatsApp" value={summary.withWhatsapp} />
          <Metric label="Com mensagem" value={summary.withMessage} tone="slate" />
        </div>

        <div className="mb-6 grid gap-3 rounded-lg border border-blueink-100 bg-white p-4 shadow-sm lg:grid-cols-[1fr_auto]">
          <label className="relative block">
            <span className="sr-only">Pesquisar confirmações</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-pewter" size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar responsável, pessoa confirmada, WhatsApp ou mensagem"
              className="focus-ring h-12 w-full rounded-full border border-blueink-100 bg-blueink-50/60 pl-11 pr-4 text-sm text-blueink-900"
            />
          </label>

          <label className="relative block">
            <span className="sr-only">Ordenar confirmações</span>
            <ArrowUpDown className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-pewter" size={17} />
            <select
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value as SortOrder)}
              className="focus-ring h-12 w-full rounded-full border border-blueink-100 bg-blueink-50/60 pl-11 pr-9 text-sm font-semibold text-blueink-900 sm:min-w-52"
            >
              <option value="recentes">Mais recentes</option>
              <option value="antigos">Mais antigos</option>
            </select>
          </label>
        </div>

        <div className="overflow-hidden rounded-lg border border-blueink-100 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-blueink-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-pewter">
              Exibindo {pageStart}-{pageEnd} de {sortedRsvps.length} confirmações
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

          <div className="hidden grid-cols-[1fr_1fr_0.7fr_1fr_auto] gap-4 border-b border-blueink-100 bg-blueink-50 px-5 py-3 text-xs font-semibold uppercase text-blueink-700 md:grid">
            <span>Responsável</span>
            <span>Pessoas confirmadas</span>
            <span>Contato</span>
            <span>Mensagem</span>
            <span className="text-right">Ações</span>
          </div>

          {sortedRsvps.length === 0 ? (
            <div className="p-8 text-center text-pewter">Nenhuma confirmação encontrada.</div>
          ) : (
            paginatedRsvps.map((rsvp) => (
              <article
                key={rsvp.id}
                className="grid gap-4 border-b border-blueink-100 px-5 py-5 last:border-b-0 md:grid-cols-[1fr_1fr_0.7fr_1fr_auto] md:items-start"
              >
                <div>
                  <p className="break-words font-semibold text-blueink-950">{rsvp.guestName}</p>
                  <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-pewter">
                    <Clock3 size={13} />
                    {formatDateTime(rsvp.createdAt)}
                  </p>
                  <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-blueink-50 px-2.5 py-1 text-xs font-semibold text-blueink-800">
                    <UsersRound size={13} />
                    {rsvp.guestsCount} {rsvp.guestsCount === 1 ? "pessoa" : "pessoas"}
                  </p>
                </div>

                <div>
                  <ul className="space-y-1.5 text-sm text-graphite">
                    {rsvp.attendeeNames.map((name, index) => (
                      <li key={`${rsvp.id}-${name}-${index}`} className="break-words">
                        <span className="font-semibold text-blueink-700">{index + 1}.</span> {name}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  {rsvp.guestWhatsapp ? (
                    <a
                      href={getWhatsappHref(rsvp.guestWhatsapp)}
                      target="_blank"
                      rel="noreferrer"
                      className="focus-ring inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                    >
                      <MessageCircle size={14} />
                      {formatWhatsapp(rsvp.guestWhatsapp)}
                    </a>
                  ) : (
                    <span className="text-sm text-pewter">Sem WhatsApp</span>
                  )}
                </div>

                <div>
                  {rsvp.message ? (
                    <p className="break-words rounded-lg bg-blueink-50/70 p-3 text-sm leading-6 text-graphite">
                      {rsvp.message}
                    </p>
                  ) : (
                    <p className="inline-flex items-center gap-1.5 text-sm text-pewter">
                      <StickyNote size={14} />
                      Sem mensagem
                    </p>
                  )}
                </div>

                <div className="flex justify-start md:justify-end">
                  <button
                    type="button"
                    onClick={() => deleteRsvp(rsvp)}
                    disabled={isPending}
                    className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                  >
                    {isPending ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                    Excluir
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
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

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  });
}

function formatWhatsapp(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  return value;
}

function getWhatsappHref(value: string) {
  const digits = value.replace(/\D/g, "");
  const phone = digits.startsWith("55") ? digits : `55${digits}`;

  return `https://wa.me/${phone}`;
}
