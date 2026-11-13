import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  ADMIN_COOKIE,
  createAdminSession,
  isAdmin,
  isWeakAdminToken,
  tokenMatches,
  validAdminSession,
} from "@/lib/server/auth";

// vitest.config.ts define ADMIN_TOKEN solo para los tests.
const TOKEN = process.env.ADMIN_TOKEN!;
const HOST = "www.ejemplo.test";

function request(method: string, headers: Record<string, string> = {}) {
  return new Request(`https://${HOST}/api/admin/ping`, { method, headers: { host: HOST, ...headers } });
}
const cookieOf = (value: string) => `${ADMIN_COOKIE}=${value}`;

describe("token de administrador", () => {
  it("acepta el correcto y rechaza el resto", () => {
    expect(tokenMatches(TOKEN)).toBe(true);
    expect(tokenMatches(TOKEN + "x")).toBe(false);
    expect(tokenMatches(TOKEN.slice(0, -1))).toBe(false);
    expect(tokenMatches("")).toBe(false);
  });
  it("avisa si la clave configurada es corta", () => {
    expect(isWeakAdminToken()).toBe(TOKEN.length < 24);
  });
});

describe("sesión por cookie", () => {
  it("una sesión recién creada es válida", () => {
    expect(validAdminSession(createAdminSession().value)).toBe(true);
  });
  it("no contiene el token", () => {
    expect(createAdminSession().value).not.toContain(TOKEN);
  });
  it("vence a los 30 días", () => {
    const now = 1_700_000_000_000;
    const { value, expires } = createAdminSession(now);
    expect(expires.getTime() - now).toBe(30 * 24 * 60 * 60 * 1000);
    expect(validAdminSession(value, now + 29 * 24 * 3600 * 1000)).toBe(true);
    expect(validAdminSession(value, now + 31 * 24 * 3600 * 1000)).toBe(false);
  });
  it("rechaza firmas adulteradas, vencimientos cambiados y basura", () => {
    const { value } = createAdminSession();
    const [exp, sig] = value.split(".");
    expect(validAdminSession(`${exp}.${"0".repeat(sig.length)}`)).toBe(false);
    expect(validAdminSession(`${Number(exp) + 86_400_000}.${sig}`)).toBe(false);
    expect(validAdminSession(`${exp}.${sig.slice(0, -1)}`)).toBe(false);
    for (const junk of ["", "basura", ".", "123.", ".abc", "NaN.abc", null, undefined]) {
      expect(validAdminSession(junk as string)).toBe(false);
    }
  });
  it("una sesión firmada con otra clave no vale", () => {
    const exp = Date.now() + 3_600_000;
    const forged = crypto.createHmac("sha256", "otra-clave").update(`thor-admin-session|${exp}`).digest("hex");
    expect(validAdminSession(`${exp}.${forged}`)).toBe(false);
  });
});

describe("isAdmin", () => {
  const session = () => cookieOf(createAdminSession().value);

  it("sin credenciales no entra", () => {
    expect(isAdmin(request("GET"))).toBe(false);
  });
  it("con el token por Authorization o X-Admin-Token", () => {
    expect(isAdmin(request("GET", { authorization: `Bearer ${TOKEN}` }))).toBe(true);
    expect(isAdmin(request("POST", { authorization: `Bearer ${TOKEN}` }))).toBe(true); // sin Origin: es un script
    expect(isAdmin(request("GET", { "x-admin-token": TOKEN }))).toBe(true);
  });
  it("un token equivocado no entra aunque haya una cookie buena", () => {
    expect(isAdmin(request("GET", { authorization: "Bearer mal", cookie: session() }))).toBe(false);
  });
  it("la cookie vale para leer", () => {
    expect(isAdmin(request("GET", { cookie: session() }))).toBe(true);
    expect(isAdmin(request("HEAD", { cookie: session() }))).toBe(true);
  });
  it("con cookie, lo que modifica datos exige que venga de una página del propio sitio", () => {
    const cookie = session();
    for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
      expect(isAdmin(request(method, { cookie }))).toBe(false); // sin Origin
      expect(isAdmin(request(method, { cookie, origin: "https://sitio-malo.test" }))).toBe(false);
      expect(isAdmin(request(method, { cookie, origin: `https://${HOST}.sitio-malo.test` }))).toBe(false);
      expect(isAdmin(request(method, { cookie, origin: "no es una url" }))).toBe(false);
      expect(isAdmin(request(method, { cookie, origin: `https://${HOST}` }))).toBe(true);
    }
  });
  it("detrás del proxy de Vercel manda x-forwarded-host", () => {
    const cookie = session();
    expect(isAdmin(request("POST", { cookie, origin: `https://${HOST}`, "x-forwarded-host": HOST }))).toBe(true);
    expect(isAdmin(request("POST", { cookie, origin: `https://${HOST}`, "x-forwarded-host": "otro.test" }))).toBe(false);
  });
  it("encuentra la cookie entre otras", () => {
    const value = createAdminSession().value;
    expect(isAdmin(request("GET", { cookie: `a=1; ${cookieOf(value)}; b=2` }))).toBe(true);
    expect(isAdmin(request("GET", { cookie: `x${ADMIN_COOKIE}=${value}` }))).toBe(false);
  });
  it("una cookie vencida o rota no entra", () => {
    const past = Date.now() - 1000;
    const sig = crypto.createHmac("sha256", TOKEN).update(`thor-admin-session|${past}`).digest("hex");
    expect(isAdmin(request("GET", { cookie: cookieOf(`${past}.${sig}`) }))).toBe(false);
    expect(isAdmin(request("GET", { cookie: cookieOf("basura") }))).toBe(false);
  });
});
