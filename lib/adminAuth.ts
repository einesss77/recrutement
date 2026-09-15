import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "bm_admin_session";

function adminPassword() {
  const password = process.env.ADMIN_PASSWORD;
  return password || null;
}

function sessionValue() {
  const password = adminPassword();
  if (!password) {
    throw new Error("ADMIN_PASSWORD doit être configuré.");
  }

  return createHmac("sha256", password).update("bm-digital-consulting-admin").digest("hex");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  const value = cookieStore.get(COOKIE_NAME)?.value;
  const password = adminPassword();

  if (!value || !password) {
    return false;
  }

  return safeEqual(value, sessionValue());
}

export async function setAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, sessionValue(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
