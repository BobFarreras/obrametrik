/**
 * @file packages/api-client/src/index.ts
 * @description Framework-independent HTTP client with timeout and structured errors.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
  }
}
export function createApiClient(config: { baseUrl: string; token?: string; timeoutMs?: number }) {
  return {
    async request<T>(path: string, init: RequestInit = {}): Promise<T> {
      const signal = AbortSignal.any([
        init.signal ?? new AbortController().signal,
        AbortSignal.timeout(config.timeoutMs ?? 10_000),
      ]);
      const response = await fetch(new URL(path, config.baseUrl), {
        ...init,
        signal,
        headers: {
          "content-type": "application/json",
          ...(config.token ? { authorization: `Bearer ${config.token}` } : {}),
          ...init.headers,
        },
      });
      if (!response.ok) throw new ApiError("API request failed", response.status, "HTTP_ERROR");
      return response.json() as Promise<T>;
    },
  };
}
