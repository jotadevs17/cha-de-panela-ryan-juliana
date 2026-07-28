import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function cleanString(value: unknown) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed.length > 0 ? trimmed : null;
}

function cleanWhatsapp(value: unknown) {
  const digits = typeof value === "string" ? value.replace(/\D/g, "") : "";
  return digits.length > 0 ? digits : null;
}

function cleanGuestsCount(value: unknown) {
  const count = Number(value);
  return Number.isInteger(count) && count >= 1 && count <= 10 ? count : null;
}

function cleanGuestNames(value: unknown) {
  return Array.isArray(value)
    ? value
        .map((item) => (typeof item === "string" ? item.trim().replace(/\s+/g, " ") : ""))
        .filter(Boolean)
    : [];
}

function hasAtLeastOneLetter(value: string) {
  return /[A-Za-zÀ-ÿ]/.test(value);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const guestWhatsapp = cleanWhatsapp(body?.guestWhatsapp);
  const guestsCount = cleanGuestsCount(body?.guestsCount);
  const attendeeNames = cleanGuestNames(body?.attendeeNames);
  const fallbackGuestName = cleanString(body?.guestName);
  const message = cleanString(body?.message);

  if (!guestsCount) {
    return NextResponse.json(
      { ok: false, message: "Informe a quantidade de pessoas entre 1 e 10." },
      { status: 400 }
    );
  }

  const normalizedNames = attendeeNames.length > 0 ? attendeeNames : fallbackGuestName ? [fallbackGuestName] : [];

  if (normalizedNames.length !== guestsCount) {
    return NextResponse.json(
      { ok: false, message: "Informe o nome de todas as pessoas confirmadas." },
      { status: 400 }
    );
  }

  if (normalizedNames.some((name) => !hasAtLeastOneLetter(name))) {
    return NextResponse.json(
      { ok: false, message: "Informe ao menos uma letra no nome de cada pessoa confirmada." },
      { status: 400 }
    );
  }

  if (guestWhatsapp && (guestWhatsapp.length < 10 || guestWhatsapp.length > 13)) {
    return NextResponse.json(
      { ok: false, message: "Confira o WhatsApp informado ou deixe o campo em branco." },
      { status: 400 }
    );
  }

  const guestName = normalizedNames[0];

  try {
    if (guestWhatsapp) {
      await prisma.attendanceConfirmation.upsert({
        where: { guestWhatsapp },
        create: {
          guestName,
          guestWhatsapp,
          attendeeNames: normalizedNames,
          guestsCount,
          message
        },
        update: {
          guestName,
          attendeeNames: normalizedNames,
          guestsCount,
          message
        }
      });

      return NextResponse.json({
        ok: true,
        message: "Presença confirmada! Se você já tinha enviado, atualizamos sua confirmação."
      });
    }

    await prisma.attendanceConfirmation.create({
      data: {
        guestName,
        attendeeNames: normalizedNames,
        guestsCount,
        message
      }
    });

    return NextResponse.json({
      ok: true,
      message: "Presença confirmada! Vai ser muito especial ter você com a gente."
    });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Não foi possível confirmar presença agora. Tente novamente em instantes." },
      { status: 500 }
    );
  }
}
