import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/components/wallet/WalletProvider";
import { WalletSelector } from "@/components/wallet/WalletSelector";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ProofVault",
  description: "A verifiable file integrity platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-slate-950 text-slate-50 flex flex-col`}>
        <WalletProvider>
          <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
              <div className="flex items-center gap-8">
                <Link href="/" className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                  ProofVault
                </Link>
                <nav className="hidden md:flex gap-6">
                  <Link href="/upload" className="text-sm text-slate-300 hover:text-white transition-colors">Upload Evidence</Link>
                  <Link href="/evidence" className="text-sm text-slate-300 hover:text-white transition-colors">Archive</Link>
                  <Link href="/about" className="text-sm text-slate-300 hover:text-white transition-colors">About</Link>
                </nav>
              </div>
              <WalletSelector />
            </div>
          </header>
          <main className="flex-1 flex flex-col">
            {children}
          </main>
          <footer className="py-6 text-center text-sm text-slate-500 border-t border-slate-800">
            ProofVault MVP &copy; 2026. Built with Aptos and Shelby.
          </footer>
        </WalletProvider>
      </body>
    </html>
  );
}
