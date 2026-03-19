"use client";

import { useNetwork } from "./NetworkContext";
import { usePolling } from "@/hooks/usePolling";
import { getDaemonStatus } from "@/lib/graphql";
import { formatUptime } from "@/lib/format";

export function StatusCards() {
  const { network, networkId } = useNetwork();
  const { data: status, error, loading } = usePolling(
    () => getDaemonStatus(network),
    10_000,
    networkId
  );

  if (loading && !status) {
    return <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="animate-pulse rounded-xl bg-zinc-800 h-24" />
    ))}</div>;
  }

  if (error) {
    return <div className="rounded-xl bg-red-900/30 border border-red-800 p-4 text-red-400 text-sm">{error}</div>;
  }

  if (!status) return null;

  const cards = [
    { label: "Sync Status", value: status.syncStatus ?? "—", highlight: status.syncStatus === "SYNCED" },
    { label: "Block Height", value: status.blockchainLength?.toLocaleString() ?? "—" },
    { label: "Epoch / Slot", value: status.globalSlotSinceGenesisBestTip != null ? `${Math.floor(status.globalSlotSinceGenesisBestTip / 7140)} / ${status.globalSlotSinceGenesisBestTip}` : "—" },
    { label: "Peers", value: (status.peers?.length ?? 0).toString() },
    { label: "Uptime", value: status.uptimeSecs != null ? formatUptime(status.uptimeSecs) : "—" },
    { label: "Highest Received", value: status.highestBlockLengthReceived?.toLocaleString() ?? "—" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl bg-zinc-800/50 border border-zinc-700/50 p-4">
          <div className="text-xs text-zinc-500 uppercase tracking-wide">{c.label}</div>
          <div className={`mt-1 text-lg font-semibold ${c.highlight ? "text-green-400" : "text-white"}`}>
            {c.value}
          </div>
        </div>
      ))}
    </div>
  );
}
