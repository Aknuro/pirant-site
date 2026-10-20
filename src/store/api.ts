/** Тонкая обёртка над fetch: куки сессии, JSON, понятные сообщения об ошибках. */
export class ApiError extends Error {
  constructor(message: string, public status: number, public data?: any) { super(message); }
}

export async function api<T = any>(method: string, path: string, body?: unknown, init?: { raw?: Blob; contentType?: string }): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method, credentials: 'same-origin',
      headers: init?.raw ? { 'content-type': init.contentType ?? 'application/octet-stream' } : body !== undefined ? { 'content-type': 'application/json' } : undefined,
      body: init?.raw ?? (body !== undefined ? JSON.stringify(body) : undefined),
    });
  } catch { throw new ApiError('Нет связи с сервером. Проверьте подключение и повторите.', 0); }
  let data: any = null;
  try { data = await res.json(); } catch { /* пустой ответ */ }
  if (!res.ok) throw new ApiError(data?.error || `Ошибка сервера (${res.status}).`, res.status, data);
  return data as T;
}
