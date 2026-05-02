import type { Metadata } from "next";

import { MainNav } from "@/components/main-nav";

import "./globals.css";

export const metadata: Metadata = {
  title: "Starter Story Intelligence Engine",
  description: "Scraping real + inteligencia de negocio para LATAM",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full bg-zinc-50 text-zinc-900">
        <div className="flex min-h-full flex-col">
          <header className="border-b border-zinc-300 bg-white">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                  Proyecto Académico
                </p>
                <h1 className="text-lg font-bold">Starter Story Intelligence Engine</h1>
              </div>
            </div>
            <MainNav />
          </header>
          <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
