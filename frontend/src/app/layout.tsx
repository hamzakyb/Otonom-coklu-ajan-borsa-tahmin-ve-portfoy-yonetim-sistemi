import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });

export const metadata: Metadata = {
  title: "OmniQuant BIST AI",
  description: "Otonom Çoklu-Ajan Borsa Tahmin ve Portföy Yönetim Sistemi",
};

import GlobalToast from "@/components/layout/GlobalToast";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased`} suppressHydrationWarning>
        <Toaster position="top-right" toastOptions={{ style: { background: '#121315', color: '#fff', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' } }} />
        <GlobalToast />
        {children}
      </body>
    </html>
  );
}
