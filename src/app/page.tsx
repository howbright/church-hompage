import type { Metadata } from "next";
import { HomePage } from "@/components/home-page";

const description =
  "서울 송파구에 위치한 갈보리채플 강남교회입니다. 창세기부터 요한계시록까지 성경을 장별·절별로 가르치며, 성경대학교와 각종 중독, 삶의 문제에 대한 성경적 상담을 제공합니다.";

export const metadata: Metadata = {
  title: "갈보리채플 강남교회 | 서울 송파구 성경 중심 교회",
  description,
  keywords: [
    "갈보리채플 강남교회",
    "송파구 교회",
    "서울 교회",
    "성경 중심 교회",
    "성경대학교",
    "성경적 상담",
    "장별 절별 성경 강해",
  ],
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: "갈보리채플 강남교회 | 서울 송파구 성경 중심 교회",
    description,
    url: "/",
    siteName: "갈보리채플 강남교회",
    locale: "ko_KR",
    type: "website",
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
    title: "갈보리채플 강남교회 | 서울 송파구 성경 중심 교회",
    description,
    images: ["/sns.png"],
  },
};

export default function Page() {
  return <HomePage />;
}
