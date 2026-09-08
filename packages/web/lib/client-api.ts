// Browser-side fetch helper. Talks same-origin to /api/* (see server-api.ts
// for the server-component equivalent, which is a separate file so
// next/headers never ends up in a client bundle).
export async function clientFetch(path: string, init?: RequestInit) {
  const isFormData = typeof FormData !== "undefined" && init?.body instanceof FormData;
  return fetch(`/api${path}`, {
    ...init,
    credentials: "include",
    headers: {
      ...(isFormData ? {} : { "content-type": "application/json" }),
      ...(init?.headers ?? {}),
    },
  });
}
