const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
}

export const apiRequest = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const method = options.method ?? "GET";

  if (!navigator.onLine) {
    if (method !== "GET") {
      throw new ApiError(503, "Offline connection");
    }
    const cacheKey = `COSEKE_CACHE_${path}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      console.log(`[Cache] Serving offline cached data for: ${path}`);
      return JSON.parse(cached) as T;
    }
    throw new ApiError(503, "Offline: No cached data available.");
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(res.status, data?.error ?? "Request failed");
  }

  if (method === "GET" && data) {
    localStorage.setItem(`COSEKE_CACHE_${path}`, JSON.stringify(data));
  }

  return data as T;
};
