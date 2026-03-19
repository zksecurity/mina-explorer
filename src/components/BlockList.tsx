"use client";

import Link from "next/link";
import { useNetwork } from "./NetworkContext";
import { usePolling } from "@/hooks/usePolling";
import { getBlocks, BlockSummary } from "@/lib/graphql";
import { truncate, timeAgo } from "@/lib/format";

export function BlockList() {
  const { network, networkId } = useNetwork();
  const { data: blocks, error, loading } = usePolling(
    () => getBlocks(network, 15),
    10_000,
    networkId
  );

  return (
    <div className="rounded-xl bg-zinc-800/50 border border-zinc-700/50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700/50">
        <h2 className="text-sm font-semibold text-white">Latest Blocks</h2>
        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" title="Live" />
      </div>

      {loading && !blocks ? (
        <div className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse h-12 rounded bg-zinc-700/50" />
          ))}
        </div>
      ) : error ? (
        <div className="p-4 text-red-400 text-sm">{error}</div>
      ) : (
        <div className="divide-y divide-zinc-700/30">
          {(blocks ?? []).slice().reverse().map((block: BlockSummary) => {
            const height = block.protocolState.consensusState.blockHeight;
            const txCount =
              block.transactions.userCommands.length +
              block.transactions.zkappCommands.length;
            return (
              <Link
                key={block.stateHash}
                href={`/block/${block.stateHash}?network=${networkId}`}
                className="flex items-center gap-4 px-4 py-3 hover:bg-zinc-700/30 transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500 text-sm font-bold">
                  {height}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white font-mono">{truncate(block.stateHash, 12)}</div>
                  <div className="text-xs text-zinc-500">
                    Creator: {truncate(block.creator, 6)} &middot; {txCount} tx{txCount !== 1 ? "s" : ""}
                  </div>
                </div>
                <div className="text-xs text-zinc-500 whitespace-nowrap">
                  {timeAgo(Number(block.protocolState.blockchainState.utcDate))}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
