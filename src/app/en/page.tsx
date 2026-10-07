import type { Metadata } from "next";
import { HomePage } from "@/components/home-page";
import { churchSiteStructuredData } from "@/lib/church-structured-data";

const title = "Calvary Chapel Gangnam | Church in Seoul, South Korea";
const description =
  "Calvary Chapel Gangnam is a Bible-teaching church in Seoul, South Korea, teaching Scripture chapter by chapter and verse by verse.";

export const metadata: Metadata = {
  applicationName: "Calvary Chapel Gangnam",
  title,
  description,
  keywords: [
    "Calvary Chapel in Korea",
    "Calvary Chapel in South Korea",
    "Calvary Chapel in Seoul",
    "Bible-teaching church in Seoul",
    "verse-by-verse Bible teaching",
    "church in Songpa-gu Seoul",
  ],
  alternates: {
    canonical: "/en",
    languages: {
      "ko-KR": "/",
      en: "/en",
      "x-default": "/",
    },
  },
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
    title,
    description,
    url: "/en",
    siteName: "Calvary Chapel Gangnam",
    locale: "en_US",
    alternateLocale: ["ko_KR"],
    type: "website",
    images: [
      {
        url: "/sns.png",
        width: 1200,
        height: 630,
        alt: "Calvary Chapel Gangnam in Seoul, South Korea",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/sns.png"],
  },
};

export default function EnglishHomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(churchSiteStructuredData).replace(/</g, "\\u003c"),
        }}
      />
      <HomePage language="en" />
    </>
  );
}
