import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

export const ADMIN_COOKIE_NAME = "cha_admin_session";

const SESSION_PAYLOAD = "admin:v1";

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD?.trim() ?? "";
}

function sign(payload: string) {
  return createHmac("sha256", getAdminPassword()).update(payload).digest("hex");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function isAdminPasswordConfigured() {
  return getAdminPassword().length > 0;
}

export function isValidAdminPassword(password: string) {
  const expected = getAdminPassword();

  if (!expected || !password) {
    return false;
  }

  return safeEqual(password, expected);
}

export function createAdminSessionValue() {
  return `${SESSION_PAYLOAD}.${sign(SESSION_PAYLOAD)}`;
}

export function verifyAdminSessionValue(value: string | undefined) {
  if (!value || !isAdminPasswordConfigured()) {
    return false;
  }

  const [payload, signature] = value.split(".");

  if (payload !== SESSION_PAYLOAD || !signature) {
    return false;
  }

  return safeEqual(signature, sign(payload));
}

export function isAdminAuthenticated() {
  return verifyAdminSessionValue(cookies().get(ADMIN_COOKIE_NAME)?.value);
}

export function isAdminRequest(request: NextRequest) {
  return verifyAdminSessionValue(request.cookies.get(ADMIN_COOKIE_NAME)?.value);
}

export const adminCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 8
};
