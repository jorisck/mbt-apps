import createClient from "openapi-fetch";
import type { paths } from "./schema";

export type { paths };
export type ApiClient = ReturnType<typeof createClient<paths>>;

export function createApiClient(options: {
  baseUrl: string;
  headers?: Record<string, string>;
}): ApiClient {
  return createClient<paths>({
    baseUrl: options.baseUrl.replace(/\/$/, ""),
    headers: options.headers,
  });
}
