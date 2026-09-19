import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GoldTrade V18 Enterprise",
  description: "GoldTrade V18 - PKR, GOLD & USDT Trading Platform",
  applicationName: "GoldTrade V18",
  keywords: [
    "GoldTrade",
    "Gold",
    "USDT",
    "PKR",
    "Trading",
    "Wallet",
  ],
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-black text-white antialiased">
        {children}
      </body>
    </html>
  );
}