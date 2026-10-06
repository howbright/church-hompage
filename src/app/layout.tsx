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

const siteUrl = "https://www.calvarygangnam.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "갈보리채플 강남교회",
  description:
    "서울 송파구에 위치한 갈보리채플 강남교회입니다. 창세기부터 요한계시록까지 성경을 장별·절별로 가르치며, 성경대학교와 각종 중독, 삶의 문제에 대한 성경적 상담을 제공합니다.",
  openGraph: {
    title: "갈보리채플 강남교회",
    description:
      "서울 송파구에 위치한 갈보리채플 강남교회입니다. 창세기부터 요한계시록까지 성경을 장별·절별로 가르치며, 성경대학교와 각종 중독, 삶의 문제에 대한 성경적 상담을 제공합니다.",
    images: [
      {
        url: "/sns.png",
        width: 1200,
        height: 630,
        alt: "갈보리채플 강남교회",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "갈보리채플 강남교회",
    description:
      "서울 송파구에 위치한 갈보리채플 강남교회입니다. 창세기부터 요한계시록까지 성경을 장별·절별로 가르치며, 성경대학교와 각종 중독, 삶의 문제에 대한 성경적 상담을 제공합니다.",
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
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
