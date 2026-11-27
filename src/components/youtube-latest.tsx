"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type Video = { id: string; title: string; thumbnail: string; publishedAt: string | null; isShort: boolean };

export function YouTubeLatest({ language }: { language: "ko" | "en" }) {
  const [videos, setVideos] = useState<Video[]>([]);

  useEffect(() => {
    let active = true;
    fetch("/api/youtube/latest?feedVersion=2")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => { if (active && data?.ok) setVideos(data.videos ?? []); })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  if (!videos.length) return null;
  const title = language === "ko" ? "최근 설교 영상" : "Recent Sermons";
  const shortsTitle = language === "ko" ? "최근 쇼츠" : "Latest Shorts";
  const more = language === "ko" ? "유튜브에서 더 보기" : "View more on YouTube";

  function VideoGrid({ items, shorts = false }: { items: Video[]; shorts?: boolean }) {
    return <div className={`mt-5 grid gap-4 ${shorts ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
      {items.slice(0, 6).map((video) => (
        <a key={video.id} href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noreferrer" className={`group overflow-hidden rounded-xl border border-[#d7e5f2] bg-white transition hover:-translate-y-0.5 hover:shadow-lg ${shorts ? "mx-auto w-full max-w-[150px]" : ""}`}>
          <div className={`relative overflow-hidden bg-[#eaf7ff] ${shorts ? "aspect-[9/16]" : "aspect-video"}`}><Image src={video.thumbnail} alt="" fill sizes={shorts ? "(max-width: 640px) 45vw, 150px" : "(max-width: 640px) 100vw, 33vw"} className="object-cover transition duration-300 group-hover:scale-105" /></div>
          <p className="line-clamp-2 px-3 py-3 text-sm font-semibold leading-5 text-[#173b62]">{video.title}</p>
        </a>
      ))}
    </div>;
  }
  const sermons = videos.filter((video) => !video.isShort);
  const shorts = videos.filter((video) => video.isShort);

  return (
    <section className="mt-8 mb-10 rounded-[1.5rem] border border-[#b9ddf5] bg-white/90 p-5 shadow-[0_16px_38px_rgba(8,39,91,0.08)] sm:mb-12 sm:p-7" aria-label={title}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="border-l-4 border-[#3f9fe8] pl-3 text-xl font-semibold text-[#08275b]">{title}</h2>
        <a href="https://www.youtube.com/@calvarymoses" target="_blank" rel="noreferrer" className="text-sm font-semibold text-[#075f9b] hover:underline">{more} ↗</a>
      </div>
      {sermons.length > 0 ? <VideoGrid items={sermons} /> : null}
      {shorts.length > 0 ? <div className="mt-8 border-t border-[#d7e5f2] pt-6"><h3 className="border-l-4 border-[#3f9fe8] pl-3 text-lg font-semibold text-[#08275b]">{shortsTitle}</h3><VideoGrid items={shorts} shorts /></div> : null}
    </section>
  );
}
