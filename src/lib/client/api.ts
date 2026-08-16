"use client";

/** Tiny fetch wrapper for the admin SPA-style pages. */

export interface ApiErrorPayload {
  message: string;
  code?: string;
  fields?: Record<string, string[]>;
}

export class ApiClientError extends Error {
  status: number;
  code?: string;
  fields?: Record<string, string[]>;
  constructor(status: number, payload: ApiErrorPayload) {
    super(payload.message);
    this.status = status;
    this.code = payload.code;
    this.fields = payload.fields;
  }
}

async function request<T>(
  url: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    credentials: "same-origin",
    ...init,
    headers: {
      ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(init?.headers ?? {}),
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = json?.error ?? { message: "Request failed" };
    throw new ApiClientError(res.status, err);
  }
  return (json?.data ?? json) as T;
}

export const api = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, body?: unknown) =>
    request<T>(url, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined }),
  patch: <T>(url: string, body?: unknown) =>
    request<T>(url, { method: "PATCH", body: body !== undefined ? JSON.stringify(body) : undefined }),
  put: <T>(url: string, body?: unknown) =>
    request<T>(url, { method: "PUT", body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: <T>(url: string) => request<T>(url, { method: "DELETE" }),
  upload: <T>(url: string, formData: FormData) =>
    request<T>(url, { method: "POST", body: formData }),
};

export function firstFieldError(e: unknown): string | undefined {
  if (e instanceof ApiClientError && e.fields) {
    const first = Object.values(e.fields)[0];
    return first?.[0];
  }
  return e instanceof ApiClientError ? e.message : undefined;
}
