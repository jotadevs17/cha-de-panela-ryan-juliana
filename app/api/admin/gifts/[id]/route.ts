import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { formatCurrencyFromCents } from "@/lib/format";
import { normalizeGiftName } from "@/lib/giftNames";
import { isAdminRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: {
    id: string;
  };
};

function giftIdFromParams(params: RouteContext["params"]) {
  const id = Number(params.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

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

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  if (!isAdminRequest(request)) {
    return unauthorized();
  }

  const id = giftIdFromParams(params);

  if (!id) {
    return NextResponse.json(
      { ok: false, message: "Presente inválido." },
      { status: 400 }
    );
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
    await prisma.gift.update({
      where: { id },
      data: {
        name: normalizeGiftName(name),
        category,
        description,
        priceCents,
        priceLabel: formatCurrencyFromCents(priceCents)
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json(
        { ok: false, message: "Esse presente não foi encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { ok: false, message: "Não foi possível atualizar o presente agora." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, message: "Presente atualizado." });
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  if (!isAdminRequest(request)) {
    return unauthorized();
  }

  const id = giftIdFromParams(params);

  if (!id) {
    return NextResponse.json(
      { ok: false, message: "Presente inválido." },
      { status: 400 }
    );
  }

  try {
    await prisma.gift.delete({
      where: { id }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json(
        { ok: false, message: "Esse presente não foi encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { ok: false, message: "Não foi possível remover o presente agora." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, message: "Presente removido." });
}
