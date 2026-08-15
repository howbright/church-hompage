"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { GalleryEntry, GalleryPhoto } from "@/lib/galleries";

type SelectedPhoto = {
  photos: GalleryPhoto[];
  index: number;
};

function formatGalleryDate(entry: GalleryEntry) {
  if (entry.date_label) return entry.date_label;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(`${entry.event_date}T00:00:00+09:00`));
}

export function GalleryFeed({ entries }: { entries: GalleryEntry[] }) {
  const [selected, setSelected] = useState<SelectedPhoto | null>(null);

  useEffect(() => {
    if (!selected) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
      if (event.key === "ArrowRight") {
        setSelected((current) =>
          current
            ? { ...current, index: (current.index + 1) % current.photos.length }
            : null,
        );
      }
      if (event.key === "ArrowLeft") {
        setSelected((current) =>
          current
            ? {
                ...current,
                index:
                  (current.index - 1 + current.photos.length) %
                  current.photos.length,
              }
            : null,
        );
      }
    };
    window.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [selected]);

  if (!entries.length) {
    return (
      <div className="rounded-[1.75rem] border border-[#cbe5f6] bg-white p-10 text-center shadow-[0_14px_40px_rgba(8,39,91,0.06)]">
        <p className="text-lg font-bold text-[#08275b]">아직 공개된 이야기가 없습니다.</p>
        <p className="mt-2 text-sm text-[#65798a]">공동체의 새로운 기록을 준비하고 있습니다.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-14">
        {entries.map((entry) => (
          <article key={entry.id} className="border-b border-[#d9eaf5] pb-14 last:border-0">
            <p className="text-xs font-extrabold tracking-[0.2em] text-[#1678b8]">
              {formatGalleryDate(entry)}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight text-[#08275b] sm:text-3xl">
                {entry.title}
              </h2>
              {entry.visibility === "members" ? (
                <span className="rounded-full bg-[#eaf7ff] px-2.5 py-1 text-[0.68rem] font-bold text-[#075f9b]">
                  구성원 공개
                </span>
              ) : null}
            </div>
            {entry.description ? (
              <p className="mt-3 max-w-3xl whitespace-pre-wrap text-sm leading-7 text-[#56697a] sm:text-base sm:leading-8">
                {entry.description}
              </p>
            ) : null}
            <div className="mt-6 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 [scrollbar-width:thin] [scrollbar-color:#9dcfec_transparent] sm:gap-4">
              {entry.gallery_photos.map((photo, index) =>
                photo.signed_url ? (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() =>
                      setSelected({ photos: entry.gallery_photos, index })
                    }
                    className="group relative aspect-[4/3] w-[82vw] max-w-[31rem] shrink-0 snap-start overflow-hidden rounded-2xl bg-[#dcebf4] text-left sm:w-[46vw] lg:w-[31%]"
                    aria-label={`${entry.title} 사진 ${index + 1} 크게 보기`}
                  >
                    <Image
                      src={photo.signed_url}
                      alt={photo.alt_text || `${entry.title} 사진 ${index + 1}`}
                      fill
                      unoptimized
                      sizes="(max-width: 640px) 82vw, (max-width: 1024px) 46vw, 31vw"
                      className="object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                    {photo.caption ? (
                      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-3 pt-10 text-xs font-medium text-white">
                        {photo.caption}
                      </span>
                    ) : null}
                  </button>
                ) : null,
              )}
            </div>
            <p className="mt-2 text-xs font-semibold text-[#718596]">
              사진 {entry.gallery_photos.length}장 · 옆으로 넘겨보세요
            </p>
          </article>
        ))}
      </div>

      {selected && selected.photos[selected.index]?.signed_url ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="사진 크게 보기"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setSelected(null)}
        >
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-2xl text-white hover:bg-white/25"
            aria-label="사진 닫기"
          >
            ×
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setSelected({
                ...selected,
                index:
                  (selected.index - 1 + selected.photos.length) %
                  selected.photos.length,
              });
            }}
            className="absolute left-3 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-3xl text-white hover:bg-white/25"
            aria-label="이전 사진"
          >
            ‹
          </button>
          <div
            className="relative flex max-h-[90vh] max-w-[90vw] flex-col items-center"
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={selected.photos[selected.index].signed_url!}
              alt={selected.photos[selected.index].alt_text || "갤러리 사진"}
              width={selected.photos[selected.index].width}
              height={selected.photos[selected.index].height}
              unoptimized
              className="max-h-[82vh] w-auto max-w-full rounded-xl object-contain"
            />
            {selected.photos[selected.index].caption ? (
              <p className="mt-3 text-center text-sm text-white/85">
                {selected.photos[selected.index].caption}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setSelected({
                ...selected,
                index: (selected.index + 1) % selected.photos.length,
              });
            }}
            className="absolute right-3 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-3xl text-white hover:bg-white/25"
            aria-label="다음 사진"
          >
            ›
          </button>
        </div>
      ) : null}
    </>
  );
}
