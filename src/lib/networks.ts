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
    graphqlUrl: process.env.NEXT_PUBLIC_LIGHTNET_GRAPHQL_URL || "",
    rosettaUrl: process.env.NEXT_PUBLIC_LIGHTNET_ROSETTA_URL || "",
  },
  devnet: {
    id: "devnet",
    name: "Devnet",
    graphqlUrl: process.env.NEXT_PUBLIC_DEVNET_GRAPHQL_URL || "",
    rosettaUrl: process.env.NEXT_PUBLIC_DEVNET_ROSETTA_URL || "",
  },
  mainnet: {
    id: "mainnet",
    name: "Mainnet",
    graphqlUrl: process.env.NEXT_PUBLIC_MAINNET_GRAPHQL_URL || "",
    rosettaUrl: process.env.NEXT_PUBLIC_MAINNET_ROSETTA_URL || "",
  },
};

export const defaultNetwork: NetworkId = "devnet";
