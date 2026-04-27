import { getOaApiUrl } from './oa-api-url';

type AccessTokenProvider = () => Promise<string | null>;

let accessTokenProvider: AccessTokenProvider | null = null;

export class ApiError extends Error {
  status: number;
  body: string;

  constructor(status: number, body: string) {
    super(`API Error ${status}: ${body}`);
    this.status = status;
    this.body = body;
  }
}

export interface ApiFetchOptions extends RequestInit {
  auth?: boolean;
  timeoutMs?: number;
}

export function setAccessTokenProvider(provider: AccessTokenProvider | null): void {
  accessTokenProvider = provider;
}

async function createApiRequest(endpoint: string, options: ApiFetchOptions = {}) {
  const { auth = true, timeoutMs, headers: providedHeaders, ...fetchOptions } = options;
  const controller = timeoutMs ? new AbortController() : null;
  const timeoutId = controller ? window.setTimeout(() => controller.abort(), timeoutMs) : null;
  const headers = new Headers(providedHeaders ?? {});
  const body = fetchOptions.body;
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }
  if (body && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (auth && accessTokenProvider) {
    const token = await accessTokenProvider();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  return {
    url: `${getOaApiUrl()}${endpoint}`,
    timeoutId,
    requestInit: {
      ...fetchOptions,
      headers,
      signal: controller?.signal ?? fetchOptions.signal,
    } satisfies RequestInit,
  };
}

export async function apiFetchResponse(endpoint: string, options: ApiFetchOptions = {}): Promise<Response> {
  const { timeoutId, requestInit, url } = await createApiRequest(endpoint, options);

  try {
    const response = await fetch(url, requestInit);

    if (!response.ok) {
      const message = await response.text();
      throw new ApiError(response.status, message);
    }

    return response;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(`API request timed out after ${options.timeoutMs}ms`);
    }
    throw error;
  } finally {
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
    }
  }
}

export async function apiFetch<T>(endpoint: string, options: ApiFetchOptions = {}): Promise<T> {
  const response = await apiFetchResponse(endpoint, options);

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return response.json() as Promise<T>;
  }

  return (await response.text()) as T;
}
