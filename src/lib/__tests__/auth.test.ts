// @vitest-environment node
import { test, expect, vi, beforeEach, afterEach } from "vitest";
import { SignJWT } from "jose";

// In-memory cookie store shared by the mocked next/headers cookies().
const { mockCookieStore, cookieData } = vi.hoisted(() => {
  const cookieData = new Map<string, string>();
  return {
    cookieData,
    mockCookieStore: {
      get: vi.fn((name: string) => {
        const value = cookieData.get(name);
        return value === undefined ? undefined : { name, value };
      }),
      set: vi.fn((name: string, value: string) => {
        cookieData.set(name, value);
      }),
      delete: vi.fn((name: string) => {
        cookieData.delete(name);
      }),
    },
  };
});

// server-only throws when imported outside a server context; neutralize it.
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => mockCookieStore),
}));

import {
  createSession,
  getSession,
  deleteSession,
  verifySession,
} from "@/lib/auth";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "development-secret-key"
);
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function signToken(
  claims: Record<string, unknown>,
  expirationTime: string | number = "7d"
) {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expirationTime)
    .setIssuedAt()
    .sign(SECRET);
}

function makeRequest(token?: string) {
  return {
    cookies: {
      get: (_name: string) =>
        token === undefined ? undefined : { value: token },
    },
  } as any;
}

beforeEach(() => {
  vi.clearAllMocks();
  cookieData.clear();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

test("createSession stores an auth-token cookie with a verifiable JWT", async () => {
  await createSession("user-123", "user@example.com");

  expect(mockCookieStore.set).toHaveBeenCalledTimes(1);
  const [name, token] = mockCookieStore.set.mock.calls[0];
  expect(name).toBe("auth-token");

  const session = await getSession();
  expect(session?.userId).toBe("user-123");
  expect(session?.email).toBe("user@example.com");
  expect(typeof token).toBe("string");
});

test("createSession sets hardened cookie options expiring in ~7 days", async () => {
  await createSession("user-123", "user@example.com");

  const options = mockCookieStore.set.mock.calls[0][2];
  expect(options.httpOnly).toBe(true);
  expect(options.sameSite).toBe("lax");
  expect(options.path).toBe("/");
  expect(options.secure).toBe(false); // not production in tests

  expect(options.expires).toBeInstanceOf(Date);
  const diff = options.expires.getTime() - Date.now();
  expect(diff).toBeGreaterThan(SEVEN_DAYS_MS - 5000);
  expect(diff).toBeLessThanOrEqual(SEVEN_DAYS_MS + 1000);
});

test("createSession marks the cookie secure in production", async () => {
  vi.stubEnv("NODE_ENV", "production");

  await createSession("user-123", "user@example.com");

  const options = mockCookieStore.set.mock.calls[0][2];
  expect(options.secure).toBe(true);
});

test("getSession returns null when no cookie is present", async () => {
  expect(await getSession()).toBeNull();
});

test("getSession round-trips the payload created by createSession", async () => {
  await createSession("abc", "abc@example.com");

  const session = await getSession();
  expect(session).not.toBeNull();
  expect(session?.userId).toBe("abc");
  expect(session?.email).toBe("abc@example.com");
});

test("getSession returns null for a malformed token", async () => {
  cookieData.set("auth-token", "not-a-real-jwt");
  expect(await getSession()).toBeNull();
});

test("getSession returns null for an expired token", async () => {
  const expired = await signToken(
    { userId: "u", email: "e@example.com" },
    Math.floor(Date.now() / 1000) - 60
  );
  cookieData.set("auth-token", expired);

  expect(await getSession()).toBeNull();
});

test("deleteSession removes the auth-token cookie", async () => {
  await createSession("user-123", "user@example.com");

  await deleteSession();

  expect(mockCookieStore.delete).toHaveBeenCalledWith("auth-token");
  expect(await getSession()).toBeNull();
});

test("verifySession returns null when the request has no token", async () => {
  expect(await verifySession(makeRequest())).toBeNull();
});

test("verifySession returns the payload for a valid token", async () => {
  const token = await signToken({
    userId: "user-9",
    email: "nine@example.com",
  });

  const session = await verifySession(makeRequest(token));
  expect(session?.userId).toBe("user-9");
  expect(session?.email).toBe("nine@example.com");
});

test("verifySession returns null for an invalid token", async () => {
  expect(await verifySession(makeRequest("garbage-token"))).toBeNull();
});
