import { GiftStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatCurrencyFromCents, getCategoryLabel } from "@/lib/format";
import type { AdminGift, AdminRsvp, GiftStatusLabel, GiftSummary, PublicGift } from "@/lib/types";

function toStatusLabel(status: GiftStatus): GiftStatusLabel {
  return status === GiftStatus.RESERVADO ? "reservado" : "disponivel";
}

export function toPriceLabel(cents: number | null | undefined) {
  return formatCurrencyFromCents(cents);
}

export async function getPublicGifts(): Promise<PublicGift[]> {
  const gifts = await prisma.gift.findMany({
    orderBy: [{ id: "asc" }]
  });

  return gifts.map((gift) => ({
    id: gift.id,
    name: gift.name,
    category: gift.category,
    categoryLabel: getCategoryLabel(gift.category),
    description: gift.description,
    priceLabel: gift.priceLabel ?? toPriceLabel(gift.priceCents),
    priceCents: gift.priceCents,
    status: toStatusLabel(gift.status)
  }));
}

export async function getAdminGifts(): Promise<AdminGift[]> {
  const gifts = await prisma.gift.findMany({
    include: {
      reservation: true
    },
    orderBy: [{ id: "asc" }]
  });

  return gifts.map((gift) => ({
    id: gift.id,
    name: gift.name,
    category: gift.category,
    categoryLabel: getCategoryLabel(gift.category),
    description: gift.description,
    priceLabel: gift.priceLabel ?? toPriceLabel(gift.priceCents),
    priceCents: gift.priceCents,
    sheetRow: gift.sheetRow,
    status: toStatusLabel(gift.status),
    createdAt: gift.createdAt.toISOString(),
    updatedAt: gift.updatedAt.toISOString(),
    reservation: gift.reservation
      ? {
          id: gift.reservation.id,
          guestName: gift.reservation.guestName,
          guestWhatsapp: gift.reservation.guestWhatsapp,
          message: gift.reservation.message,
          paidAt: gift.reservation.paidAt?.toISOString() ?? null,
          paymentNote: gift.reservation.paymentNote,
          createdAt: gift.reservation.createdAt.toISOString(),
          updatedAt: gift.reservation.updatedAt.toISOString()
        }
      : null
  }));
}

export async function getAdminRsvps(): Promise<AdminRsvp[]> {
  const confirmations = await prisma.attendanceConfirmation.findMany({
    orderBy: [{ createdAt: "desc" }]
  });

  return confirmations.map((confirmation) => ({
    id: confirmation.id,
    guestName: confirmation.guestName,
    guestWhatsapp: confirmation.guestWhatsapp,
    attendeeNames: confirmation.attendeeNames.length > 0 ? confirmation.attendeeNames : [confirmation.guestName],
    guestsCount: confirmation.guestsCount,
    message: confirmation.message,
    createdAt: confirmation.createdAt.toISOString(),
    updatedAt: confirmation.updatedAt.toISOString()
  }));
}

export function getGiftSummary(gifts: PublicGift[]): GiftSummary {
  return gifts.reduce<GiftSummary>(
    (summary, gift) => {
      summary.total += 1;

      if (gift.status === "reservado") {
        summary.reserved += 1;
        summary.reservedTotalCents += gift.priceCents ?? 0;
      } else {
        summary.available += 1;
        summary.availableTotalCents += gift.priceCents ?? 0;
      }

      return summary;
    },
    {
      total: 0,
      available: 0,
      reserved: 0,
      availableTotalCents: 0,
      reservedTotalCents: 0
    }
  );
}
