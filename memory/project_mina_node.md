---
name: Mina Rosetta/Archive Node Setup
description: Remote server setup for Mina Protocol Rosetta API and archive node on YOUR_SERVER, including Docker commands, ports, and API endpoints
type: project
---

## Server: YOUR_SERVER (ubuntu-32gb-hel1-1)

- User: mellowcroc (in sudo and docker groups, but no password set — SSH key auth only)
- Docker requires `sudo` to run

## Devnet Rosetta Node

```bash
sudo docker run -d --name rosetta-devnet \
  --entrypoint=./docker-start.sh \
  -p 8302:8302 -p 3085:3085 -p 3086:3086 -p 3087:3087 \
  -e MINA_NETWORK=devnet \
  -e PEER_LIST_URL=https://storage.googleapis.com/o1labs-gitops-infrastructure/devnet/seed-list-devnet.txt \
  -e MINA_ARCHIVE_DUMP_URL=https://storage.googleapis.com/mina-archive-dumps \
  -e BLOCKS_BUCKET=https://storage.googleapis.com/mina_network_block_data \
  --log-driver json-file --log-opt max-size=100m --log-opt max-file=5 \
  gcr.io/o1labs-192920/mina-rosetta:3.3.0-alpha1-6929a7e-noble-devnet
```

## Mainnet Rosetta Node

```bash
sudo docker run -d --name rosetta \
  --entrypoint=./docker-start.sh \
  -p 8302:8302 -p 3085:3085 -p 3086:3086 -p 3087:3087 \
  -e MINA_NETWORK=mainnet \
  -e PEER_LIST_URL=https://bootnodes.minaprotocol.com/networks/mainnet.txt \
  -e MINA_ARCHIVE_DUMP_URL=https://storage.googleapis.com/mina-archive-dumps \
  -e MINA_GENESIS_LEDGER_URL=https://raw.githubusercontent.com/MinaProtocol/mina/compatible/genesis_ledgers/mainnet.json \
  -e BLOCKS_BUCKET=https://storage.googleapis.com/mina_network_block_data \
  --log-driver json-file --log-opt max-size=100m --log-opt max-file=5 \
  minaprotocol/mina-rosetta:3.3.0-8c0c2e6-focal-mainnet
```

## Ports

| Port | Service |
|------|---------|
| 3085 | Mina GraphQL API |
| 3086 | Archive node RPC |
| 3087 | Rosetta API (online) |
| 3088 | Rosetta API (offline, internal only) |
| 8302 | P2P networking |

## Key Notes

- Rosetta API is on port 3087 (NOT 3086)
- GraphQL API on port 3085 supports zkApp state queries (zkappState, actionState, events, actions)
- Rosetta API does NOT support zkApp/contract state queries
- Mainnet genesis ledger URL must use `compatible` branch, not `main`
- Firewall (ufw) is inactive — all ports open
- zkApp contract of interest: B62qpTf4SNKQUrFzBUXjPW9qHhpdbboD8dVMXboE4Tt3Lu8BvuW3Gtb

**Why:** Setting up self-hosted Mina node infrastructure for querying blockchain data and zkApp state, as minascan.io devnet can be slow to update.

**How to apply:** When user asks about Mina node queries, Docker setup, or debugging node issues on this server, reference these details.
