"use client";

import { use } from "react";
import Link from "next/link";
import { useNetwork } from "@/components/NetworkContext";
import { usePolling } from "@/hooks/usePolling";
import { getBlock } from "@/lib/graphql";
import { truncate, nanoToMina, formatTime } from "@/lib/format";

export default function BlockPage({ params }: { params: Promise<{ hash: string }> }) {
  const { hash } = use(params);
  const { network, networkId } = useNetwork();
  const { data: block, error, loading } = usePolling(
    () => getBlock(network, hash),
    30_000,
    `${networkId}:${hash}`
  );

  if (loading && !block) {
    return <div className="animate-pulse space-y-4"><div className="h-8 w-64 bg-zinc-800 rounded" /><div className="h-64 bg-zinc-800 rounded-xl" /></div>;
  }

  if (error) {
    return <div className="rounded-xl bg-red-900/30 border border-red-800 p-4 text-red-400">{error}</div>;
  }

  if (!block) {
    return <div className="text-zinc-500">Block not found</div>;
  }

  const cs = block.protocolState.consensusState;
  const userCmds = block.transactions.userCommands;
  const zkCmds = block.transactions.zkappCommands;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Block #{cs.blockHeight}</h1>
        <p className="text-sm text-zinc-500 font-mono mt-1 break-all">{block.stateHash}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          ["Height", cs.blockHeight],
          ["Slot", cs.slotSinceGenesis],
          ["Epoch", cs.epoch],
          ["Time", formatTime(Number(block.protocolState.blockchainState.utcDate))],
          ["Creator", block.creator],
          ["Previous Hash", block.protocolState.previousStateHash],
          ["User Txs", userCmds.length.toString()],
          ["zkApp Txs", zkCmds.length.toString()],
          ["SNARK Jobs", block.snarkJobs.length.toString()],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg bg-zinc-800/50 border border-zinc-700/50 p-3">
            <div className="text-xs text-zinc-500 uppercase">{label}</div>
            <div className="mt-1 text-sm text-white font-mono break-all">
              {label === "Creator" ? (
                <Link href={`/account/${value}?network=${networkId}`} className="text-orange-400 hover:underline">{value}</Link>
              ) : label === "Previous Hash" ? (
                <Link href={`/block/${value}?network=${networkId}`} className="text-orange-400 hover:underline">{truncate(value as string, 16)}</Link>
              ) : (
                value
              )}
            </div>
          </div>
        ))}
      </div>

      {userCmds.length > 0 && (
        <div className="rounded-xl bg-zinc-800/50 border border-zinc-700/50 overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-700/50">
            <h2 className="text-sm font-semibold text-white">User Commands</h2>
          </div>
          <div className="divide-y divide-zinc-700/30">
            {userCmds.map((tx) => (
              <div key={tx.hash} className="flex items-center gap-4 px-4 py-3">
                <span className="rounded px-2 py-0.5 text-xs font-medium bg-blue-500/20 text-blue-400">
                  {tx.kind}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white font-mono">{truncate(tx.hash, 10)}</div>
                  <div className="text-xs text-zinc-500">
                    <Link href={`/account/${tx.from}?network=${networkId}`} className="text-orange-400 hover:underline">{truncate(tx.from, 6)}</Link>
                    {" → "}
                    <Link href={`/account/${tx.to}?network=${networkId}`} className="text-orange-400 hover:underline">{truncate(tx.to, 6)}</Link>
                  </div>
                </div>
                <div className="text-sm text-white font-mono">{nanoToMina(tx.amount)} MINA</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {zkCmds.length > 0 && (
        <div className="rounded-xl bg-zinc-800/50 border border-zinc-700/50 overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-700/50">
            <h2 className="text-sm font-semibold text-white">zkApp Commands</h2>
          </div>
          <div className="divide-y divide-zinc-700/30">
            {zkCmds.map((zk) => (
              <div key={zk.hash} className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="rounded px-2 py-0.5 text-xs font-medium bg-emerald-500/20 text-emerald-400">zkApp</span>
                  <span className="text-sm text-white font-mono">{truncate(zk.hash, 10)}</span>
                  {zk.failureReason && (
                    <span className="rounded px-2 py-0.5 text-xs font-medium bg-red-500/20 text-red-400">Failed</span>
                  )}
                </div>
                <div className="mt-1 text-xs text-zinc-500">
                  Fee payer: <Link href={`/account/${zk.zkappCommand.feePayer.body.publicKey}?network=${networkId}`} className="text-orange-400 hover:underline">
                    {truncate(zk.zkappCommand.feePayer.body.publicKey, 6)}
                  </Link>
                  {" · "}Fee: {nanoToMina(zk.zkappCommand.feePayer.body.fee)} MINA
                  {" · "}{zk.zkappCommand.accountUpdates.length} account update(s)
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
