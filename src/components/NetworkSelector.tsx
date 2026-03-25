"use client";

import { useRouter, usePathname } from "next/navigation";
import { NetworkId, networks } from "@/lib/networks";
import { useNetwork } from "./NetworkContext";

const networkIds = Object.keys(networks) as NetworkId[];

export function NetworkSelector() {
  const { networkId, setNetworkId } = useNetwork();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex gap-1 rounded-lg bg-zinc-800 p-1">
      {networkIds.map((id) => (
        <button
          key={id}
          disabled={networkId === id}
          onClick={() => { setNetworkId(id); router.push(`${pathname}?network=${id}`); }}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            networkId === id
              ? "bg-orange-500 text-white cursor-default"
              : "text-zinc-400 hover:text-white hover:bg-zinc-700"
          }`}
        >
          {networks[id].name}
        </button>
      ))}
    </div>
  );
}
