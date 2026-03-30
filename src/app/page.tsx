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
      {
        title: "Wednesday Worship",
        description: "7:00 PM",
      },
      {
        title: "Saturday Service",
        description: "2:00 PM",
      },
      {
        title: "Sunday Worship",
        description: "11:00 AM",
      },
    ],
    youtubeLabel: "YouTube Channel",
    youtubeCta: "Watch Online",
    locationLabel: "Location",
    locationTitle: "Find Our Location",
    locationMessage: "Please contact us by email.",
    locationItems: [
      {
        title: "Location",
        description: "Please contact us by email.",
      },
      {
        title: "Email",
        description: "mosesnara@hanmail.net",
        cta: "Write Email",
      },
    ],
    schoolLabel: "Ministries",
    schoolTitle: "Counseling & Bible Training",
    schoolItems: [
      {
        title: "Self-Confrontation",
        description:
          "Biblical counseling for depression, addiction, sexual brokenness, and life struggles",
      },
      {
        title: "Bible College",
        description:
          "In-depth study of Scripture from Genesis to Revelation",
      },
    ],
  },
  ko: {
    description:
      "갈보리채플은 척 스미스 목사님의 성경 강해 철학을 따라, 창세기부터 요한계시록까지 말씀을 장절별로 가르칩니다.",
    worshipLabel: "예배 안내",
    worshipTitle: "모임 시간",
    worshipItems: [
      {
        title: "수요 예배",
        description: "오후 7:00",
      },
      {
        title: "토요 예배",
        description: "오후 2:00",
      },
      {
        title: "주일 예배",
        description: "오전 11:00",
      },
    ],
    youtubeLabel: "유튜브 채널",
    youtubeCta: "온라인 예배 보기",
    locationLabel: "장소",
    locationTitle: "장소 안내",
    locationMessage: "이메일로 문의해주세요.",
    locationItems: [
      {
        title: "장소 안내",
        description: "이메일로 문의해주세요.",
      },
      {
        title: "이메일",
        description: "mosesnara@hanmail.net",
        cta: "메일쓰기",
      },
    ],
    schoolLabel: "사역 안내",
    schoolTitle: "상담과 성경 훈련",
    schoolItems: [
      {
        title: "자기대면",
        description:
          "성경적 상담을 통해 우울, 중독, 성중독, 동성애 등 삶의 문제를 말씀 안에서 다룹니다",
      },
      {
        title: "성경대학",
        description:
          "창세기부터 요한계시록까지 성경을 심도 있게 배웁니다",
      },
    ],
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
        className="absolute inset-0 bg-[linear-gradient(180deg,_rgba(224,240,239,0.22)_0%,_rgba(205,228,227,0.5)_26%,_rgba(232,241,238,0.64)_48%,_rgba(247,241,232,0.94)_100%)]"
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
            <div className="flex justify-center">
              <p className="rounded-full border border-white/60 bg-[rgba(248,245,238,0.72)] px-4 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.5em] text-[var(--page-accent-strong)] shadow-[0_10px_24px_rgba(20,37,45,0.08)] backdrop-blur-md sm:text-xs">
                Church of Seoul
              </p>
            </div>
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

          <div className="relative flex flex-1 items-center justify-center py-8 sm:py-10 lg:py-8">
            <div
              aria-hidden="true"
              className="absolute h-44 w-44 rounded-full bg-[radial-gradient(circle,_rgba(74,157,163,0.42)_0%,_rgba(74,157,163,0.2)_42%,_transparent_74%)] blur-3xl sm:h-60 sm:w-60"
            />
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
            <article className="bg-[linear-gradient(180deg,rgba(244,252,251,0.88)_0%,rgba(250,247,240,0.94)_22%,rgba(250,247,240,0.9)_100%)] px-6 py-6 sm:px-8 sm:py-7">
              <div className="mb-4 h-1.5 w-14 rounded-full bg-[var(--card-worship)]" />
              <p className="inline-flex rounded-full bg-[rgba(76,164,170,0.16)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-[var(--card-worship-deep)]">
                {t.worshipLabel}
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-[var(--page-deep)]">
                {t.worshipTitle}
              </h2>
              <ul className="mt-5 space-y-4 text-sm leading-6 text-[var(--page-muted)] sm:text-[0.95rem]">
                {t.worshipItems.map((item) => (
                  <li key={item.title} className="flex flex-wrap gap-x-2">
                    <span className="text-base font-semibold text-[var(--page-deep)]">
                      {item.title}
                    </span>
                    <span>{item.description}</span>
                  </li>
                ))}
                <li>
                  <p className="inline text-base font-semibold text-[var(--page-deep)]">
                    {t.youtubeLabel}
                  </p>
                  <span className="mx-2 inline">|</span>
                  <span>
                    <a
                      href="https://www.youtube.com/@calvarymoses"
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-[var(--page-accent-strong)] underline decoration-2 decoration-[var(--page-accent)] underline-offset-4 transition hover:text-[var(--page-deep)]"
                    >
                      {t.youtubeCta}
                    </a>
                  </span>
                </li>
              </ul>
            </article>

            <article className="bg-[linear-gradient(180deg,rgba(236,250,249,0.92)_0%,rgba(229,245,243,0.94)_18%,rgba(241,247,246,0.9)_100%)] px-6 py-6 sm:px-8 sm:py-7">
              <div className="mb-4 h-1.5 w-14 rounded-full bg-[var(--card-location)]" />
              <p className="inline-flex rounded-full bg-[rgba(55,150,147,0.16)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-[var(--card-location-deep)]">
                {t.locationLabel}
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-[var(--page-deep)]">
                {t.locationTitle}
              </h2>
              <ul className="mt-5 space-y-4 text-sm leading-6 text-[var(--page-muted)] sm:text-[0.95rem]">
                {t.locationItems.map((item) => (
                  <li key={item.title} className="flex flex-wrap gap-x-2">
                    <span className="text-base font-semibold text-[var(--page-deep)]">
                      {item.title}
                    </span>
                    <span>|</span>
                    <span>
                      {item.title === "Email" || item.title === "이메일" ? (
                        <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
                          <a
                            href="mailto:mosesnara@hanmail.net"
                            className="font-semibold text-[var(--page-accent-strong)] underline decoration-2 decoration-[var(--page-accent)] underline-offset-4 break-all transition hover:text-[var(--page-deep)]"
                          >
                            {item.description}
                          </a>
                          <a
                            href="mailto:mosesnara@hanmail.net"
                            className="text-sm font-semibold text-[var(--page-deep)] underline decoration-[var(--page-accent)] underline-offset-4 transition hover:text-[var(--page-accent-strong)]"
                          >
                            {item.cta}
                          </a>
                        </span>
                      ) : (
                        item.description
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="bg-[linear-gradient(180deg,rgba(241,251,250,0.8)_0%,rgba(250,247,240,0.92)_20%,rgba(250,247,240,0.9)_100%)] px-6 py-6 sm:px-8 sm:py-7">
              <div className="mb-4 h-1.5 w-14 rounded-full bg-[var(--card-school)]" />
              <p className="inline-flex rounded-full bg-[rgba(174,130,92,0.12)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-[var(--card-school-deep)]">
                {t.schoolLabel}
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-[var(--page-deep)]">
                {t.schoolTitle}
              </h2>
              <ul className="mt-5 space-y-4 text-sm leading-6 text-[var(--page-muted)] sm:text-[0.95rem]">
                {t.schoolItems.map((item) => (
                  <li key={item.title}>
                    <p className="text-base font-semibold text-[var(--page-deep)]">
                      {item.title}
                    </p>
                    <p className="mt-1">{item.description}</p>
                  </li>
                ))}
              </ul>
            </article>
          </section>
        </div>
      </section>
    </main>
  );
}
