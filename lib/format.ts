export function formatCurrencyFromCents(cents: number | null | undefined) {
  if (typeof cents !== "number") {
    return null;
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(cents / 100);
}

export function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function getCategoryLabel(category: string | null | undefined) {
  const labels: Record<string, string> = {
    Eletroportateis: "Eletroportáteis",
    "Cama e banho": "Cama e banho",
    Organizacao: "Organização",
    "Mesa posta": "Mesa posta",
    Cozinha: "Cozinha",
    Casa: "Casa"
  };

  return category ? labels[category] ?? category : "Sem categoria";
}

export function centsFromDecimalInput(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const normalized = String(value).replace(/\./g, "").replace(",", ".");
  const parsed = Number.parseFloat(normalized);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return Math.round(parsed * 100);
}
