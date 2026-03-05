"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import {
  Activity,
  Settings,
  Terminal,
  Wifi,
  WifiOff,
  RefreshCw,
  TrendingUp,
  Zap,
  Radio,
  AlertTriangle,
} from "lucide-react";
import { api, type LogsResponse, type SystemStatus } from "@/lib/api";

// ── Log line colorizer ────────────────────────────────────────────────────────

function colorize(line: string): JSX.Element {
  if (line.includes("[SUCCESS]") || line.includes("connected") || line.includes("Connected"))
    return <span className="text-emerald-400">{line}</span>;
  if (line.includes("[ERROR]") || line.includes("[FAILED]") || line.includes("error"))
    return <span className="text-red-400">{line}</span>;
  if (line.includes("[WARNING]") || line.includes("warning") || line.includes("[SKIP]"))
    return <span className="text-amber-400">{line}</span>;
  if (line.includes("[SIGNAL]") || line.includes("SIGNAL RECEIVED"))
    return <span className="text-indigo-300 font-semibold">{line}</span>;
  if (line.includes("[PARSED]") || line.includes("[EXECUTING]"))
    return <span className="text-violet-300">{line}</span>;
  if (line.includes("[INFO]") || line.includes("INFO"))
    return <span className="text-zinc-300">{line}</span>;
  if (line.startsWith("="))
    return <span className="text-zinc-500">{line}</span>;
  return <span className="text-zinc-400">{line}</span>;
}

// ── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({
  label,
  status,
  icon: Icon,
}: {
  label: string;
  status: "connected" | "disconnected" | "loading";
  icon: React.ElementType;
}) {
  const colors = {
    connected: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
    disconnected: "border-red-500/40 bg-red-500/10 text-red-400",
    loading: "border-zinc-600/40 bg-zinc-800/40 text-zinc-500",
  };
  const dotColors = {
    connected: "bg-emerald-400 shadow-emerald-400/60",
    disconnected: "bg-red-400",
    loading: "bg-zinc-600",
  };

  return (
    <div className={`flex items-center gap-2.5 rounded-lg border px-4 py-2.5 ${colors[status]}`}>
      <div className={`h-2 w-2 rounded-full ${dotColors[status]} ${status === "connected" ? "shadow-[0_0_6px_2px]" : ""}`} />
      <Icon size={14} />
      <span className="font-mono text-xs tracking-widest uppercase">{label}</span>
      <span className="font-mono text-xs opacity-70 capitalize">{status}</span>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent = "emerald",
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "emerald" | "indigo" | "violet";
}) {
  const accents = {
    emerald: "from-emerald-500/10 border-emerald-500/20 text-emerald-400",
    indigo: "from-indigo-500/10 border-indigo-500/20 text-indigo-400",
    violet: "from-violet-500/10 border-violet-500/20 text-violet-400",
  };
  return (
    <div className={`relative overflow-hidden rounded-xl border bg-gradient-to-br to-transparent p-5 ${accents[accent]}`}>
      <div className="mb-1 font-mono text-[10px] tracking-widest uppercase text-zinc-500">{label}</div>
      <div className="font-mono text-2xl font-bold text-zinc-100">{value}</div>
      {sub && <div className="mt-1 font-mono text-[11px] text-zinc-500">{sub}</div>}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [logs, setLogs] = useState<string[]>(["Initializing terminal..."]);
  const [totalLines, setTotalLines] = useState(0);
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isPolling, setIsPolling] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef(true);

  const fetchLogs = useCallback(async () => {
    try {
      const data: LogsResponse = await api.getLogs();
      setLogs(data.lines);
      setTotalLines(data.total_lines);
      setLastUpdated(new Date());
      setFetchError(null);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Failed to fetch logs");
    }
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const s = await api.getStatus();
      setStatus(s);
    } catch {
      // Status fetch failures are non-critical
    }
  }, []);

  // Auto-scroll terminal to bottom
  useEffect(() => {
    if (autoScrollRef.current && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  // Polling loop
  useEffect(() => {
    if (!isPolling) return;
    fetchLogs();
    fetchStatus();
    const logsInterval = setInterval(fetchLogs, 2000);
    const statusInterval = setInterval(fetchStatus, 5000);
    return () => {
      clearInterval(logsInterval);
      clearInterval(statusInterval);
    };
  }, [isPolling, fetchLogs, fetchStatus]);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-mono">
      {/* Scanline overlay */}
      <div className="pointer-events-none fixed inset-0 z-50 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.025)_50%)] bg-[length:100%_4px]" />

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-[#09090b]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 animate-pulse rounded-lg bg-emerald-500/20" />
              <div className="relative rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2">
                <TrendingUp size={18} className="text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="text-sm font-bold tracking-wider text-zinc-100">SIGNAL TRADER</div>
              <div className="text-[10px] tracking-widest text-zinc-500 uppercase">Autonomous Execution Engine</div>
            </div>
          </div>

          <nav className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs text-emerald-400 transition-colors"
            >
              <Activity size={13} />
              Dashboard
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-xs text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-300"
            >
              <Settings size={13} />
              Settings
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 p-6">
        {/* ── Status Row ── */}
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge
            label="Telegram"
            status={status ? status.telegram : "loading"}
            icon={Radio}
          />
          <StatusBadge
            label="Exchange"
            status={status ? status.exchange : "loading"}
            icon={Zap}
          />
          {fetchError && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-400">
              <AlertTriangle size={13} />
              <span>{fetchError}</span>
            </div>
          )}
          <div className="ml-auto flex items-center gap-3">
            {lastUpdated && (
              <span className="text-[11px] text-zinc-600">
                Last sync: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={() => setIsPolling((p) => !p)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] transition-colors ${
                isPolling
                  ? "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                  : "border-zinc-700 text-zinc-500 hover:border-zinc-600"
              }`}
            >
              <RefreshCw size={11} className={isPolling ? "animate-spin" : ""} />
              {isPolling ? "Live" : "Paused"}
            </button>
          </div>
        </div>

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            label="Log Lines"
            value={totalLines.toLocaleString()}
            sub="Total activity"
            accent="emerald"
          />
          <StatCard
            label="Signal Engine"
            value={status?.telegram === "connected" ? "ACTIVE" : "STANDBY"}
            sub="GPT-4o Mini parser"
            accent="indigo"
          />
          <StatCard
            label="Exchange"
            value={status?.exchange === "connected" ? "LIVE" : "OFFLINE"}
            sub="Bybit Futures"
            accent="violet"
          />
          <StatCard
            label="Poll Rate"
            value={isPolling ? "2s" : "PAUSED"}
            sub="Terminal refresh"
            accent="emerald"
          />
        </div>

        {/* ── Terminal ── */}
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/50">
          {/* Terminal header bar */}
          <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/80 px-5 py-3">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-500/70" />
                <div className="h-3 w-3 rounded-full bg-amber-500/70" />
                <div className="h-3 w-3 rounded-full bg-emerald-500/70" />
              </div>
              <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                <Terminal size={11} />
                <span>activity.log — live tail</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex cursor-pointer items-center gap-1.5 text-[11px] text-zinc-500 hover:text-zinc-400">
                <input
                  type="checkbox"
                  checked={autoScrollRef.current}
                  onChange={(e) => { autoScrollRef.current = e.target.checked; }}
                  className="h-3 w-3 accent-emerald-500"
                />
                Auto-scroll
              </label>
              <div className={`h-2 w-2 rounded-full ${isPolling ? "animate-pulse bg-emerald-400 shadow-[0_0_6px_2px_rgba(52,211,153,0.4)]" : "bg-zinc-600"}`} />
            </div>
          </div>

          {/* Terminal body */}
          <div
            ref={terminalRef}
            className="h-[480px] overflow-y-auto p-5 text-[12px] leading-relaxed"
            style={{ scrollbarWidth: "thin", scrollbarColor: "#27272a transparent" }}
          >
            {logs.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <Terminal size={32} className="mx-auto mb-3 text-zinc-700" />
                  <p className="text-zinc-600">Waiting for log entries...</p>
                  <p className="mt-1 text-[11px] text-zinc-700">Ensure the GCP VM is running</p>
                </div>
              </div>
            ) : (
              <div className="space-y-0.5">
                {logs.map((line, i) => (
                  <div key={i} className="whitespace-pre-wrap break-all font-mono">
                    {colorize(line)}
                  </div>
                ))}
                {/* Blinking cursor */}
                <span className="inline-block h-3.5 w-2 animate-pulse bg-emerald-400 opacity-70" />
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between border-t border-zinc-800/50 pt-4 text-[10px] text-zinc-700">
          <span>SIGNAL TRADER v1.0 — Bybit Futures Automation</span>
          <span>Built with Next.js + FastAPI + GPT-4o Mini</span>
        </div>
      </main>
    </div>
  );
}
