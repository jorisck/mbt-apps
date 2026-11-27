import "server-only";

import { createApiClient } from "./index";

const baseUrl = (process.env.API_URL ?? "http://api.localhost:8000").replace(/\/$/, "");
const bffKey = process.env.API_BFF_KEY ?? "";

/** Client préconfiguré pour les server actions (clé de site jamais exposée au navigateur). */
export const api = createApiClient({
  baseUrl,
  headers: bffKey ? { "X-Client-Key": bffKey } : {},
});

export { createApiClient } from "./index";
export type { paths, ApiClient } from "./index";
