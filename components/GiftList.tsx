"use client";

import { ArrowUpDown, CheckCircle2, Gift, Loader2, Search, X } from "lucide-react";
import { useMemo, useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { eventDetails } from "@/lib/event";
import { centsFromDecimalInput, getCategoryLabel, normalizeText } from "@/lib/format";
import type { ApiResult, GiftStatusLabel, PublicGift } from "@/lib/types";

type GiftListProps = {
  gifts: PublicGift[];
  loadError: string | null;
  reservedTotal: string | null;
};

type FilterValue = "todos" | GiftStatusLabel;
type PriceSort = "asc" | "desc";

export function GiftList({ gifts, loadError }: GiftListProps) {
  const router = useRouter();
  const [items, setItems] = useState(gifts);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterValue>("todos");
  const [categoryFilter, setCategoryFilter] = useState("todos");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [availablePriceSort, setAvailablePriceSort] = useState<PriceSort>("desc");
  const [selectedGift, setSelectedGift] = useState<PublicGift | null>(null);
  const [guestName, setGuestName] = useState("");
  const [feedback, setFeedback] = useState<ApiResult | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setItems(gifts);
  }, [gifts]);

  const categories = useMemo(() => {
    const values = new Set(items.map((gift) => gift.category ?? ""));
    return Array.from(values).sort((first, second) =>
      getCategoryLabel(first).localeCompare(getCategoryLabel(second), "pt-BR")
    );
  }, [items]);

  const filtered = useMemo(() => {
    const normalizedQuery = normalizeText(query);
    const minPriceCents = centsFromDecimalInput(minPrice);
    const maxPriceCents = centsFromDecimalInput(maxPrice);

    return items.filter((gift) => {
      const matchesStatus = statusFilter === "todos" || gift.status === statusFilter;
      const matchesCategory = categoryFilter === "todos" || (gift.category ?? "") === categoryFilter;
      const matchesMinPrice =
        minPriceCents === null || (typeof gift.priceCents === "number" && gift.priceCents >= minPriceCents);
      const matchesMaxPrice =
        maxPriceCents === null || (typeof gift.priceCents === "number" && gift.priceCents <= maxPriceCents);
      const matchesQuery =
        normalizedQuery.length === 0 ||
        normalizeText(`${gift.name} ${gift.categoryLabel}`).includes(normalizedQuery);

      return matchesStatus && matchesCategory && matchesMinPrice && matchesMaxPrice && matchesQuery;
    });
  }, [categoryFilter, items, maxPrice, minPrice, query, statusFilter]);

  const availableGifts = useMemo(() => {
    return filtered
      .filter((gift) => gift.status === "disponivel")
      .sort((first, second) => {
        const firstHasPrice = typeof first.priceCents === "number";
        const secondHasPrice = typeof second.priceCents === "number";

        if (!firstHasPrice && !secondHasPrice) {
          return first.name.localeCompare(second.name, "pt-BR");
        }

        if (!firstHasPrice) {
          return 1;
        }

        if (!secondHasPrice) {
          return -1;
        }

        return availablePriceSort === "asc"
          ? first.priceCents! - second.priceCents!
          : second.priceCents! - first.priceCents!;
      });
  }, [availablePriceSort, filtered]);
  const reservedGifts = filtered.filter((gift) => gift.status === "reservado");

  function closeModal() {
    setSelectedGift(null);
    setGuestName("");
  }

  function handleReserve() {
    if (!selectedGift) {
      return;
    }

    setFeedback(null);

    startTransition(async () => {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          giftId: selectedGift.id,
          guestName
        })
      });

      const result = (await response.json()) as ApiResult;
      setFeedback(result);

      if (result.ok) {
        const thankYouParams = new URLSearchParams({
          tipo: "presente",
          presente: selectedGift.name,
          valor: selectedGift.priceLabel ?? "Valor a combinar"
        });

        setItems((current) =>
          current.map((gift) =>
            gift.id === selectedGift.id ? { ...gift, status: "reservado" } : gift
          )
        );
        closeModal();
        router.push(`/obrigado?${thankYouParams.toString()}`);
      }
    });
  }

  if (loadError) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
        {loadError}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {feedback ? (
        <div
          className={`rounded-lg border p-4 text-sm font-medium ${
            feedback.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
          role="status"
        >
          {feedback.message}
        </div>
      ) : null}

      <div className="grid gap-3 rounded-lg border border-blueink-100 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
        <label className="relative block">
          <span className="sr-only">Buscar presentes</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-pewter" size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por presente ou categoria"
            className="focus-ring h-12 w-full rounded-full border border-blueink-100 bg-blueink-50/60 pl-11 pr-4 text-sm text-blueink-900 placeholder:text-pewter"
          />
        </label>

        <div className="grid grid-cols-3 gap-2 rounded-2xl bg-blueink-50 p-1 sm:rounded-full">
          {[
            ["todos", "Todos"],
            ["disponivel", "Livres"],
            ["reservado", "Reservados"]
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatusFilter(value as FilterValue)}
              className={`focus-ring min-h-10 rounded-full px-2 text-sm font-semibold transition sm:px-4 ${
                statusFilter === value
                  ? "bg-white text-blueink-800 shadow-sm"
                  : "text-pewter hover:text-blueink-800"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setAvailablePriceSort((current) => (current === "asc" ? "desc" : "asc"))}
          className="focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-full border border-blueink-200 bg-white px-4 text-sm font-semibold text-blueink-800 transition hover:bg-blueink-50"
        >
          <ArrowUpDown size={17} />
          {availablePriceSort === "asc" ? "Menor preço disponível" : "Maior preço disponível"}
        </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_0.75fr_0.75fr_auto]">
          <label className="block">
            <span className="sr-only">Filtrar por categoria</span>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="focus-ring h-12 w-full rounded-full border border-blueink-100 bg-blueink-50/60 px-4 pr-9 text-sm font-semibold text-blueink-900"
            >
              <option value="todos">Todas as categorias</option>
              {categories.map((category) => (
                <option key={category || "sem-categoria"} value={category}>
                  {getCategoryLabel(category)}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="sr-only">Preço mínimo</span>
            <input
              value={minPrice}
              onChange={(event) => setMinPrice(event.target.value)}
              className="focus-ring h-12 w-full rounded-full border border-blueink-100 bg-blueink-50/60 px-4 text-sm text-blueink-900 placeholder:text-pewter"
              placeholder="Preço mínimo"
              inputMode="decimal"
            />
          </label>

          <label className="block">
            <span className="sr-only">Preço máximo</span>
            <input
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
              className="focus-ring h-12 w-full rounded-full border border-blueink-100 bg-blueink-50/60 px-4 text-sm text-blueink-900 placeholder:text-pewter"
              placeholder="Preço máximo"
              inputMode="decimal"
            />
          </label>

          <button
            type="button"
            onClick={() => {
              setQuery("");
              setStatusFilter("todos");
              setCategoryFilter("todos");
              setMinPrice("");
              setMaxPrice("");
            }}
            className="focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-full border border-blueink-200 px-4 text-sm font-semibold text-blueink-800 transition hover:bg-blueink-50"
          >
            <X size={16} />
            Limpar
          </button>
        </div>
      </div>

      {availableGifts.length === 0 && reservedGifts.length === 0 ? (
        <div className="rounded-lg border border-blueink-100 bg-white p-8 text-center text-pewter">
          Nenhum presente encontrado para esse filtro.
        </div>
      ) : null}

      {availableGifts.length > 0 ? (
        <GiftSection
          title="Presentes disponíveis"
          subtitle="Itens prontos para reserva"
          gifts={availableGifts}
          onReserve={setSelectedGift}
        />
      ) : null}

      {reservedGifts.length > 0 ? (
        <GiftSection
          title="Presentes reservados"
          subtitle="Itens que já foram escolhidos"
          gifts={reservedGifts}
          onReserve={setSelectedGift}
        />
      ) : null}

      {selectedGift ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-blueink-900/45 px-4 py-6 backdrop-blur-sm sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reservation-title"
            className="w-full max-w-lg rounded-lg bg-white p-5 shadow-soft sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase text-blueink-600">Reservar presente</p>
                <h3 id="reservation-title" className="mt-2 text-2xl font-semibold text-blueink-900">
                  {selectedGift.name}
                </h3>
                <p className="mt-2 text-sm text-pewter">
                  {selectedGift.priceLabel ?? "Valor a combinar"} · {selectedGift.categoryLabel}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="focus-ring inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blueink-50 text-blueink-800 transition hover:bg-blueink-100"
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <label className="mt-6 block">
              <span className="text-sm font-semibold text-blueink-900">Nome e sobrenome</span>
              <input
                value={guestName}
                onChange={(event) => setGuestName(event.target.value)}
                className="focus-ring mt-2 h-12 w-full rounded-lg border border-blueink-100 bg-blueink-50/70 px-4 text-blueink-900 placeholder:text-pewter"
                placeholder="Seu nome"
                autoFocus
              />
            </label>

            <div className="mt-5 rounded-lg bg-blueink-50 p-4 text-sm leading-6 text-graphite">
              <p>
                Após reservar, use a chave Pix <span className="font-semibold">{eventDetails.payment.pixKey}</span> e envie
                o comprovante para Ryan e Juliana.
              </p>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={closeModal}
                className="focus-ring inline-flex items-center justify-center rounded-full border border-blueink-200 px-5 py-3 font-semibold text-blueink-800 transition hover:bg-blueink-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleReserve}
                disabled={isPending || guestName.trim().length < 3}
                className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-blueink-700 px-5 py-3 font-semibold text-white transition hover:bg-blueink-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isPending ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                Confirmar reserva
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function GiftSection({
  title,
  subtitle,
  gifts,
  onReserve
}: {
  title: string;
  subtitle: string;
  gifts: PublicGift[];
  onReserve: (gift: PublicGift) => void;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-blueink-900">{title}</h3>
          <p className="mt-1 text-sm text-pewter">{subtitle}</p>
        </div>
        <p className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-blueink-800 shadow-sm">
          {gifts.length}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {gifts.map((gift) => (
          <article
            key={gift.id}
            className={`rounded-lg border bg-white p-5 shadow-sm transition ${
              gift.status === "reservado"
                ? "border-slate-200 opacity-75"
                : "border-blueink-100 hover:-translate-y-0.5 hover:shadow-soft"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase text-blueink-600">{gift.categoryLabel}</p>
                <h4 className="mt-2 text-lg font-semibold leading-6 text-blueink-950">{gift.name}</h4>
              </div>
              <span
                className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold ${
                  gift.status === "disponivel"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {gift.status === "disponivel" ? "Livre" : "Reservado"}
              </span>
            </div>

            <div className="mt-5 flex items-center justify-between gap-4">
              <p className="text-xl font-semibold text-blueink-900">{gift.priceLabel ?? "Valor a combinar"}</p>
              <button
                type="button"
                onClick={() => onReserve(gift)}
                disabled={gift.status === "reservado"}
                className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-blueink-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blueink-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
              >
                <Gift size={16} />
                Reservar
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
