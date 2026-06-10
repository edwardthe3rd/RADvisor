import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "RADvisor - Find outdoor gear rentals near Reno & Lake Tahoe",
    template: "%s | RADvisor",
  },
  description:
    "Discover outdoor adventure equipment rentals near Reno and Lake Tahoe - skis, kayaks, bikes, camping gear, RVs and more from local rental businesses.",
  openGraph: {
    type: "website",
    siteName: "RADvisor",
    url: siteUrl,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-surface-background text-ink-primary antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
