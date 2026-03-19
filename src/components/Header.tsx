"use client";

import Link from "next/link";
import { NetworkSelector } from "./NetworkSelector";
import { SearchBar } from "./SearchBar";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <Link href="/" className="text-lg font-bold text-orange-500 whitespace-nowrap">
          Mina Explorer
        </Link>
        <SearchBar />
        <NetworkSelector />
      </div>
    </header>
  );
}
