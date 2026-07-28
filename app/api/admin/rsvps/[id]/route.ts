import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: {
    id: string;
  };
};

function rsvpIdFromParams(params: RouteContext["params"]) {
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

  const id = rsvpIdFromParams(params);

  if (!id) {
    return NextResponse.json(
      { ok: false, message: "Confirmação inválida." },
      { status: 400 }
    );
  }

  try {
    await prisma.attendanceConfirmation.delete({
      where: { id }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json(
        { ok: false, message: "Essa confirmação não foi encontrada." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { ok: false, message: "Não foi possível remover a confirmação agora." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, message: "Confirmação removida." });
}
