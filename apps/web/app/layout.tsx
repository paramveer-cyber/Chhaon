import type { Metadata, Viewport } from "next";
import { Mukta, Outfit, Schibsted_Grotesk } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { GlobalProviders } from "~/providers/global";

const headingFont = Schibsted_Grotesk({ subsets: ["latin"], variable: "--font-schibsted" });
const bodyFont = Mukta({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-mukta" });
const brandFont = Outfit({ subsets: ["latin"], weight: ["500"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "Chhaon",
  description: "Find cooling points and water on hot days in Delhi.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F5F1E9",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${headingFont.variable} ${bodyFont.variable} ${brandFont.variable} bg-page font-body text-ink`}>
        <GlobalProviders>{children}</GlobalProviders>
      </body>
    </html>
  );
}
