"use client";

import Link from "next/link";
import { useNetwork } from "./NetworkContext";
import { usePolling } from "@/hooks/usePolling";
import { getPooledTransactions, getPooledZkAppCommands, TransactionInPool, ZkAppCommand } from "@/lib/graphql";
import { truncate, nanoToMina } from "@/lib/format";

interface MempoolEntry {
  hash: string;
  type: "payment" | "delegation" | "zkapp";
  from: string;
  to: string;
  fee: string;
  amount: string;
}

export function MempoolList() {
  const { network, networkId } = useNetwork();
  const { data: userCmds, error: userErr, loading: userLoading } = usePolling(
    () => getPooledTransactions(network),
    10_000,
    `${networkId}:mempool:user`
  );
  const { data: zkCmds, error: zkErr, loading: zkLoading } = usePolling(
    () => getPooledZkAppCommands(network),
    10_000,
    `${networkId}:mempool:zk`
  );

  const loading = userLoading || zkLoading;
  const error = userErr || zkErr;

  const entries: MempoolEntry[] = [];
  if (userCmds) {
    for (const cmd of userCmds) {
      entries.push({
        hash: cmd.hash,
        type: cmd.kind === "STAKE_DELEGATION" ? "delegation" : "payment",
        from: cmd.from,
        to: cmd.to,
        fee: cmd.fee,
        amount: cmd.amount,
      });
    }
  }
  if (zkCmds) {
    for (const zk of zkCmds) {
      entries.push({
        hash: zk.hash,
        type: "zkapp",
        from: zk.zkappCommand.feePayer.body.publicKey,
        to: zk.zkappCommand.accountUpdates[0]?.body.publicKey ?? "",
        fee: zk.zkappCommand.feePayer.body.fee,
        amount: "0",
      });
    }
  }

  const typeBadge: Record<string, string> = {
    payment: "bg-blue-500/20 text-blue-400",
    delegation: "bg-purple-500/20 text-purple-400",
    zkapp: "bg-emerald-500/20 text-emerald-400",
  };

  return (
    <div className="rounded-xl bg-zinc-800/50 border border-zinc-700/50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700/50">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-white">Mempool</h2>
          <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-yellow-500/20 text-yellow-400">
            {entries.length} pending
          </span>
        </div>
        <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" title="Live" />
      </div>

      {loading && !userCmds && !zkCmds ? (
        <div className="p-4 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse h-12 rounded bg-zinc-700/50" />
          ))}
        </div>
      ) : error ? (
        <div className="p-4 text-red-400 text-sm">{error}</div>
      ) : entries.length === 0 ? (
        <div className="p-4 text-zinc-500 text-sm">No pending transactions</div>
      ) : (
        <div className="divide-y divide-zinc-700/30 max-h-96 overflow-y-auto">
          {entries.map((tx) => (
            <Link
              key={tx.hash}
              href={`/tx/${tx.hash}?network=${networkId}`}
              className="flex items-center gap-4 px-4 py-3 hover:bg-zinc-700/30 transition-colors"
            >
              <span className={`rounded px-2 py-0.5 text-xs font-medium ${typeBadge[tx.type] ?? ""}`}>
                {tx.type}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white font-mono">{truncate(tx.hash, 10)}</div>
                <div className="text-xs text-zinc-500">
                  {truncate(tx.from, 6)} &rarr; {tx.to ? truncate(tx.to, 6) : "..."}
                </div>
              </div>
              <div className="text-right shrink-0">
                {tx.type !== "zkapp" && tx.amount !== "0" && (
                  <div className="text-sm text-white font-mono whitespace-nowrap">
                    {nanoToMina(tx.amount)} MINA
                  </div>
                )}
                <div className="text-xs text-zinc-500">Fee: {nanoToMina(tx.fee)}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
