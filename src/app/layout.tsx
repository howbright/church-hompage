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
  title: "Calvary Chapel, Church of Seoul",
  description:
    "Calvary Chapel, Church of Seoul teaches the whole counsel of God from Genesis to Revelation.",
  openGraph: {
    title: "Calvary Chapel, Church of Seoul",
    description:
      "Calvary Chapel, Church of Seoul teaches the whole counsel of God from Genesis to Revelation.",
    images: [
      {
        url: "/sns.png",
        width: 1200,
        height: 630,
        alt: "Calvary Chapel, Church of Seoul",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Calvary Chapel, Church of Seoul",
    description:
      "Calvary Chapel, Church of Seoul teaches the whole counsel of God from Genesis to Revelation.",
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
