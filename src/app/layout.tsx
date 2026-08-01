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

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://calvarychapel-gangnam.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Calvary Chapel Gangnam",
  description:
    "Calvary Chapel Gangnam teaches the whole counsel of God from Genesis to Revelation.",
  openGraph: {
    title: "Calvary Chapel Gangnam",
    description:
      "Calvary Chapel Gangnam teaches the whole counsel of God from Genesis to Revelation.",
    images: [
      {
        url: "/sns.png",
        width: 1200,
        height: 630,
        alt: "Calvary Chapel Gangnam",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Calvary Chapel Gangnam",
    description:
      "Calvary Chapel Gangnam teaches the whole counsel of God from Genesis to Revelation.",
    images: ["/sns.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
