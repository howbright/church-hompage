import Link from "next/link";

export default function BulletinNotFound() {
  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-10 lg:px-10">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-black/10 bg-white/80 p-8 shadow-[0_24px_60px_rgba(40,40,40,0.08)]">
        <h1 className="text-3xl font-semibold text-[var(--page-deep)]">
          해당 주보를 찾을 수 없습니다
        </h1>
        <p className="mt-4 text-sm leading-7 text-[var(--page-muted)] md:text-base">
          주소가 잘못되었거나 아직 게시되지 않은 주보일 수 있습니다.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/bulletins"
            className="rounded-full bg-[var(--page-deep)] px-5 py-3 text-sm font-semibold text-white"
          >
            최신 주보 보기
          </Link>
          <Link
            href="/"
            className="rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-[var(--page-deep)]"
          >
            홈으로
          </Link>
        </div>
      </div>
    </main>
  );
}
