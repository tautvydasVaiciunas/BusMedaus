type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

type QueryValue = string | number | boolean | null | undefined;

export type RequestOptions = {
  body?: unknown;
  query?: Record<string, QueryValue>;
  headers?: HeadersInit;
  withAuth?: boolean;
  signal?: AbortSignal;
};

export type AccessTokenProvider = () => string | null | Promise<string | null>;

const REFRESH_BUFFER_MS = 60_000;

let accessTokenProvider: AccessTokenProvider | null = null;
let apiBaseUrl = typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL : "";

const normalizeBaseUrl = (url: string) => url.replace(/\/$/, "");

const appendQueryParams = (url: string, query?: Record<string, QueryValue>) => {
  if (!query) {
    return url;
  }

  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }
    params.append(key, String(value));
  });

  const queryString = params.toString();

  if (!queryString) {
    return url;
  }

  return `${url}${url.includes("?") ? "&" : "?"}${queryString}`;
};

const buildUrl = (path: string, query?: Record<string, QueryValue>) => {
  if (/^https?:\/\//i.test(path)) {
    return appendQueryParams(path, query);
  }

  const base = apiBaseUrl ? normalizeBaseUrl(apiBaseUrl) : "";
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${base}${normalizedPath}`;
  return appendQueryParams(url, query);
};

export class ApiClientError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.details = details;
  }
}

const parseResponse = async <T>(response: Response): Promise<T> => {
  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }

  if (contentType.includes("text/")) {
    return (await response.text()) as T;
  }

  return undefined as T;
};

const buildHeaders = async (withAuth: boolean, headers?: HeadersInit) => {
  const result = new Headers(headers ?? {});

  if (withAuth && accessTokenProvider) {
    const token = await accessTokenProvider();
    if (token) {
      result.set("Authorization", `Bearer ${token}`);
    }
  }

  return result;
};

const request = async <T>(method: HttpMethod, path: string, options: RequestOptions = {}) => {
  const { body, query, headers, withAuth = true, signal } = options;
  const url = buildUrl(path, query);
  const initHeaders = await buildHeaders(withAuth, headers);

  const init: RequestInit = {
    method,
    headers: initHeaders,
    signal
  };

  if (body !== undefined) {
    if (body instanceof FormData) {
      init.body = body;
    } else {
      initHeaders.set("Content-Type", "application/json");
      init.body = JSON.stringify(body);
    }
  }

  const response = await fetch(url, init);

  if (!response.ok) {
    const contentType = response.headers.get("content-type") ?? "";
    let errorDetails: unknown = null;
    let message = response.statusText || "Užklausa nepavyko";

    try {
      if (contentType.includes("application/json")) {
        errorDetails = await response.json();
        if (typeof errorDetails === "object" && errorDetails && "message" in errorDetails) {
          const extracted = (errorDetails as { message?: unknown }).message;
          if (typeof extracted === "string" && extracted.trim()) {
            message = extracted;
          }
        }
      } else if (contentType.includes("text/")) {
        const text = await response.text();
        if (text.trim()) {
          message = text;
          errorDetails = text;
        }
      }
    } catch {
      // ignore parsing errors and fall back to defaults
    }

    throw new ApiClientError(message, response.status, errorDetails);
  }

  return parseResponse<T>(response);
};

export const setAccessTokenProvider = (provider: AccessTokenProvider | null) => {
  accessTokenProvider = provider;
};

export const setApiBaseUrl = (baseUrl: string) => {
  apiBaseUrl = baseUrl;
};

const bodyOptions = <T extends RequestOptions>(options?: T, body?: unknown) => ({
  ...(options ?? {}),
  body
});

export const apiClient = {
  get: async <T>(path: string, options?: Omit<RequestOptions, "body">) => request<T>("GET", path, options),
  post: async <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "body">) =>
    request<T>("POST", path, bodyOptions(options, body)),
  patch: async <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "body">) =>
    request<T>("PATCH", path, bodyOptions(options, body)),
  put: async <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "body">) =>
    request<T>("PUT", path, bodyOptions(options, body)),
  delete: async <T>(path: string, options?: RequestOptions) => request<T>("DELETE", path, options)
};

export const API_REFRESH_BUFFER = REFRESH_BUFFER_MS;
