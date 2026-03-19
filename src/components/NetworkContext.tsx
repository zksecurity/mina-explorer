"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { NetworkId, NetworkConfig, networks, defaultNetwork } from "@/lib/networks";

interface NetworkCtx {
  networkId: NetworkId;
  network: NetworkConfig;
  setNetworkId: (id: NetworkId) => void;
}

const Ctx = createContext<NetworkCtx | null>(null);

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [networkId, setNetworkId] = useState<NetworkId>(defaultNetwork);
  return (
    <Ctx.Provider value={{ networkId, network: networks[networkId], setNetworkId }}>
      {children}
    </Ctx.Provider>
  );
}

export function useNetwork(): NetworkCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useNetwork must be used within NetworkProvider");
  return ctx;
}
