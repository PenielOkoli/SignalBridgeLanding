const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
const BEARER_TOKEN = process.env.NEXT_PUBLIC_API_BEARER_TOKEN || "";

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
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

export interface LogsResponse {
  lines: string[];
  total_lines: number;
}

export interface SafeConfig {
  bybit_api_key: string;
  bybit_api_secret_set: boolean;
  gemini_api_key?: string;
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
  gemini_api_key?: string;
  risk_usdt?: number;
  leverage?: number;
  telegram_channel_ids?: number[];
  testnet?: boolean;
}

export interface TelegramChannel {
  id: number;
  name: string;
  type: "channel" | "supergroup" | "group";
  username?: string;
  members?: number;
}

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
