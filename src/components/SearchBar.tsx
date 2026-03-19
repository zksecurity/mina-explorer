"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useNetwork } from "./NetworkContext";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { networkId } = useNetwork();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;

    if (q.startsWith("B62")) {
      router.push(`/account/${q}?network=${networkId}`);
    } else if (q.startsWith("5J")) {
      router.push(`/tx/${q}?network=${networkId}`);
    } else {
      router.push(`/block/${q}?network=${networkId}`);
    }
    setQuery("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex-1 max-w-xl">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by address (B62...), tx hash (5J...), or block hash (3N...)..."
        className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
      />
    </form>
  );
}
