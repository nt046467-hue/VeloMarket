import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "VeloMarket — Shop Smarter, Live Better",
    template: "%s | VeloMarket",
  },
  description: "VeloMarket is your one-stop online marketplace for electronics, fashion, home essentials, audio gear and more. Fast shipping, secure checkout, easy 30-day returns.",
  keywords: ["VeloMarket", "ecommerce", "online shopping", "electronics", "fashion", "deals", "marketplace"],
  authors: [{ name: "VeloMarket" }],
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: { url: "/apple-icon.png", sizes: "180x180" },
    shortcut: "/favicon.ico",
  },
  openGraph: {
    title: "VeloMarket — Shop Smarter, Live Better",
    description: "Millions of products. Fast shipping. Secure checkout.",
    type: "website",
    siteName: "VeloMarket",
  },
  twitter: {
    card: "summary",
    title: "VeloMarket",
    description: "Your one-stop marketplace. Shop smarter, live better.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider>
          {children}
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
