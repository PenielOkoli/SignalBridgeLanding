// lib/api.ts
// Typed API client for the FastAPI bridge on the GCP VM

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
const BEARER_TOKEN = process.env.NEXT_PUBLIC_API_BEARER_TOKEN || "";

if (!API_URL) {
  console.warn("[api] NEXT_PUBLIC_API_URL is not set");
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${BEARER_TOKEN}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LogsResponse {
  lines: string[];
  total_lines: number;
}

export interface SafeConfig {
  bybit_api_key: string;
  bybit_api_secret_set: boolean;
  openai_api_key_set: boolean;
  risk_usdt: number;
  leverage: number;
  telegram_channel_ids: number[];
  testnet: boolean;
}

export interface SystemStatus {
  exchange: "connected" | "disconnected";
  telegram: "connected" | "disconnected";
  log_file_exists: boolean;
}

export interface ConfigUpdatePayload {
  bybit_api_key?: string;
  bybit_api_secret?: string;
  openai_api_key?: string;
  risk_usdt?: number;
  leverage?: number;
  telegram_channel_ids?: number[];
  testnet?: boolean;
}

// ── API Methods ───────────────────────────────────────────────────────────────

export const api = {
  getLogs: () => apiFetch<LogsResponse>("/logs"),

  getConfig: () => apiFetch<SafeConfig>("/config"),

  updateConfig: (payload: ConfigUpdatePayload) =>
    apiFetch<{ success: boolean; config: SafeConfig }>("/config", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getStatus: () => apiFetch<SystemStatus>("/status"),

  getTelegramChannels: () => apiFetch<TelegramChannel[]>("/telegram/channels"),

  healthCheck: () =>
    fetch(`${API_URL}/health`)
      .then((r) => r.json())
      .catch(() => ({ status: "unreachable" })),
};

export interface TelegramChannel {
  id: number;
  name: string;
  type: "channel" | "supergroup" | "group";
  username?: string;
  members?: number;
}
