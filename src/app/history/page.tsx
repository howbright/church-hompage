import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "교회 연혁 | 갈보리채플 강남교회",
  description:
    "고 이요나 목사의 사역에서 최모세 담임목사로 이어진 갈보리채플 강남교회의 신앙적 뿌리와 여정을 소개합니다.",
  openGraph: {
    title: "교회 연혁 | 갈보리채플 강남교회",
    description:
      "고 이요나 목사의 사역에서 최모세 담임목사로 이어진 갈보리채플 강남교회의 신앙적 뿌리와 여정",
    url: "/history",
    siteName: "갈보리채플 강남교회",
    locale: "ko_KR",
    type: "website",
    images: ["/bulletin-og-v3.png"],
  },
};

type TimelineItem = {
  period: string;
  title: string;
  description: string;
  images?: Array<{
    src: string;
    alt: string;
    caption: string;
    position?: string;
    aspect?: string;
  }>;
};

const timeline: TimelineItem[] = [
  {
    period: "청년기–1980년대",
    title: "신앙을 향한 여정",
    description:
      "연극과 패션 관련 일을 하며 사회생활을 시작한 이요나 목사는 삶과 정체성의 깊은 혼란 가운데 예수 그리스도를 영접했습니다. 이후 일본에서 신학을 공부하며 말씀을 배우는 길로 들어섰습니다.",
  },
  {
    period: "1991",
    title: "말씀 안에서 맞은 전환점",
    description:
      "마흔셋 무렵 신학교 강의를 듣고 성경을 본격적으로 배우는 과정에서 삶과 신앙의 중요한 전환을 경험했습니다. 일본 동경 호라이즌채플의 히라노 코오이치 목사를 만나 성경을 공부하며 갈보리채플의 말씀 중심 목회와 연결되었습니다.",
  },
  {
    period: "1990년대 초",
    title: "갈보리채플 목회자로 준비되다",
    description:
      "창세기부터 요한계시록까지 성경을 차례대로 가르치는 갈보리채플의 목회 철학을 한국에서 실천할 준비를 했습니다.",
    images: [
      {
        src: "/history/pastor-lee-and-chuck-smith.jpg",
        alt: "이요나 목사와 갈보리채플 창립자 척 스미스 목사가 함께한 사진",
        caption:
          "이요나 목사(오른쪽 첫 번째)와 갈보리채플 창립자 척 스미스 목사(오른쪽 두 번째)",
        position: "object-center",
        aspect: "aspect-[3/2]",
      },
    ],
  },
  {
    period: "1994",
    title: "갈보리채플서울교회 개척",
    description:
      "히라노 코오이치 목사와 갈보리채플 운동의 창립자인 척 스미스 목사의 기도와 격려 가운데 서울 강남에서 갈보리채플서울교회를 개척했습니다. 성경 전체를 장별·절별로 가르치는 사역이 교회의 중심이 되었습니다.",
    images: [
      {
        src: "/history/pastor-lee-longtime-disciples.jpg",
        alt: "이요나 목사와 오랜 제자들이 함께 촬영한 기념사진",
        caption: "이요나 목사와 오랜 제자들",
        position: "object-center",
        aspect: "aspect-[16/9]",
      },
      {
        src: "/history/seoul-calvary-chapel-pastors.jpg",
        alt: "갈보리채플서울교회 앞에 함께 선 이요나 목사와 최모세 목사 및 성도들",
        caption: "20년 후, 논현동의 갈보리채플서울교회 앞에서",
        position: "object-center",
        aspect: "aspect-square",
      },
    ],
  },
  {
    period: "이후",
    title: "성경대학과 말씀 훈련",
    description:
      "갈보리채플 바이블 칼리지 코리아 서울분교를 이끌며 성경 교사와 다음 세대 사역자를 세우는 일에 힘썼습니다. 성경강해와 저술, 온라인 강의를 통해 교회 안팎에 말씀을 전했습니다.",
    images: [
      {
        src: "/history/pastor-lee-lecture.jpg",
        alt: "교회 지도자 양성과정에서 강의하는 이요나 목사",
        caption: "교회 지도자 양성과정에서 말씀을 가르치는 이요나 목사",
        position: "object-[center_42%]",
      },
    ],
  },
  {
    period: "2000년대–2020년대",
    title: "성경적 상담과 회복 사역",
    description:
      "한국성경적상담협회와 홀리라이프 사역을 통해 자기대면 교육, 중독과 삶의 문제에 대한 상담, 회복이 필요한 이들을 돌보는 사역을 이어갔습니다. 자신의 아픔을 감추기보다 복음 안에서 받은 회복을 다른 이들을 섬기는 통로로 삼았습니다.",
    images: [
      {
        src: "/history/ministry-interview-2022.jpg",
        alt: "홀리라이프 행사 현장에서 인터뷰하는 이요나 목사",
        caption: "홀리라이프 사역 현장에서 인터뷰하는 모습, 2022년",
        position: "object-[center_42%]",
      },
    ],
  },
  {
    period: "2024. 7. 30.",
    title: "소천",
    description:
      "이요나 목사는 폐암 투병 끝에 향년 76세로 소천했습니다. 말씀을 차례대로 가르치고 상처 입은 이들을 돌보았던 그의 사역은 갈보리채플서울교회 공동체와 그 뒤를 잇는 사역자들에게 신앙의 유산으로 남았습니다.",
    images: [
      {
        src: "/history/pastor-lee-memorial-2024.jpg",
        alt: "푸른 소나무 곁에 놓인 고 이요나 목사의 영정",
        caption: "고 이요나 목사를 기억하며, 2024년",
        position: "object-[center_63%]",
      },
    ],
  },
];

const continuingTimeline = [
  {
    period: "20대",
    title: "갈보리채플서울교회에서 시작된 섬김",
    description:
      "최모세 목사는 20대에 이요나 목사가 섬기던 갈보리채플서울교회를 찾아와 신앙생활을 시작했습니다. 청년 시절부터 공동체 안에서 예배와 여러 사역을 섬기며 말씀 중심 목회의 기초를 가까이에서 배우고, 목회자로 부르시는 하나님의 인도하심을 따라 준비되어 갔습니다.",
    images: [
      {
        src: "/history/pastors-lee-and-choi-costa-mesa.jpg",
        alt: "미국에서 함께한 젊은 시절의 최모세 목사와 이요나 목사",
        caption: "청년 시절부터 이어진 이요나 목사와 최모세 목사의 동행",
        position: "object-[center_45%]",
      },
    ],
  },
  {
    period: "청년 사역기",
    title: "오키나와에서 배우고 섬기다",
    description:
      "교회 공동체의 기도와 권면 가운데 일본 오키나와의 성경대학으로 유학해 성경을 체계적으로 공부했습니다. 다양한 문화권에서 온 학생들과 함께 생활하며 예배와 공동체 사역을 경험했고, 배운 말씀을 실제 삶과 섬김으로 연결하는 훈련을 받았습니다.",
    images: [
      {
        src: "/history/choi-moses-okinawa-worship.jpg",
        alt: "오키나와 성경대학 시절 기타로 찬양하는 최모세 목사",
        caption: "오키나와 성경대학 시절의 예배와 공동체 생활",
        position: "object-center",
      },
      {
        src: "/history/choi-moses-okinawa-community.jpg",
        alt: "오키나와 성경대학 학생들과 함께한 최모세 목사",
        caption: "여러 나라의 학생들과 함께 배우고 섬긴 성경대학 시절",
        position: "object-center",
      },
    ],
  },
  {
    period: "성경대학 졸업 후",
    title: "코스타메사에서 받은 목회 훈련",
    description:
      "오키나와 성경대학을 졸업한 뒤 미국 갈보리채플 코스타메사의 Pastor’s School에서 목회 훈련을 마쳤습니다. 갈보리채플의 말씀 중심 목회와 실제 교회 사역을 배우며, 성경을 충실히 가르치고 성도들을 섬기는 목회자로 준비되었습니다.",
    images: [
      {
        src: "/history/choi-moses-bible-college-graduation.jpg",
        alt: "성경대학 졸업 증서를 들고 있는 최모세 목사",
        caption: "성경대학 과정을 마치며",
        position: "object-[center_42%]",
      },
      {
        src: "/history/choi-moses-pastors-school.jpg",
        alt: "갈보리채플 코스타메사 목회자 훈련 과정에 참여한 최모세 목사",
        caption: "갈보리채플 코스타메사 Pastor’s School 목회 훈련",
        position: "object-center",
      },
    ],
  },
  {
    period: "목회 준비의 시간",
    title: "스승과 제자에서 동역자로",
    description:
      "이요나 목사는 최모세 목사의 신앙과 사역의 여정을 가까이에서 지켜보며 목회자로 세워지는 과정을 격려했습니다. 두 사람은 한국과 미국을 오가며 갈보리채플의 말씀 사역을 함께 배우고 나누었고, 그렇게 이어진 관계는 한 세대의 사역을 다음 세대로 잇는 든든한 연결이 되었습니다.",
    images: [
      {
        src: "/history/calvary-chapel-costa-mesa.jpg",
        alt: "갈보리채플 코스타메사 예배당 앞에 함께 선 이요나 목사와 최모세 목사",
        caption: "갈보리채플 코스타메사에서 함께한 이요나 목사와 최모세 목사",
        position: "object-[center_55%]",
      },
    ],
  },
] as const;

const sources = [
  {
    label: "국민일보 — 1994년 갈보리채플서울교회 개척 관련 보도",
    href: "https://www.kmib.co.kr/article/view.asp?arcid=0011713756",
  },
  {
    label: "Korea Calvary Chapel Bible College — 교수·사역 소개",
    href: "https://ccbc.co.kr/staff/list.html?pid=80",
  },
  {
    label: "국민일보 — 성경적 상담 사역 인터뷰",
    href: "https://www.kmib.co.kr/article/view.asp?arcid=0006327394",
  },
  {
    label: "CTS뉴스 — 이요나 목사 소천 보도",
    href: "https://www.youtube.com/watch?v=9INiC3kj0DQ",
  },
  {
    label: "기독일보 — 2024년 7월 30일 별세 및 장례 보도",
    href: "https://www.christiandaily.co.kr/news/137589",
  },
] as const;

export default function HistoryPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#eef8ff_0%,#ffffff_38%,#f4f8fc_100%)] text-[var(--page-ink)]">
      <header className="border-b border-[#cbe5f6] bg-white/85 px-5 py-5 backdrop-blur sm:px-8">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
          <Link href="/" className="w-[180px] max-w-[55vw] sm:w-[220px]">
            <Image
              src="/logo.svg"
              alt="갈보리채플 강남교회"
              width={2400}
              height={500}
              className="h-auto w-full"
              priority
            />
          </Link>
          <Link
            href="/"
            className="shrink-0 rounded-full border border-[#9ccfed] bg-[#edf8ff] px-4 py-2 text-sm font-bold text-[#075f9b] transition hover:bg-white"
          >
            홈으로
          </Link>
        </div>
      </header>

      <section className="px-5 py-14 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.32em] text-[#1678b8]">
            Our Story
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-[#08275b] sm:text-5xl">
            교회 연혁
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-[#4f6275] sm:text-lg sm:leading-9">
            갈보리채플 강남교회는 고 이요나 목사님이 개척한
            갈보리채플서울교회의 말씀 중심 신앙과 목회적 유산에서
            시작되었습니다. 우리에게 이어진 뿌리를 기억하며, 예수
            그리스도를 더욱 깊이 알고 성경 전체를 충실히 가르치는 길을
            계속 걸어가고자 합니다.
          </p>
          <figure className="mx-auto mt-10 max-w-2xl overflow-hidden rounded-[1.75rem] border border-[#b9dff5] bg-white p-2 text-left shadow-[0_22px_60px_rgba(8,39,91,0.12)] sm:p-3">
            <div className="relative aspect-[6/5] overflow-hidden rounded-[1.25rem]">
              <Image
                src="/history/pastor-lee-speaking-portrait.jpg"
                alt="강단에서 말씀을 전하는 이요나 목사"
                fill
                sizes="(max-width: 672px) 90vw, 672px"
                className="object-cover object-[center_38%]"
                priority
              />
            </div>
            <figcaption className="px-3 pb-2 pt-3 text-xs leading-5 text-[#687b8d] sm:px-4 sm:text-sm">
              말씀을 전하는 갈보리채플서울교회 개척자 고 이요나 목사
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="px-5 pb-16 sm:px-8 sm:pb-24">
        <div className="mx-auto max-w-4xl">
          <div className="relative space-y-5 before:absolute before:bottom-6 before:left-[1.9rem] before:top-6 before:w-px before:bg-[#9dcfec] sm:before:left-[10rem]">
            {timeline.map((item) => (
              <article
                key={`${item.period}-${item.title}`}
                className="relative grid gap-3 rounded-[1.5rem] border border-[#cbe5f6] bg-white/95 p-5 shadow-[0_14px_40px_rgba(8,39,91,0.07)] sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-10 sm:p-7"
              >
                <div className="relative pl-10 sm:pl-0 sm:text-right">
                  <span className="absolute left-[0.4rem] top-1.5 h-4 w-4 rounded-full border-4 border-white bg-[#3f9fe8] shadow-[0_0_0_1px_#79bee8] sm:-right-[1.75rem] sm:left-auto" />
                  <p className="text-sm font-extrabold text-[#1678b8]">
                    {item.period}
                  </p>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#08275b] sm:text-2xl">
                    {item.title}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-[#56697a] sm:text-base sm:leading-8">
                    {item.description}
                  </p>
                  {item.images && (
                    <div className="mt-5 space-y-4">
                      {item.images.map((photo) => (
                        <figure
                          key={photo.src}
                          className="overflow-hidden rounded-2xl border border-[#d8eaf5] bg-[#f7fbfe]"
                        >
                          <div
                            className={`relative overflow-hidden ${photo.aspect ?? "aspect-[16/9]"}`}
                          >
                            <Image
                              src={photo.src}
                              alt={photo.alt}
                              fill
                              sizes="(max-width: 640px) 82vw, 610px"
                              className={`object-cover ${photo.position ?? "object-center"}`}
                            />
                          </div>
                          <figcaption className="px-4 py-3 text-xs leading-5 text-[#687b8d] sm:text-sm">
                            {photo.caption}
                          </figcaption>
                        </figure>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>

          <section className="mt-16 overflow-hidden rounded-[2rem] border border-[#9bcfeb] bg-[#08275b] px-5 py-10 text-white shadow-[0_24px_70px_rgba(8,39,91,0.18)] sm:px-9 sm:py-14">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#7fd0ff]">
              Continuing Story
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              이어진 부르심
            </h2>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-[#dceeff] sm:text-base sm:leading-8">
              한 사람에게 맡겨진 말씀의 사역은 공동체 안에서 다음 세대를
              세우는 일로 이어졌습니다. 이요나 목사에게 배우며 청년 시절부터
              교회를 섬긴 최모세 목사는 국내외 성경대학과 목회 훈련을 거쳐,
              오늘 갈보리채플 강남교회의 담임목사로 그 신앙적 유산을
              이어가고 있습니다.
            </p>

            <div className="mt-10 space-y-6">
              {continuingTimeline.map((item) => (
                <article
                  key={`${item.period}-${item.title}`}
                  className="rounded-[1.5rem] border border-white/15 bg-white/[0.07] p-5 sm:p-7"
                >
                  <p className="text-xs font-extrabold tracking-[0.16em] text-[#7fd0ff]">
                    {item.period}
                  </p>
                  <h3 className="mt-2 text-xl font-bold sm:text-2xl">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[#d5e7f5] sm:text-base sm:leading-8">
                    {item.description}
                  </p>
                  <div
                    className={`mt-5 grid gap-4 ${item.images.length > 1 ? "sm:grid-cols-2" : ""}`}
                  >
                    {item.images.map((photo) => (
                      <figure
                        key={photo.src}
                        className="overflow-hidden rounded-2xl border border-white/15 bg-white"
                      >
                        <div className="relative aspect-[4/3] overflow-hidden bg-[#dbe8f1]">
                          <Image
                            src={photo.src}
                            alt={photo.alt}
                            fill
                            sizes={
                              item.images.length > 1
                                ? "(max-width: 640px) 82vw, 370px"
                                : "(max-width: 896px) 82vw, 760px"
                            }
                            className={`object-cover ${photo.position}`}
                          />
                        </div>
                        <figcaption className="px-4 py-3 text-xs leading-5 text-[#5a6f82] sm:text-sm">
                          {photo.caption}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                </article>
              ))}
            </div>

            <article className="mt-6 grid gap-6 rounded-[1.5rem] border border-[#7fd0ff]/35 bg-[#0b356f] p-5 sm:grid-cols-[minmax(0,1fr)_minmax(280px,0.9fr)] sm:p-7">
              <div className="self-center">
                <p className="text-xs font-extrabold tracking-[0.16em] text-[#7fd0ff]">
                  2024. 8. 25.
                </p>
                <h3 className="mt-2 text-2xl font-bold">
                  최모세 목사 담임목사 취임
                </h3>
                <p className="mt-4 text-sm leading-7 text-[#d5e7f5] sm:text-base sm:leading-8">
                  최모세 목사는 이요나 목사의 뒤를 이어 갈보리채플서울교회
                  담임목사로 취임했습니다. 청년 성도로 시작해 말씀을 배우고,
                  해외 성경대학과 목회 훈련을 거쳐 다시 공동체를 섬기는
                  목회자로 돌아온 여정입니다. 이 말씀 중심의 신앙과 목회적
                  유산은 오늘의 갈보리채플 강남교회로 이어지고 있습니다.
                </p>
              </div>
              <figure className="overflow-hidden rounded-2xl border border-white/15 bg-white">
                <div className="relative aspect-[16/10] overflow-hidden bg-[#dbe8f1] sm:aspect-[4/3]">
                  <Image
                    src="/history/choi-moses-installation-2024.jpg"
                    alt="2024년 8월 25일 최모세 목사 담임목사 취임예배 안내 포스터"
                    fill
                    sizes="(max-width: 640px) 82vw, 360px"
                    className="object-contain"
                  />
                </div>
                <figcaption className="px-4 py-3 text-xs leading-5 text-[#5a6f82]">
                  갈보리채플서울교회 담임목사 취임예배, 2024년 8월 25일
                </figcaption>
              </figure>
            </article>
          </section>

          <section className="mt-10 border-t border-[#cbe5f6] pt-8">
            <h2 className="text-lg font-bold text-[#08275b]">자료 출처</h2>
            <p className="mt-2 text-xs leading-6 text-[#6b7c8c]">
              공개된 교회·언론 자료와 교회가 보관한 사진 및 기록을 바탕으로
              작성했습니다. 연도가 명확하지 않은 사역은 특정 연도로
              단정하지 않았습니다.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-[#075f9b]">
              {sources.map((source) => (
                <li key={source.href}>
                  <a
                    href={source.href}
                    target="_blank"
                    rel="noreferrer"
                    className="underline decoration-[#7fc5ef] underline-offset-4 hover:text-[#08275b]"
                  >
                    {source.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </section>
    </main>
  );
}
