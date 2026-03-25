"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { NetworkId, NetworkConfig, networks, defaultNetwork } from "@/lib/networks";

interface NetworkCtx {
  networkId: NetworkId;
  network: NetworkConfig;
  setNetworkId: (id: NetworkId) => void;
  ready: boolean;
}

const Ctx = createContext<NetworkCtx | null>(null);

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [networkId, setNetworkId] = useState<NetworkId>(defaultNetwork);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("network");
    if (param && param in networks) setNetworkId(param as NetworkId);
    setReady(true);
  }, []);

  return (
    <Ctx.Provider value={{ networkId, network: networks[networkId], setNetworkId, ready }}>
      {ready ? children : null}
    </Ctx.Provider>
  );
}

export function useNetwork(): NetworkCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useNetwork must be used within NetworkProvider");
  return ctx;
}
