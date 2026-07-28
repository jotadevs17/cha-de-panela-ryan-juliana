export type GiftStatusLabel = "disponivel" | "reservado";

export type PublicGift = {
  id: number;
  name: string;
  category: string | null;
  categoryLabel: string;
  description: string | null;
  priceLabel: string | null;
  priceCents: number | null;
  status: GiftStatusLabel;
};

export type AdminGift = PublicGift & {
  sheetRow: number | null;
  createdAt: string;
  updatedAt: string;
  reservation: {
    id: number;
    guestName: string;
    guestWhatsapp: string | null;
    message: string | null;
    paidAt: string | null;
    paymentNote: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type AdminRsvp = {
  id: number;
  guestName: string;
  guestWhatsapp: string | null;
  attendeeNames: string[];
  guestsCount: number;
  message: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GiftSummary = {
  total: number;
  available: number;
  reserved: number;
  availableTotalCents: number;
  reservedTotalCents: number;
};

export type ApiResult<T = undefined> = {
  ok: boolean;
  message: string;
  data?: T;
};
