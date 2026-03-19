export type NetworkId = "lightnet" | "devnet" | "mainnet";

export interface NetworkConfig {
  id: NetworkId;
  name: string;
  graphqlUrl: string;
  rosettaUrl: string;
}

export const networks: Record<NetworkId, NetworkConfig> = {
  lightnet: {
    id: "lightnet",
    name: "Lightnet",
    graphqlUrl: process.env.LIGHTNET_GRAPHQL_URL || "",
    rosettaUrl: process.env.LIGHTNET_ROSETTA_URL || "",
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
