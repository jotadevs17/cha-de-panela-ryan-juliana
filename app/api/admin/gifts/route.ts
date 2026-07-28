import { GiftStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getAdminGifts } from "@/lib/data";
import { formatCurrencyFromCents } from "@/lib/format";
import { normalizeGiftName } from "@/lib/giftNames";
import { isAdminRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function cleanString(value: unknown) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed.length > 0 ? trimmed : null;
}

function cleanCents(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const cents = Number(value);
  return Number.isInteger(cents) && cents >= 0 ? cents : null;
}

function unauthorized() {
  return NextResponse.json(
    { ok: false, message: "Acesso administrativo expirado. Entre novamente." },
    { status: 401 }
  );
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return unauthorized();
  }

  try {
    const gifts = await getAdminGifts();
    return NextResponse.json({ ok: true, message: "Presentes carregados.", data: gifts });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Não foi possível carregar os presentes agora." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return unauthorized();
  }

  const body = await request.json().catch(() => null);
  const name = cleanString(body?.name);
  const category = cleanString(body?.category);
  const description = cleanString(body?.description);
  const priceCents = cleanCents(body?.priceCents);

  if (!name || name.length < 2) {
    return NextResponse.json(
      { ok: false, message: "Informe um nome válido para o presente." },
      { status: 400 }
    );
  }

  try {
    const gift = await prisma.gift.create({
      data: {
        name: normalizeGiftName(name),
        category,
        description,
        priceCents,
        priceLabel: formatCurrencyFromCents(priceCents),
        status: GiftStatus.DISPONIVEL
      }
    });

    return NextResponse.json({
      ok: true,
      message: "Presente adicionado.",
      data: { id: gift.id }
    });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Não foi possível adicionar o presente agora." },
      { status: 500 }
    );
  }
}
