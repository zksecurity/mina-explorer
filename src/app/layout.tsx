import type { Metadata } from "next";
import { NetworkProvider } from "@/components/NetworkContext";
import { Header } from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mina Explorer",
  description: "Block explorer for Mina Protocol",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
        <NetworkProvider>
          <Header />
          <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
        </NetworkProvider>
      </body>
    </html>
  );
}
