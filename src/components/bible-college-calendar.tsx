"use client";

import { useMemo, useState } from "react";
import type { BibleCollegeCalendarEvent } from "@/lib/bible-college-types";

const weekdays = ["일", "월", "화", "수", "목", "금", "토"];

function todayInKorea() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function moveMonth(month: string, offset: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  const next = new Date(Date.UTC(year, monthNumber - 1 + offset, 1));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function BibleCollegeCalendar({
  events,
}: {
  events: BibleCollegeCalendarEvent[];
}) {
  const today = todayInKorea();
  const initialMonth =
    events.find((event) => event.end_date >= today)?.start_date.slice(0, 7) ??
    today.slice(0, 7);
  const [month, setMonth] = useState(initialMonth);
  const [year, monthNumber] = month.split("-").map(Number);

  const days = useMemo(() => {
    const firstWeekday = new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay();
    const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
    return [
      ...Array.from({ length: firstWeekday }, () => null),
      ...Array.from({ length: lastDay }, (_, index) => index + 1),
    ];
  }, [monthNumber, year]);

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-[#d8e3ea] bg-white shadow-[0_18px_48px_rgba(15,44,62,0.07)]">
      <div className="flex items-center justify-between border-b border-[#e1e9ee] px-4 py-4 sm:px-6">
        <button
          type="button"
          onClick={() => setMonth((current) => moveMonth(current, -1))}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d8e3ea] text-[#36576b] transition hover:bg-[#f1f6f8]"
          aria-label="이전 달"
        >
          ←
        </button>
        <h3 className="text-lg font-bold text-[#17384d]">
          {year}년 {monthNumber}월
        </h3>
        <button
          type="button"
          onClick={() => setMonth((current) => moveMonth(current, 1))}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d8e3ea] text-[#36576b] transition hover:bg-[#f1f6f8]"
          aria-label="다음 달"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 border-b border-[#e7edf1] bg-[#f6f9fa] text-center text-xs font-bold text-[#708592]">
        {weekdays.map((weekday) => (
          <div key={weekday} className="py-2.5">
            {weekday}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day, index) => {
          const date = day
            ? `${month}-${String(day).padStart(2, "0")}`
            : "";
          const dayEvents = day
            ? events.filter(
                (event) => event.start_date <= date && event.end_date >= date,
              )
            : [];
          return (
            <div
              key={`${month}-${index}`}
              className={`min-h-20 border-b border-r border-[#edf1f4] p-1.5 sm:min-h-28 sm:p-2 ${
                day ? "bg-white" : "bg-[#fafcfd]"
              }`}
            >
              {day ? (
                <>
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                      date === today
                        ? "bg-[#17384d] text-white"
                        : "text-[#5f7481]"
                    }`}
                  >
                    {day}
                  </span>
                  <div className="mt-1 space-y-1">
                    {dayEvents.map((event) => (
                      <div
                        key={event.id}
                        title={event.description || event.title}
                        className="truncate rounded-md bg-[#e8f1f4] px-1.5 py-1 text-[0.62rem] font-semibold text-[#285369] sm:text-xs"
                      >
                        {event.title}
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="space-y-3 p-4 sm:p-6">
        <h4 className="text-sm font-bold text-[#17384d]">이번 달 일정</h4>
        {events.filter((event) => event.start_date.startsWith(month)).length ? (
          events
            .filter((event) => event.start_date.startsWith(month))
            .map((event) => (
              <article key={event.id} className="flex gap-3 text-sm">
                <time className="shrink-0 font-semibold text-[#3d7188]">
                  {event.start_date.slice(5).replace("-", ".")}
                  {event.end_date !== event.start_date
                    ? `–${event.end_date.slice(5).replace("-", ".")}`
                    : ""}
                </time>
                <div>
                  <p className="font-semibold text-[#17384d]">{event.title}</p>
                  {event.description ? (
                    <p className="mt-1 leading-6 text-[#687d89]">
                      {event.description}
                    </p>
                  ) : null}
                </div>
              </article>
            ))
        ) : (
          <p className="text-sm text-[#7b8e99]">등록된 일정이 없습니다.</p>
        )}
      </div>
    </div>
  );
}
