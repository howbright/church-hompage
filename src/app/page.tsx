 "use client";

import Image from "next/image";
import { useState } from "react";

const content = {
  en: {
    eyebrow: "Church of Seoul",
    description:
      "Following Pastor Chuck Smith's verse-by-verse teaching philosophy, Calvary Chapel teaches the whole counsel of God from Genesis to Revelation.",
    worshipLabel: "Worship Guide",
    worshipTitle: "Service Times",
    worshipItems: [
      "Wednesday Worship | 7:00 PM",
      "Saturday Service | 2:00 PM",
      "Sunday Worship | 11:00 AM",
    ],
    youtubeLabel: "YouTube Channel",
    youtubeCta: "Watch Online",
    locationLabel: "Location",
    locationTitle: "Visit Us",
    locationLines: ["20 Yatap-ro, Gyeonggi-do", "Seongnam-si, Bundang-gu"],
    phoneLabel: "Phone",
    emailLabel: "Email",
    schoolLabel: "School",
    schoolTitle: "Learn Together",
    schoolItems: [
      "Discipleship Training",
      "Bible College",
      "Weekly Scripture Study",
    ],
  },
  ko: {
    description:
      "갈보리채플은 척 스미스 목사님의 성경 강해 철학을 따라, 창세기부터 요한계시록까지 말씀을 장절별로 가르칩니다.",
    worshipLabel: "예배 안내",
    worshipTitle: "모임 시간",
    worshipItems: [
      "수요 예배 | 오후 7:00",
      "토요 예배 | 오후 2:00",
      "주일 예배 | 오전 11:00",
    ],
    youtubeLabel: "유튜브 채널",
    youtubeCta: "온라인 예배 보기",
    locationLabel: "장소",
    locationTitle: "오시는 길",
    locationLines: ["경기도 야탑로 20", "성남시 분당구"],
    phoneLabel: "전화",
    emailLabel: "이메일",
    schoolLabel: "학교",
    schoolTitle: "함께 배우는 말씀",
    schoolItems: ["제자 훈련", "성경 대학", "주간 성경 공부"],
  },
} as const;

export default function Home() {
  const [language, setLanguage] = useState<"en" | "ko">("ko");
  const t = content[language];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--page-deep)] text-[var(--page-ink)]">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[url('/bg.png')] bg-cover bg-center bg-no-repeat"
      />
      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        poster="/bg.png"
      >
        <source src="/bgvideo.mp4" type="video/mp4" />
      </video>
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(180deg,_rgba(236,244,243,0.2)_0%,_rgba(228,238,235,0.42)_28%,_rgba(242,238,229,0.78)_58%,_rgba(247,241,232,0.96)_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[48vh] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.68),_rgba(255,255,255,0.18)_42%,_transparent_78%)]"
      />

      <section className="relative z-10 flex min-h-screen flex-col px-6 py-6 sm:px-10 lg:px-16 lg:py-8">
        <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col">
          <header className="pt-1 text-center">
            <div className="mb-4 flex justify-center lg:justify-end">
              <div className="inline-flex items-center gap-1 rounded-full border border-white/55 bg-[rgba(248,245,238,0.68)] p-1 shadow-[0_10px_30px_rgba(20,37,45,0.08)] backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => setLanguage("en")}
                  className={`rounded-full px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.28em] transition ${
                    language === "en"
                      ? "bg-[var(--page-deep)] text-white"
                      : "text-[var(--page-soft)] hover:bg-white/60"
                  }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage("ko")}
                  className={`rounded-full px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.28em] transition ${
                    language === "ko"
                      ? "bg-[var(--page-deep)] text-white"
                      : "text-[var(--page-soft)] hover:bg-white/60"
                  }`}
                >
                  KO
                </button>
              </div>
            </div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.5em] text-[var(--page-accent)] sm:text-xs">
              Church of Seoul
            </p>
            <div className="mt-4 flex justify-center">
              <Image
                src="/logo.svg"
                alt="Calvary Chapel logo"
                width={2400}
                height={500}
                priority
                className="h-auto w-[20rem] max-w-full drop-shadow-[0_8px_24px_rgba(255,255,255,0.42)] sm:w-[24rem] lg:w-[30rem]"
              />
            </div>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[var(--page-soft)] sm:text-base">
              {t.description}
            </p>
          </header>

          <div className="flex flex-1 items-center justify-center py-8 sm:py-10 lg:py-8">
            <div className="w-full max-w-[15rem] sm:max-w-[18rem] lg:max-w-[19rem]">
              <Image
                src="/church.png"
                alt="Silhouette illustration of a church on a hill"
                className="h-auto w-full drop-shadow-[0_24px_40px_rgba(0,0,0,0.28)]"
                width={700}
                height={500}
                priority
              />
            </div>
          </div>

          <section
            aria-label="Church information"
            className="grid gap-px overflow-hidden rounded-[2rem] border border-white/50 bg-[rgba(255,255,255,0.34)] shadow-[0_24px_80px_rgba(30,52,57,0.18)] backdrop-blur-xl lg:grid-cols-3"
          >
            <article className="bg-[rgba(250,247,240,0.86)] px-6 py-6 sm:px-8 sm:py-7">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--page-accent)]">
                {t.worshipLabel}
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-[var(--page-deep)]">
                {t.worshipTitle}
              </h2>
              <ul className="mt-5 space-y-2.5 text-sm leading-6 text-[var(--page-muted)] sm:text-[0.95rem]">
                {t.worshipItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
                <li>
                  {t.youtubeLabel} |{" "}
                  <a
                    href="https://www.youtube.com/@calvarymoses"
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-[var(--page-deep)] underline decoration-[var(--page-accent)] underline-offset-4 transition hover:text-[var(--page-accent-strong)]"
                  >
                    {t.youtubeCta}
                  </a>
                </li>
              </ul>
            </article>

            <article className="bg-[rgba(241,247,246,0.9)] px-6 py-6 sm:px-8 sm:py-7">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--page-accent)]">
                {t.locationLabel}
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-[var(--page-deep)]">
                {t.locationTitle}
              </h2>
              <div className="mt-5 space-y-2.5 text-sm leading-6 text-[var(--page-muted)] sm:text-[0.95rem]">
                {t.locationLines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
                <p>
                  {t.phoneLabel} |{" "}
                  <a
                    href="tel:031-000-0000"
                    className="font-medium text-[var(--page-deep)] underline decoration-[var(--page-accent)] underline-offset-4 transition hover:text-[var(--page-accent-strong)]"
                  >
                    031-000-0000
                  </a>
                </p>
                <p>
                  {t.emailLabel} |{" "}
                  <a
                    href="mailto:mosesnara@hanmail.net"
                    className="font-medium text-[var(--page-deep)] underline decoration-[var(--page-accent)] underline-offset-4 transition hover:text-[var(--page-accent-strong)]"
                  >
                    mosesnara@hanmail.net
                  </a>
                </p>
              </div>
            </article>

            <article className="bg-[rgba(250,247,240,0.86)] px-6 py-6 sm:px-8 sm:py-7">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--page-accent)]">
                {t.schoolLabel}
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-[var(--page-deep)]">
                {t.schoolTitle}
              </h2>
              <ul className="mt-5 space-y-2.5 text-sm leading-6 text-[var(--page-muted)] sm:text-[0.95rem]">
                {t.schoolItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </section>
        </div>
      </section>
    </main>
  );
}
