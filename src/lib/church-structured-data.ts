import { churchConfig } from "./church-config";

export const canonicalSiteUrl = "https://www.calvarygangnam.com";

export const churchSiteStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${canonicalSiteUrl}/#website`,
      name: churchConfig.koreanName,
      alternateName: [churchConfig.englishName, "calvarygangnam.com"],
      url: `${canonicalSiteUrl}/`,
      inLanguage: ["ko", "en"],
    },
    {
      "@type": "Church",
      "@id": `${canonicalSiteUrl}/#church`,
      name: churchConfig.koreanName,
      alternateName: churchConfig.englishName,
      description:
        "Calvary Chapel Gangnam is a Bible-teaching church in Seoul, South Korea, teaching the whole Bible chapter by chapter and verse by verse.",
      url: `${canonicalSiteUrl}/`,
      logo: `${canonicalSiteUrl}${churchConfig.logoSrc}`,
      image: `${canonicalSiteUrl}/sns.png`,
      email: churchConfig.contactEmail,
      address: {
        "@type": "PostalAddress",
        streetAddress: "3F, 245 Jungdae-ro",
        addressLocality: "Songpa-gu",
        addressRegion: "Seoul",
        addressCountry: "KR",
      },
      sameAs: [churchConfig.youtubeUrl, churchConfig.instagramUrl],
    },
  ],
};
