import { NetworkConfig } from "./networks";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

function getGraphqlUrl(network: NetworkConfig): string {
  // In the browser, proxy through our API route to avoid CORS
  if (typeof window !== "undefined") {
    return `${basePath}/api/graphql?network=${network.id}`;
  }
  return network.graphqlUrl;
}

async function gql<T>(network: NetworkConfig, query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(getGraphqlUrl(network), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`GraphQL request failed: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  if (json.errors) {
    throw new Error(json.errors.map((e: { message: string }) => e.message).join(", "));
  }
  return json.data as T;
}

// --------------- Queries ---------------

export interface DaemonStatus {
  syncStatus: string;
  blockchainLength: number;
  highestBlockLengthReceived: number;
  uptimeSecs: number;
  numAccounts: number;
  globalSlotSinceGenesisBestTip: number;
  peers: { peerId: string }[];
}

export async function getDaemonStatus(network: NetworkConfig): Promise<DaemonStatus> {
  const data = await gql<{ daemonStatus: DaemonStatus }>(
    network,
    `query {
      daemonStatus {
        syncStatus
        blockchainLength
        highestBlockLengthReceived
        uptimeSecs
        numAccounts
        globalSlotSinceGenesisBestTip
        peers { peerId }
      }
    }`
  );
  return data.daemonStatus;
}

export interface BlockSummary {
  stateHash: string;
  protocolState: {
    blockchainState: {
      utcDate: string;
    };
    consensusState: {
      blockHeight: string;
      slotSinceGenesis: string;
      epoch: string;
    };
    previousStateHash: string;
  };
  creator: string;
  snarkJobs: unknown[];
  transactions: {
    userCommands: UserCommand[];
    zkappCommands: ZkAppCommand[];
  };
}

export interface UserCommand {
  hash: string;
  kind: string;
  from: string;
  to: string;
  amount: string;
  fee: string;
  memo: string;
  nonce: number;
}

export interface ZkAppCommand {
  hash: string;
  failureReason: { index: string; failures: string[] }[] | null;
  zkappCommand: {
    memo: string;
    feePayer: {
      body: {
        publicKey: string;
        fee: string;
      };
    };
    accountUpdates: {
      body: {
        publicKey: string;
        balanceChange: { magnitude: string; sgn: string };
      };
    }[];
  };
}

export async function getBlocks(network: NetworkConfig, limit: number = 10): Promise<BlockSummary[]> {
  const data = await gql<{ bestChain: BlockSummary[] }>(
    network,
    `query($limit: Int) {
      bestChain(maxLength: $limit) {
        stateHash
        protocolState {
          blockchainState { utcDate }
          consensusState {
            blockHeight
            slotSinceGenesis
            epoch
          }
          previousStateHash
        }
        creator
        snarkJobs { prover }
        transactions {
          userCommands {
            hash kind from to amount fee memo nonce
          }
          zkappCommands {
            hash
            failureReason { index failures }
            zkappCommand {
              memo
              feePayer { body { publicKey fee } }
              accountUpdates { body { publicKey balanceChange { magnitude sgn } } }
            }
          }
        }
      }
    }`,
    { limit }
  );
  return data.bestChain ?? [];
}

export async function getBlock(network: NetworkConfig, stateHash: string): Promise<BlockSummary | null> {
  const data = await gql<{ block: BlockSummary }>(
    network,
    `query($stateHash: String!) {
      block(stateHash: $stateHash) {
        stateHash
        protocolState {
          blockchainState { utcDate }
          consensusState {
            blockHeight
            slotSinceGenesis
            epoch
          }
          previousStateHash
        }
        creator
        snarkJobs { prover }
        transactions {
          userCommands {
            hash kind from to amount fee memo nonce
          }
          zkappCommands {
            hash
            failureReason { index failures }
            zkappCommand {
              memo
              feePayer { body { publicKey fee } }
              accountUpdates { body { publicKey balanceChange { magnitude sgn } } }
            }
          }
        }
      }
    }`,
    { stateHash }
  );
  return data.block ?? null;
}

export interface Account {
  publicKey: string;
  balance: { total: string };
  nonce: string;
  delegate: string;
  zkappState: string[] | null;
  actionState: string[] | null;
}

export async function getAccount(network: NetworkConfig, publicKey: string): Promise<Account | null> {
  const data = await gql<{ account: Account | null }>(
    network,
    `query($publicKey: PublicKey!) {
      account(publicKey: $publicKey) {
        publicKey
        balance { total }
        nonce
        delegate
        zkappState
        actionState
      }
    }`,
    { publicKey }
  );
  return data.account ?? null;
}

export interface TransactionInPool {
  hash: string;
  kind: string;
  from: string;
  to: string;
  amount: string;
  fee: string;
  memo: string;
  nonce: number;
}

export interface AccountTransaction {
  hash: string;
  type: "payment" | "delegation" | "zkapp";
  from: string;
  to: string;
  amount: string;
  fee: string;
  memo: string;
  blockHeight: string;
  timestamp: number;
  direction: "sent" | "received" | "self";
  failed: boolean;
}

export async function getAccountTransactions(
  network: NetworkConfig,
  address: string
): Promise<AccountTransaction[]> {
  const blocks = await getBlocks(network, 50);
  const txs: AccountTransaction[] = [];

  for (const block of blocks) {
    const height = block.protocolState.consensusState.blockHeight;
    const timestamp = Number(block.protocolState.blockchainState.utcDate);

    for (const cmd of block.transactions.userCommands) {
      if (cmd.from === address || cmd.to === address) {
        txs.push({
          hash: cmd.hash,
          type: cmd.kind === "STAKE_DELEGATION" ? "delegation" : "payment",
          from: cmd.from,
          to: cmd.to,
          amount: cmd.amount,
          fee: cmd.fee,
          memo: cmd.memo,
          blockHeight: height,
          timestamp,
          direction: cmd.from === address && cmd.to === address ? "self" : cmd.from === address ? "sent" : "received",
          failed: false,
        });
      }
    }

    for (const zk of block.transactions.zkappCommands) {
      const feePayer = zk.zkappCommand.feePayer.body.publicKey;
      const involvedAccounts = zk.zkappCommand.accountUpdates.map((au) => au.body.publicKey);
      if (feePayer === address || involvedAccounts.includes(address)) {
        txs.push({
          hash: zk.hash,
          type: "zkapp",
          from: feePayer,
          to: involvedAccounts[0] ?? "",
          amount: "0",
          fee: zk.zkappCommand.feePayer.body.fee,
          memo: zk.zkappCommand.memo,
          blockHeight: height,
          timestamp,
          direction: feePayer === address ? "sent" : "received",
          failed: !!zk.failureReason,
        });
      }
    }
  }

  return txs.reverse();
}

export async function getPooledTransactions(network: NetworkConfig): Promise<TransactionInPool[]> {
  const data = await gql<{ pooledUserCommands: TransactionInPool[] }>(
    network,
    `query {
      pooledUserCommands {
        hash kind from to amount fee memo nonce
      }
    }`
  );
  return data.pooledUserCommands ?? [];
}

export async function getPooledZkAppCommands(network: NetworkConfig): Promise<ZkAppCommand[]> {
  const data = await gql<{ pooledZkappCommands: ZkAppCommand[] }>(
    network,
    `query {
      pooledZkappCommands {
        hash
        failureReason { index failures }
        zkappCommand {
          memo
          feePayer { body { publicKey fee } }
          accountUpdates { body { publicKey balanceChange { magnitude sgn } } }
        }
      }
    }`
  );
  return data.pooledZkappCommands ?? [];
}

export interface MempoolTx {
  hash: string;
  type: "user" | "zkapp";
  userCommand?: TransactionInPool;
  zkappCommand?: ZkAppCommand;
}

export async function getAccountPendingTxs(
  network: NetworkConfig,
  address: string
): Promise<AccountTransaction[]> {
  const [userCmds, zkCmds] = await Promise.all([
    getPooledTransactions(network),
    getPooledZkAppCommands(network),
  ]);

  const txs: AccountTransaction[] = [];

  for (const cmd of userCmds) {
    if (cmd.from === address || cmd.to === address) {
      txs.push({
        hash: cmd.hash,
        type: cmd.kind === "STAKE_DELEGATION" ? "delegation" : "payment",
        from: cmd.from,
        to: cmd.to,
        amount: cmd.amount,
        fee: cmd.fee,
        memo: cmd.memo,
        blockHeight: "pending",
        timestamp: 0,
        direction: cmd.from === address && cmd.to === address ? "self" : cmd.from === address ? "sent" : "received",
        failed: false,
      });
    }
  }

  for (const zk of zkCmds) {
    const feePayer = zk.zkappCommand.feePayer.body.publicKey;
    const involved = zk.zkappCommand.accountUpdates.map((au) => au.body.publicKey);
    if (feePayer === address || involved.includes(address)) {
      txs.push({
        hash: zk.hash,
        type: "zkapp",
        from: feePayer,
        to: involved[0] ?? "",
        amount: "0",
        fee: zk.zkappCommand.feePayer.body.fee,
        memo: zk.zkappCommand.memo,
        blockHeight: "pending",
        timestamp: 0,
        direction: feePayer === address ? "sent" : "received",
        failed: false,
      });
    }
  }

  return txs;
}

export async function findInMempool(network: NetworkConfig, hash: string): Promise<MempoolTx | null> {
  const [userCmds, zkCmds] = await Promise.all([
    getPooledTransactions(network),
    getPooledZkAppCommands(network),
  ]);

  const user = userCmds.find((c) => c.hash === hash);
  if (user) return { hash, type: "user", userCommand: user };

  const zk = zkCmds.find((c) => c.hash === hash);
  if (zk) return { hash, type: "zkapp", zkappCommand: zk };

  return null;
}
