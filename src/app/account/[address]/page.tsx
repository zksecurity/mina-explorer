"use client";

import { use } from "react";
import { useNetwork } from "@/components/NetworkContext";
import { usePolling } from "@/hooks/usePolling";
import { getAccount, getAccountTransactions, getAccountPendingTxs, AccountTransaction } from "@/lib/graphql";
import { nanoToMina, truncate, timeAgo } from "@/lib/format";
import Link from "next/link";

export default function AccountPage({ params }: { params: Promise<{ address: string }> }) {
  const { address } = use(params);
  const { network, networkId } = useNetwork();
  const { data: account, error, loading } = usePolling(
    () => getAccount(network, address),
    15_000,
    `${networkId}:${address}`
  );
  const { data: txs, error: txError, loading: txLoading } = usePolling(
    () => getAccountTransactions(network, address),
    15_000,
    `${networkId}:${address}:txs`
  );
  const { data: pendingTxs } = usePolling(
    () => getAccountPendingTxs(network, address),
    10_000,
    `${networkId}:${address}:pending`
  );

  if (loading && !account) {
    return <div className="animate-pulse space-y-4"><div className="h-8 w-64 bg-zinc-800 rounded" /><div className="h-48 bg-zinc-800 rounded-xl" /></div>;
  }

  if (error) {
    return <div className="rounded-xl bg-red-900/30 border border-red-800 p-4 text-red-400">{error}</div>;
  }

  if (!account) {
    return <div className="text-zinc-500">Account not found</div>;
  }

  const isZkApp = account.zkappState && account.zkappState.some((s) => s !== "0");

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-white">Account</h1>
          {isZkApp && <span className="rounded px-2 py-0.5 text-xs font-medium bg-emerald-500/20 text-emerald-400">zkApp</span>}
        </div>
        <p className="text-sm text-zinc-500 font-mono mt-1 break-all">{account.publicKey}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl bg-zinc-800/50 border border-zinc-700/50 p-4">
          <div className="text-xs text-zinc-500 uppercase">Balance</div>
          <div className="mt-1 text-2xl font-bold text-white">{nanoToMina(account.balance.total)} <span className="text-sm text-zinc-500">MINA</span></div>
        </div>
        <div className="rounded-xl bg-zinc-800/50 border border-zinc-700/50 p-4">
          <div className="text-xs text-zinc-500 uppercase">Nonce</div>
          <div className="mt-1 text-2xl font-bold text-white">{account.nonce}</div>
        </div>
        <div className="rounded-xl bg-zinc-800/50 border border-zinc-700/50 p-4">
          <div className="text-xs text-zinc-500 uppercase">Delegate</div>
          <div className="mt-1 text-sm text-white font-mono break-all">
            {account.delegate === account.publicKey ? (
              <span className="text-zinc-500">Self</span>
            ) : (
              <Link href={`/account/${account.delegate}?network=${networkId}`} className="text-orange-400 hover:underline">
                {truncate(account.delegate, 10)}
              </Link>
            )}
          </div>
        </div>
      </div>

      {account.zkappState && account.zkappState.some((s) => s !== "0") && (
        <div className="rounded-xl bg-zinc-800/50 border border-zinc-700/50 overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-700/50">
            <h2 className="text-sm font-semibold text-white">zkApp State</h2>
          </div>
          <div className="p-4 space-y-2">
            {account.zkappState.map((state, i) => (
              <div key={i} className="flex gap-2 text-sm">
                <span className="text-zinc-500 w-8 shrink-0">[{i}]</span>
                <span className="text-white font-mono break-all">{state}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {account.actionState && account.actionState.some((s) => s !== "0") && (
        <div className="rounded-xl bg-zinc-800/50 border border-zinc-700/50 overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-700/50">
            <h2 className="text-sm font-semibold text-white">Action State</h2>
          </div>
          <div className="p-4 space-y-2">
            {account.actionState.map((state, i) => (
              <div key={i} className="flex gap-2 text-sm">
                <span className="text-zinc-500 w-8 shrink-0">[{i}]</span>
                <span className="text-white font-mono break-all">{state}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {pendingTxs && pendingTxs.length > 0 && (
        <div className="rounded-xl bg-zinc-800/50 border border-yellow-700/50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-yellow-700/50">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white">Pending in Mempool</h2>
              <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-yellow-500/20 text-yellow-400 animate-pulse">
                {pendingTxs.length}
              </span>
            </div>
          </div>
          <div className="divide-y divide-zinc-700/30">
            {pendingTxs.map((tx: AccountTransaction) => (
              <Link
                key={tx.hash}
                href={`/tx/${tx.hash}?network=${networkId}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-700/30 transition-colors"
              >
                <div className="flex flex-col items-center gap-1">
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${
                    tx.type === "zkapp" ? "bg-emerald-500/20 text-emerald-400" :
                    tx.type === "delegation" ? "bg-purple-500/20 text-purple-400" :
                    "bg-blue-500/20 text-blue-400"
                  }`}>
                    {tx.type}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white font-mono">{truncate(tx.hash, 10)}</div>
                  <div className="text-xs text-zinc-500">
                    {tx.direction === "sent" ? "To: " : "From: "}
                    {tx.direction === "sent" ? truncate(tx.to, 6) : truncate(tx.from, 6)}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {tx.type !== "zkapp" && tx.amount !== "0" && (
                    <div className="text-sm font-mono text-white">
                      {tx.direction === "received" ? "+" : "-"}{nanoToMina(tx.amount)} MINA
                    </div>
                  )}
                  <div className="text-xs text-yellow-400">pending</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl bg-zinc-800/50 border border-zinc-700/50 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700/50">
          <h2 className="text-sm font-semibold text-white">Recent Transactions</h2>
          <span className="text-xs text-zinc-500">Last 50 blocks</span>
        </div>
        {txLoading && !txs ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse h-12 rounded bg-zinc-700/50" />
            ))}
          </div>
        ) : txError ? (
          <div className="p-4 text-red-400 text-sm">{txError}</div>
        ) : !txs || txs.length === 0 ? (
          <div className="p-4 text-zinc-500 text-sm">No transactions found in recent blocks</div>
        ) : (
          <div className="divide-y divide-zinc-700/30">
            {txs.map((tx: AccountTransaction) => (
              <Link
                key={tx.hash}
                href={`/tx/${tx.hash}?network=${networkId}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-700/30 transition-colors"
              >
                <div className="flex flex-col items-center gap-1">
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${
                    tx.type === "zkapp" ? "bg-emerald-500/20 text-emerald-400" :
                    tx.type === "delegation" ? "bg-purple-500/20 text-purple-400" :
                    "bg-blue-500/20 text-blue-400"
                  }`}>
                    {tx.type}
                  </span>
                  {tx.failed && <span className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-red-500/20 text-red-400">failed</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white font-mono">{truncate(tx.hash, 10)}</div>
                  <div className="text-xs text-zinc-500">
                    {tx.direction === "sent" ? "To: " : tx.direction === "received" ? "From: " : "Self: "}
                    {tx.direction === "sent"
                      ? truncate(tx.to, 6)
                      : tx.direction === "received"
                      ? truncate(tx.from, 6)
                      : truncate(tx.from, 6)}
                    {" · Block #"}{tx.blockHeight}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {tx.type !== "zkapp" && tx.amount !== "0" && (
                    <div className={`text-sm font-mono ${tx.direction === "received" ? "text-green-400" : "text-white"}`}>
                      {tx.direction === "received" ? "+" : "-"}{nanoToMina(tx.amount)} MINA
                    </div>
                  )}
                  <div className="text-xs text-zinc-500">{timeAgo(tx.timestamp)}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
