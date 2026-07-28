import { GiftStatus, Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
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

function unauthorized() {
  return NextResponse.json(
    { ok: false, message: "Acesso administrativo expirado. Entre novamente." },
    { status: 401 }
  );
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
    await prisma.$transaction(async (tx) => {
      await tx.reservation.deleteMany({
        where: {
          giftId: id
        }
      });

      await tx.gift.update({
        where: {
          id
        },
        data: {
          status: GiftStatus.DISPONIVEL
        }
      });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json(
        { ok: false, message: "Esse presente não foi encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { ok: false, message: "Não foi possível liberar a reserva agora." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, message: "Reserva cancelada e presente liberado." });
}
