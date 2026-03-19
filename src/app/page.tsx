"use client";

import { StatusCards } from "@/components/StatusCards";
import { BlockList } from "@/components/BlockList";
import { TransactionList } from "@/components/TransactionList";
import { MempoolList } from "@/components/MempoolList";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <StatusCards />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BlockList />
        <TransactionList />
      </div>
      <MempoolList />
    </div>
  );
}
