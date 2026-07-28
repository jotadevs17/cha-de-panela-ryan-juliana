import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  adminCookieOptions,
  createAdminSessionValue,
  isAdminPasswordConfigured,
  isValidAdminPassword
} from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";

  if (!isAdminPasswordConfigured()) {
    return NextResponse.json(
      { ok: false, message: "Configure ADMIN_PASSWORD antes de acessar o admin." },
      { status: 500 }
    );
  }

  if (!isValidAdminPassword(password)) {
    return NextResponse.json(
      { ok: false, message: "Senha incorreta." },
      { status: 401 }
    );
  }

  const response = NextResponse.json({ ok: true, message: "Acesso liberado." });
  response.cookies.set(ADMIN_COOKIE_NAME, createAdminSessionValue(), adminCookieOptions);
  return response;
}
