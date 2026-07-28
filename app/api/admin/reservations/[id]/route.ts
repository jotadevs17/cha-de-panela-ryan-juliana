import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: {
    id: string;
  };
};

function reservationIdFromParams(params: RouteContext["params"]) {
  const id = Number(params.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function cleanString(value: unknown) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed.length > 0 ? trimmed : null;
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

  const id = reservationIdFromParams(params);

  if (!id) {
    return NextResponse.json(
      { ok: false, message: "Reserva inválida." },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => null);
  const paid = typeof body?.paid === "boolean" ? body.paid : null;
  const hasPaymentNote = body ? Object.prototype.hasOwnProperty.call(body, "paymentNote") : false;

  if (paid === null) {
    return NextResponse.json(
      { ok: false, message: "Informe se a reserva foi recebida ou está em débito." },
      { status: 400 }
    );
  }

  try {
    const current = await prisma.reservation.findUnique({
      where: { id },
      select: {
        paidAt: true
      }
    });

    if (!current) {
      return NextResponse.json(
        { ok: false, message: "Essa reserva não foi encontrada." },
        { status: 404 }
      );
    }

    const reservation = await prisma.reservation.update({
      where: { id },
      data: {
        paidAt: paid ? current.paidAt ?? new Date() : null,
        ...(hasPaymentNote ? { paymentNote: cleanString(body?.paymentNote) } : {})
      },
      select: {
        id: true,
        paidAt: true,
        paymentNote: true,
        updatedAt: true
      }
    });

    return NextResponse.json({
      ok: true,
      message: paid ? "Presente marcado como recebido." : "Presente marcado como em débito.",
      data: {
        reservation: {
          id: reservation.id,
          paidAt: reservation.paidAt?.toISOString() ?? null,
          paymentNote: reservation.paymentNote,
          updatedAt: reservation.updatedAt.toISOString()
        }
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json(
        { ok: false, message: "Essa reserva não foi encontrada." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { ok: false, message: "Não foi possível atualizar o recebimento agora." },
      { status: 500 }
    );
  }
}
