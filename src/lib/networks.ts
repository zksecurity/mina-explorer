export type NetworkId = "testnet" | "devnet" | "mainnet";

export interface NetworkConfig {
  id: NetworkId;
  name: string;
  graphqlUrl: string;
  rosettaUrl: string;
}

export const networks: Record<NetworkId, NetworkConfig> = {
  testnet: {
    id: "testnet",
    name: "Testnet",
    graphqlUrl: process.env.TESTNET_GRAPHQL_URL || "",
    rosettaUrl: process.env.TESTNET_ROSETTA_URL || "",
  },
  devnet: {
    id: "devnet",
    name: "Devnet",
    graphqlUrl: process.env.DEVNET_GRAPHQL_URL || "",
    rosettaUrl: process.env.DEVNET_ROSETTA_URL || "",
  },
  mainnet: {
    id: "mainnet",
    name: "Mainnet",
    graphqlUrl: process.env.MAINNET_GRAPHQL_URL || "",
    rosettaUrl: process.env.MAINNET_ROSETTA_URL || "",
  },
};

export const defaultNetwork: NetworkId = "devnet";
