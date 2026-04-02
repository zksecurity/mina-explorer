# Mina Explorer

Block explorer for Mina Protocol built with Next.js 15, TypeScript, and Tailwind CSS. Supports testnet, devnet, and mainnet networks.

## Setup

```bash
npm install
```

Copy the example env file and fill in your server URLs:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Mina node endpoints:

```env
# Base path for reverse proxy (leave empty if serving from root)
NEXT_PUBLIC_BASE_PATH=/lightnet/explorer

# Testnet
TESTNET_GRAPHQL_URL=http://YOUR_SERVER:9080/graphql

# Devnet
DEVNET_GRAPHQL_URL=http://YOUR_SERVER:6085/graphql
DEVNET_ROSETTA_URL=http://YOUR_SERVER:3087

# Mainnet
MAINNET_GRAPHQL_URL=http://YOUR_SERVER:7085/graphql
MAINNET_ROSETTA_URL=http://YOUR_SERVER:4087
```

> **Note:** Endpoint URLs intentionally have no `NEXT_PUBLIC_` prefix so they stay server-side only. Client requests go through `/api/graphql` and `/api/rosetta` proxy routes.

## Development

```bash
npm run dev
```

To expose on all interfaces (e.g. on a remote server):

```bash
npm run dev -- -H 0.0.0.0 -p 3000
```

## Production

```bash
npm run build
npm run start
```

## Base Path

The app is configured with `basePath: "/lightnet/explorer"` in `next.config.ts` for deployment behind a reverse proxy. Change or remove this if serving from root.
