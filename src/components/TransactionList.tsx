"use client";

import Link from "next/link";
import { useNetwork } from "./NetworkContext";
import { usePolling } from "@/hooks/usePolling";
import { getBlocks, UserCommand, ZkAppCommand } from "@/lib/graphql";
import { truncate, nanoToMina } from "@/lib/format";

interface FlatTx {
  hash: string;
  type: "payment" | "delegation" | "zkapp";
  from: string;
  to: string;
  amount: string;
  fee: string;
}

function flattenTxs(blocks: ReturnType<typeof getBlocks> extends Promise<infer R> ? R : never): FlatTx[] {
  const txs: FlatTx[] = [];
  for (const block of blocks) {
    for (const cmd of block.transactions.userCommands) {
      txs.push({
        hash: cmd.hash,
        type: cmd.kind === "STAKE_DELEGATION" ? "delegation" : "payment",
        from: cmd.from,
        to: cmd.to,
        amount: cmd.amount,
        fee: cmd.fee,
      });
    }
    for (const zk of block.transactions.zkappCommands) {
      txs.push({
        hash: zk.hash,
        type: "zkapp",
        from: zk.zkappCommand.feePayer.body.publicKey,
        to: zk.zkappCommand.accountUpdates[0]?.body.publicKey ?? "",
        amount: "0",
        fee: zk.zkappCommand.feePayer.body.fee,
      });
    }
  }
  return txs;
}

const typeBadge: Record<string, string> = {
  payment: "bg-blue-500/20 text-blue-400",
  delegation: "bg-purple-500/20 text-purple-400",
  zkapp: "bg-emerald-500/20 text-emerald-400",
};

export function TransactionList() {
  const { network, networkId } = useNetwork();
  const { data: blocks, error, loading } = usePolling(
    () => getBlocks(network, 15),
    10_000,
    networkId
  );

  const txs = blocks ? flattenTxs(blocks).slice(0, 20) : [];

  return (
    <div className="rounded-xl bg-zinc-800/50 border border-zinc-700/50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700/50">
        <h2 className="text-sm font-semibold text-white">Recent Transactions</h2>
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
      ) : txs.length === 0 ? (
        <div className="p-4 text-zinc-500 text-sm">No recent transactions</div>
      ) : (
        <div className="divide-y divide-zinc-700/30">
          {txs.map((tx) => (
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
              {tx.type !== "zkapp" && tx.amount !== "0" && (
                <div className="text-sm text-white font-mono whitespace-nowrap">
                  {nanoToMina(tx.amount)} MINA
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
