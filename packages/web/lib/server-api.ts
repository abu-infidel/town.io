import { cookies } from "next/headers";

// Server-side (SSR/server components) talks to the api container directly
// over the docker network; the browser only ever talks same-origin to /api/*
// (proxied by Caddy in production, rewritten by next.config.js in dev).
// Kept in its own module (separate from client-api.ts) because it imports
// next/headers, which cannot be bundled into client components.
const API_INTERNAL_URL = process.env.API_INTERNAL_URL ?? "http://localhost:4000";

export async function serverFetch(path: string, init?: RequestInit) {
  const cookieHeader = cookies().toString();
  return fetch(`${API_INTERNAL_URL}${path}`, {
    ...init,
    headers: { ...(init?.headers ?? {}), cookie: cookieHeader },
    cache: "no-store",
  });
}

export async function getCurrentUser() {
  try {
    const res = await serverFetch("/auth/me");
    if (!res.ok) return null;
    const data = await res.json();
    return data.user as { id: string; displayName: string; phone: string; role: string };
  } catch {
    // api unreachable - render as logged-out rather than a 500 page.
    return null;
  }
}

/**
 * `res.ok` only covers a resolved-but-non-2xx response - a network-level
 * failure (api down, DNS, ECONNREFUSED) makes serverFetch itself *throw*,
 * which a bare `res.ok` check does nothing for and crashes the page with a
 * 500. Every server component that calls serverFetch for non-critical data
 * should go through this instead, so an api blip degrades to an empty
 * state rather than an error page.
 */
export async function safeServerFetchJson<T>(path: string, fallback: T, init?: RequestInit): Promise<T> {
  try {
    const res = await serverFetch(path, init);
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}
