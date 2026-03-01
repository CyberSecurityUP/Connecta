import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { AppProviders } from "@/components/providers/app-providers";
import { Toaster } from "sonner";

import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Connecta",
  description: "Connecta - Open-source team communication platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <AppProviders>
          {children}
          <Toaster position="top-right" />
        </AppProviders>
      </body>
    </html>
  );
}
