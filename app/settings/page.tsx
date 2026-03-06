"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Settings, Activity, Eye, EyeOff, Save, TrendingUp,
  CheckCircle2, AlertCircle, Loader2, DollarSign, Hash,
  FlaskConical, RefreshCw, Radio, Search, X, Users,
} from "lucide-react";
import { api, type SafeConfig, type ConfigUpdatePayload } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────
interface TelegramChannel {
  id: number;
  name: string;
  type: "channel" | "supergroup" | "group";
  username?: string;
  members?: number;
}

// ── Secret Field ──────────────────────────────────────────────────────────────
function SecretField({ label, placeholder, value, onChange, isSet, hint }: {
  label: string; placeholder: string; value: string;
  onChange: (v: string) => void; isSet?: boolean; hint?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="font-mono text-xs tracking-widest uppercase text-zinc-400">{label}</label>
        {isSet && (
          <span className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] text-emerald-400">
            <CheckCircle2 size={10} /> SET
          </span>
        )}
      </div>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={isSet ? "••••••••••••• (unchanged)" : placeholder}
          className="w-full rounded-lg border border-zinc-700/80 bg-zinc-900 py-3 pl-4 pr-12 font-mono text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-all focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20"
        />
        <button type="button" onClick={() => setShow(s => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400">
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
      {hint && <p className="font-mono text-[11px] text-zinc-600">{hint}</p>}
    </div>
  );
}

function TextField({ label, placeholder, value, onChange, type = "text", min, max, hint, icon: Icon }: {
  label: string; placeholder: string; value: string; onChange: (v: string) => void;
  type?: string; min?: number; max?: number; hint?: string; icon?: React.ElementType;
}) {
  return (
    <div className="space-y-2">
      <label className="font-mono text-xs tracking-widest uppercase text-zinc-400">{label}</label>
      <div className="relative">
        {Icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"><Icon size={14} /></div>}
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder} min={min} max={max}
          className={`w-full rounded-lg border border-zinc-700/80 bg-zinc-900 py-3 ${Icon ? "pl-10" : "pl-4"} pr-4 font-mono text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-all focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20`}
        />
      </div>
      {hint && <p className="font-mono text-[11px] text-zinc-600">{hint}</p>}
    </div>
  );
}

function SectionCard({ title, description, children, accent = "indigo" }: {
  title: string; description: string; children: React.ReactNode; accent?: "indigo" | "emerald" | "violet";
}) {
  const accents = {
    indigo: "border-indigo-500/20 from-indigo-500/5",
    emerald: "border-emerald-500/20 from-emerald-500/5",
    violet: "border-violet-500/20 from-violet-500/5",
  };
  return (
    <div className={`overflow-hidden rounded-xl border bg-gradient-to-br to-transparent ${accents[accent]} bg-zinc-950`}>
      <div className="border-b border-zinc-800/60 bg-zinc-900/40 px-6 py-4">
        <h2 className="font-mono text-sm font-semibold text-zinc-200">{title}</h2>
        <p className="mt-0.5 font-mono text-[11px] text-zinc-500">{description}</p>
      </div>
      <div className="space-y-5 p-6">{children}</div>
    </div>
  );
}

// ── Channel Selector ──────────────────────────────────────────────────────────
function ChannelSelector({ selectedIds, onChange }: {
  selectedIds: number[]; onChange: (ids: number[]) => void;
}) {
  const [channels, setChannels] = useState<TelegramChannel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loaded, setLoaded] = useState(false);

  const fetchChannels = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getTelegramChannels();
      setChannels(data);
      setLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load channels");
    } finally {
      setLoading(false);
    }
  }, []);

  const toggle = (id: number) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(x => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const typeColors: Record<string, string> = {
    channel: "border-indigo-500/30 bg-indigo-500/10 text-indigo-400",
    supergroup: "border-violet-500/30 bg-violet-500/10 text-violet-400",
    group: "border-zinc-600/30 bg-zinc-700/20 text-zinc-400",
  };

  const typeIcons: Record<string, string> = {
    channel: "CH", supergroup: "SG", group: "GR",
  };

  const filtered = channels.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.username && c.username.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-3">
      {/* Selected chips */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedIds.map(id => {
            const ch = channels.find(c => c.id === id);
            return (
              <div key={id} className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-[11px] text-emerald-400">
                <span>{ch ? ch.name : id}</span>
                <button onClick={() => toggle(id)} className="hover:text-red-400">
                  <X size={10} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Load button */}
      {!loaded ? (
        <button onClick={fetchChannels} disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-violet-500/30 bg-violet-500/10 py-3 font-mono text-xs text-violet-400 transition-colors hover:bg-violet-500/20 disabled:opacity-50">
          {loading ? <Loader2 size={13} className="animate-spin" /> : <Radio size={13} />}
          {loading ? "Loading your Telegram channels..." : "Load My Telegram Channels"}
        </button>
      ) : (
        <div className="space-y-2">
          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search channels..."
              className="w-full rounded-lg border border-zinc-700/80 bg-zinc-900 py-2.5 pl-9 pr-4 font-mono text-xs text-zinc-300 placeholder-zinc-600 outline-none focus:border-violet-500/50"
            />
          </div>

          {/* Channel list */}
          <div className="max-h-64 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-900/50 p-1"
            style={{ scrollbarWidth: "thin", scrollbarColor: "#27272a transparent" }}>
            {filtered.length === 0 ? (
              <div className="py-6 text-center font-mono text-xs text-zinc-600">No channels found</div>
            ) : (
              filtered.map(ch => {
                const isSelected = selectedIds.includes(ch.id);
                return (
                  <button key={ch.id} onClick={() => toggle(ch.id)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${isSelected ? "bg-emerald-500/10 hover:bg-emerald-500/15" : "hover:bg-zinc-800/60"}`}>
                    {/* Type badge */}
                    <span className={`shrink-0 rounded border px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-widest ${typeColors[ch.type] || typeColors.group}`}>
                      {typeIcons[ch.type]}
                    </span>
                    {/* Name */}
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-mono text-xs text-zinc-200">{ch.name}</div>
                      {ch.username && (
                        <div className="font-mono text-[10px] text-zinc-600">@{ch.username}</div>
                      )}
                    </div>
                    {/* Members */}
                    {ch.members && (
                      <div className="flex items-center gap-1 shrink-0 font-mono text-[10px] text-zinc-600">
                        <Users size={9} />
                        {ch.members.toLocaleString()}
                      </div>
                    )}
                    {/* Checkmark */}
                    {isSelected && <CheckCircle2 size={14} className="shrink-0 text-emerald-400" />}
                  </button>
                );
              })
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] text-zinc-600">
              {filtered.length} channels · {selectedIds.length} selected
            </span>
            <button onClick={fetchChannels} className="font-mono text-[11px] text-zinc-600 hover:text-zinc-400 flex items-center gap-1">
              <RefreshCw size={10} /> Refresh
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 font-mono text-[11px] text-red-400">
          <AlertCircle size={12} /> {error}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [config, setConfig] = useState<SafeConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ ok: boolean; message: string } | null>(null);

  const [bybitApiKey, setBybitApiKey] = useState("");
  const [bybitSecret, setBybitSecret] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [riskUsdt, setRiskUsdt] = useState("10");
  const [leverage, setLeverage] = useState("10");
  const [selectedChannelIds, setSelectedChannelIds] = useState<number[]>([]);
  const [testnet, setTestnet] = useState(false);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const c = await api.getConfig();
      setConfig(c);
      setRiskUsdt(String(c.risk_usdt));
      setLeverage(String(c.leverage));
      setBybitApiKey(c.bybit_api_key || "");
      setSelectedChannelIds(c.telegram_channel_ids || []);
      setTestnet(c.testnet || false);
    } catch (err) {
      setSaveResult({ ok: false, message: `Failed to load config: ${err}` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadConfig(); }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveResult(null);
    const payload: ConfigUpdatePayload = {};
    if (bybitApiKey.trim()) payload.bybit_api_key = bybitApiKey.trim();
    if (bybitSecret.trim()) payload.bybit_api_secret = bybitSecret.trim();
    if (openaiKey.trim()) payload.openai_api_key = openaiKey.trim();
    const parsedRisk = parseFloat(riskUsdt);
    if (!isNaN(parsedRisk) && parsedRisk > 0) payload.risk_usdt = parsedRisk;
    const parsedLev = parseInt(leverage);
    if (!isNaN(parsedLev)) payload.leverage = parsedLev;
    payload.telegram_channel_ids = selectedChannelIds;
    payload.testnet = testnet;

    try {
      const result = await api.updateConfig(payload);
      if (result.success) {
        setSaveResult({ ok: true, message: "Configuration saved successfully." });
        setConfig(result.config);
        setBybitSecret("");
        setOpenaiKey("");
      } else {
        setSaveResult({ ok: false, message: "Save failed" });
      }
    } catch (err) {
      setSaveResult({ ok: false, message: `Save failed: ${err}` });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-mono">
      <div className="pointer-events-none fixed inset-0 z-50 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.025)_50%)] bg-[length:100%_4px]" />
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-[#09090b]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="relative rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-2">
              <TrendingUp size={18} className="text-indigo-400" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-wider text-zinc-100">SIGNAL TRADER</div>
              <div className="text-[10px] tracking-widest text-zinc-500 uppercase">Configuration</div>
            </div>
          </div>
          <nav className="flex items-center gap-2">
            <Link href="/dashboard" className="flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-xs text-zinc-400 hover:border-zinc-600 hover:text-zinc-300">
              <Activity size={13} /> Dashboard
            </Link>
            <Link href="/settings" className="flex items-center gap-2 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-xs text-indigo-400">
              <Settings size={13} /> Settings
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 p-6">
        {saveResult && (
          <div className={`flex items-center gap-3 rounded-xl border px-5 py-4 text-sm ${saveResult.ok ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-red-500/30 bg-red-500/10 text-red-400"}`}>
            {saveResult.ok ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span className="font-mono text-xs">{saveResult.message}</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex items-center gap-3 text-zinc-500">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm">Loading configuration...</span>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <SectionCard title="BYBIT EXCHANGE" description="API credentials for Bybit Futures. Secrets are AES-256 encrypted at rest." accent="emerald">
              <SecretField label="API Key" placeholder="e.g. xxxxxxxxxxxxxxxxxxx" value={bybitApiKey} onChange={setBybitApiKey} isSet={!!config?.bybit_api_key} />
              <SecretField label="API Secret" placeholder="Leave blank to keep current secret" value={bybitSecret} onChange={setBybitSecret} isSet={config?.bybit_api_secret_set} hint="Encrypted with AES-256 before storage." />
              <div className="grid grid-cols-2 gap-4">
                <TextField label="Risk Per Trade (USDT)" placeholder="10" value={riskUsdt} onChange={setRiskUsdt} type="number" min={1} max={10000} icon={DollarSign} hint="Max loss per trade in USDT" />
                <TextField label="Default Leverage" placeholder="10" value={leverage} onChange={setLeverage} type="number" min={1} max={125} icon={Hash} hint="1x–125x" />
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-zinc-700/50 bg-zinc-900/40 px-4 py-3">
                <label className="flex flex-1 cursor-pointer items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 font-mono text-xs text-zinc-300">
                      <FlaskConical size={13} className="text-amber-400" /> Testnet Mode
                    </div>
                    <p className="mt-0.5 font-mono text-[11px] text-zinc-600">Use Bybit paper trading environment</p>
                  </div>
                  <div className={`relative h-5 w-9 cursor-pointer rounded-full transition-colors ${testnet ? "bg-amber-500/70" : "bg-zinc-700"}`} onClick={() => setTestnet(t => !t)}>
                    <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${testnet ? "translate-x-4" : "translate-x-0.5"}`} />
                  </div>
                </label>
              </div>
            </SectionCard>

            <SectionCard title="OPENAI INTEGRATION" description="GPT-4o Mini parses unstructured Telegram signals into structured JSON." accent="indigo">
              <SecretField label="OpenAI API Key" placeholder="sk-..." value={openaiKey} onChange={setOpenaiKey} isSet={config?.openai_api_key_set} hint="Requires gpt-4o-mini access. Encrypted at rest." />
            </SectionCard>

            <SectionCard title="TELEGRAM CHANNELS" description="Select which channels to monitor for trading signals." accent="violet">
              <ChannelSelector selectedIds={selectedChannelIds} onChange={setSelectedChannelIds} />
            </SectionCard>

            <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/60 px-6 py-4">
              <div className="font-mono text-[11px] text-zinc-600">Changes are encrypted and applied to the VM in real-time</div>
              <div className="flex gap-3">
                <button onClick={loadConfig} className="flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2.5 text-xs text-zinc-400 hover:border-zinc-600 hover:text-zinc-300">
                  <RefreshCw size={12} /> Reload
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-2 rounded-lg border border-indigo-500/40 bg-indigo-500/15 px-6 py-2.5 text-xs text-indigo-300 hover:bg-indigo-500/25 disabled:opacity-50">
                  {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                  {saving ? "Saving..." : "Save Configuration"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
