export const churchConfig = {
  name: "Calvary Chapel Gangnam",
  englishName: "Calvary Chapel Gangnam",
  koreanName: "갈보리채플 강남교회",
  seniorPastor: "최모세 목사",
  contactEmail: "mosesnara@hanmail.net",
  youtubeUrl: "https://www.youtube.com/@calvarymoses",
  instagramUrl: "https://www.instagram.com/calvary_chapel_gangnam/",
  logoSrc: "/logo.svg",
  bulletinImageSrc: "/bulletin-scripture.png",
  worshipOrder: [
    "찬양과 경배",
    "믿음의 고백",
    "말씀 강론",
    "축도",
  ],
  worshipLocations: [
    {
      service: "주일 예배",
      location:
        "(8월 임시 예배처소) 서울시 송파구 동남로24길 11, B1층 소리소극장",
    },
    {
      service: "수요 예배",
      location:
        "(8월 임시 예배처소) 서울 서초구 명달로11길 17-7 B01호, 홀리센터",
    },
    {
      service: "토요 모임",
      location: "이메일 문의",
    },
  ],
} as const;
