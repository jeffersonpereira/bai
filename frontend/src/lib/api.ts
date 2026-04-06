export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:40001";

export const apiUrl = (path: string) => `${API_BASE}${path}`;

/** Retorna headers padrão sem autenticação */
export const jsonHeaders = () => ({
  "Content-Type": "application/json",
});

/** Retorna headers com Bearer token lido do localStorage */
export const authHeaders = (token?: string | null): HeadersInit => {
  const t = token ?? (typeof window !== "undefined" ? localStorage.getItem("bai_token") : null);
  return {
    "Content-Type": "application/json",
    ...(t ? { Authorization: `Bearer ${t}` } : {}),
  };
};

/** Fetch autenticado com tratamento de erro padronizado */
export async function apiFetch<T = unknown>(
  path: string,
  options?: RequestInit & { token?: string | null }
): Promise<T> {
  const { token, ...rest } = options ?? {};
  const res = await fetch(apiUrl(path), {
    ...rest,
    headers: {
      ...authHeaders(token),
      ...(rest.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.detail ?? `Erro ${res.status}`);
  }
  return res.json() as Promise<T>;
}
