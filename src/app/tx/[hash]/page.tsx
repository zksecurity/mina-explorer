"use client";

import { use } from "react";
import Link from "next/link";
import { useNetwork } from "@/components/NetworkContext";
import { usePolling } from "@/hooks/usePolling";
import { getBlocks, UserCommand, ZkAppCommand, findInMempool, TransactionInPool } from "@/lib/graphql";
import { truncate, nanoToMina } from "@/lib/format";

interface TxResult {
  status: "confirmed" | "pending";
  type: "user" | "zkapp";
  userCommand?: UserCommand;
  pooledUserCommand?: TransactionInPool;
  zkappCommand?: ZkAppCommand;
  blockHash?: string;
  blockHeight?: string;
}

async function findTx(network: Parameters<typeof getBlocks>[0], hash: string): Promise<TxResult | null> {
  // Check confirmed blocks first
  const blocks = await getBlocks(network, 50);
  for (const block of blocks) {
    for (const cmd of block.transactions.userCommands) {
      if (cmd.hash === hash) {
        return {
          status: "confirmed",
          type: "user",
          userCommand: cmd,
          blockHash: block.stateHash,
          blockHeight: block.protocolState.consensusState.blockHeight,
        };
      }
    }
    for (const zk of block.transactions.zkappCommands) {
      if (zk.hash === hash) {
        return {
          status: "confirmed",
          type: "zkapp",
          zkappCommand: zk,
          blockHash: block.stateHash,
          blockHeight: block.protocolState.consensusState.blockHeight,
        };
      }
    }
  }

  // Check mempool
  const pooled = await findInMempool(network, hash);
  if (pooled) {
    return {
      status: "pending",
      type: pooled.type,
      pooledUserCommand: pooled.userCommand,
      zkappCommand: pooled.zkappCommand,
    };
  }

  return null;
}

export default function TxPage({ params }: { params: Promise<{ hash: string }> }) {
  const { hash } = use(params);
  const { network, networkId } = useNetwork();
  const { data: tx, error, loading } = usePolling(
    () => findTx(network, hash),
    30_000,
    `${networkId}:${hash}`
  );

  if (loading && !tx) {
    return <div className="animate-pulse space-y-4"><div className="h-8 w-64 bg-zinc-800 rounded" /><div className="h-48 bg-zinc-800 rounded-xl" /></div>;
  }

  if (error) {
    return <div className="rounded-xl bg-red-900/30 border border-red-800 p-4 text-red-400">{error}</div>;
  }

  if (!tx) {
    return <div className="text-zinc-500">Transaction not found in recent blocks or mempool.</div>;
  }

  const statusBadge = tx.status === "pending" ? (
    <span className="rounded px-2 py-0.5 text-xs font-medium bg-yellow-500/20 text-yellow-400 animate-pulse">Pending (Mempool)</span>
  ) : (
    <span className="rounded px-2 py-0.5 text-xs font-medium bg-green-500/20 text-green-400">Confirmed</span>
  );

  if (tx.type === "user" && (tx.userCommand || tx.pooledUserCommand)) {
    const cmd = tx.userCommand ?? tx.pooledUserCommand!;
    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">Transaction</h1>
            {statusBadge}
          </div>
          <p className="text-sm text-zinc-500 font-mono mt-1 break-all">{cmd.hash}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            ["Type", cmd.kind],
            ...(tx.status === "confirmed" ? [["Block", `#${tx.blockHeight}`]] : []),
            ["From", cmd.from],
            ["To", cmd.to],
            ["Amount", `${nanoToMina(cmd.amount)} MINA`],
            ["Fee", `${nanoToMina(cmd.fee)} MINA`],
            ["Nonce", cmd.nonce.toString()],
            ["Memo", cmd.memo || "(none)"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg bg-zinc-800/50 border border-zinc-700/50 p-3">
              <div className="text-xs text-zinc-500 uppercase">{label}</div>
              <div className="mt-1 text-sm text-white font-mono break-all">
                {label === "From" || label === "To" ? (
                  <Link href={`/account/${value}?network=${networkId}`} className="text-orange-400 hover:underline">{value}</Link>
                ) : label === "Block" && tx.blockHash ? (
                  <Link href={`/block/${tx.blockHash}?network=${networkId}`} className="text-orange-400 hover:underline">{value}</Link>
                ) : (
                  value
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (tx.type === "zkapp" && tx.zkappCommand) {
    const zk = tx.zkappCommand;
    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">zkApp Transaction</h1>
            {statusBadge}
            {zk.failureReason && <span className="rounded px-2 py-0.5 text-xs font-medium bg-red-500/20 text-red-400">Failed</span>}
          </div>
          <p className="text-sm text-zinc-500 font-mono mt-1 break-all">{zk.hash}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tx.status === "confirmed" && tx.blockHash && (
            <div className="rounded-lg bg-zinc-800/50 border border-zinc-700/50 p-3">
              <div className="text-xs text-zinc-500 uppercase">Block</div>
              <div className="mt-1 text-sm font-mono">
                <Link href={`/block/${tx.blockHash}?network=${networkId}`} className="text-orange-400 hover:underline">#{tx.blockHeight}</Link>
              </div>
            </div>
          )}
          <div className="rounded-lg bg-zinc-800/50 border border-zinc-700/50 p-3">
            <div className="text-xs text-zinc-500 uppercase">Fee Payer</div>
            <div className="mt-1 text-sm font-mono">
              <Link href={`/account/${zk.zkappCommand.feePayer.body.publicKey}?network=${networkId}`} className="text-orange-400 hover:underline">
                {truncate(zk.zkappCommand.feePayer.body.publicKey, 10)}
              </Link>
            </div>
          </div>
          <div className="rounded-lg bg-zinc-800/50 border border-zinc-700/50 p-3">
            <div className="text-xs text-zinc-500 uppercase">Fee</div>
            <div className="mt-1 text-sm text-white font-mono">{nanoToMina(zk.zkappCommand.feePayer.body.fee)} MINA</div>
          </div>
          <div className="rounded-lg bg-zinc-800/50 border border-zinc-700/50 p-3">
            <div className="text-xs text-zinc-500 uppercase">Memo</div>
            <div className="mt-1 text-sm text-white font-mono">{zk.zkappCommand.memo || "(none)"}</div>
          </div>
        </div>

        {zk.failureReason && (
          <div className="rounded-xl bg-red-900/20 border border-red-800/50 p-4">
            <h2 className="text-sm font-semibold text-red-400 mb-2">Failure Reasons</h2>
            {zk.failureReason.map((fr, i) => (
              <div key={i} className="text-sm text-red-300">
                [{fr.index}] {fr.failures.join(", ")}
              </div>
            ))}
          </div>
        )}

        <div className="rounded-xl bg-zinc-800/50 border border-zinc-700/50 overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-700/50">
            <h2 className="text-sm font-semibold text-white">Account Updates ({zk.zkappCommand.accountUpdates.length})</h2>
          </div>
          <div className="divide-y divide-zinc-700/30">
            {zk.zkappCommand.accountUpdates.map((au, i) => (
              <div key={i} className="px-4 py-3">
                <div className="text-sm">
                  <Link href={`/account/${au.body.publicKey}?network=${networkId}`} className="text-orange-400 hover:underline font-mono">
                    {truncate(au.body.publicKey, 10)}
                  </Link>
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  Balance change: <span className={au.body.balanceChange.sgn === "Positive" ? "text-green-400" : "text-red-400"}>
                    {au.body.balanceChange.sgn === "Positive" ? "+" : "-"}{nanoToMina(au.body.balanceChange.magnitude)} MINA
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
