import { NetworkConfig } from "./networks";

function getRosettaUrl(network: NetworkConfig, path: string): string {
  if (typeof window !== "undefined") {
    return `/api/rosetta?network=${network.id}&path=${encodeURIComponent(path)}`;
  }
  return `${network.rosettaUrl}${path}`;
}

async function rosettaPost<T>(network: NetworkConfig, path: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(getRosettaUrl(network, path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Rosetta ${path} failed: ${res.status} ${text}`);
  }

  return res.json() as Promise<T>;
}

function networkIdentifier(network: NetworkConfig) {
  const name = network.id === "mainnet" ? "mina" : network.id === "devnet" ? "devnet" : "debug";
  return { blockchain: "mina", network: name };
}

export interface NetworkStatus {
  current_block_identifier: { index: number; hash: string };
  current_block_timestamp: number;
  genesis_block_identifier: { index: number; hash: string };
  oldest_block_identifier: { index: number; hash: string };
  sync_status: { current_index: number; target_index: number; stage: string };
  peers: { peer_id: string }[];
}

export async function getNetworkStatus(network: NetworkConfig): Promise<NetworkStatus> {
  return rosettaPost<NetworkStatus>(network, "/network/status", {
    network_identifier: networkIdentifier(network),
  });
}

export interface RosettaBlock {
  block_identifier: { index: number; hash: string };
  parent_block_identifier: { index: number; hash: string };
  timestamp: number;
  transactions: RosettaTransaction[];
}

export interface RosettaTransaction {
  transaction_identifier: { hash: string };
  operations: {
    operation_identifier: { index: number };
    type: string;
    status: string;
    account: { address: string } | null;
    amount: { value: string; currency: { symbol: string } } | null;
  }[];
}

export async function getRosettaBlock(
  network: NetworkConfig,
  identifier: { index?: number; hash?: string }
): Promise<RosettaBlock> {
  const data = await rosettaPost<{ block: RosettaBlock }>(network, "/block", {
    network_identifier: networkIdentifier(network),
    block_identifier: identifier,
  });
  return data.block;
}

export async function getRosettaAccountBalance(
  network: NetworkConfig,
  address: string
): Promise<{ balances: { value: string; currency: { symbol: string } }[] }> {
  return rosettaPost(network, "/account/balance", {
    network_identifier: networkIdentifier(network),
    account_identifier: { address },
  });
}
