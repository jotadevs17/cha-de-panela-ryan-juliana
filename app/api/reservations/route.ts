import { GiftStatus, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const giftId = Number(body?.giftId);
  const guestName = cleanString(body?.guestName);
  const guestWhatsapp = cleanString(body?.guestWhatsapp) || null;
  const message = cleanString(body?.message) || null;

  if (!Number.isInteger(giftId) || giftId <= 0) {
    return NextResponse.json(
      { ok: false, message: "Não foi possível identificar o presente escolhido." },
      { status: 400 }
    );
  }

  if (guestName.length < 3) {
    return NextResponse.json(
      { ok: false, message: "Informe seu nome e sobrenome para confirmar a reserva." },
      { status: 400 }
    );
  }

  try {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.gift.updateMany({
        where: {
          id: giftId,
          status: GiftStatus.DISPONIVEL
        },
        data: {
          status: GiftStatus.RESERVADO
        }
      });

      if (updated.count !== 1) {
        throw new Error("GIFT_ALREADY_RESERVED");
      }

      await tx.reservation.create({
        data: {
          giftId,
          guestName,
          guestWhatsapp,
          message
        }
      });
    });

    return NextResponse.json({
      ok: true,
      message: "Presente reservado com sucesso. Obrigado por fazer parte desse momento!"
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { ok: false, message: "Esse presente acabou de ser reservado por outra pessoa." },
        { status: 409 }
      );
    }

    if (error instanceof Error && error.message === "GIFT_ALREADY_RESERVED") {
      return NextResponse.json(
        { ok: false, message: "Esse presente já está reservado. Escolha outro item da lista." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { ok: false, message: "Não foi possível concluir a reserva agora. Tente novamente em instantes." },
      { status: 500 }
    );
  }
}
