import { churchConfig } from "@/lib/church-config";

export function SocialLinks({ compact = false }: { compact?: boolean }) {
  const linkClassName = `inline-flex max-w-full items-center gap-2 font-semibold text-[#075f9b] transition hover:text-[#08275b] ${
    compact ? "text-xs" : "text-sm"
  }`;

  return (
    <div className="flex flex-col items-start gap-2.5">
      <a
        href={churchConfig.youtubeUrl}
        target="_blank"
        rel="noreferrer"
        aria-label="YouTube: @calvarymoses"
        className={linkClassName}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-5 w-5 shrink-0 fill-none stroke-current"
          strokeWidth="1.8"
        >
          <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
          <path d="m10 9 5 3-5 3Z" className="fill-current stroke-none" />
        </svg>
        <span className="break-all underline decoration-2 decoration-[#7fc5ef] underline-offset-4">
          @calvarymoses
        </span>
      </a>
      <a
        href={churchConfig.instagramUrl}
        target="_blank"
        rel="noreferrer"
        aria-label="Instagram: @calvary_chapel_gangnam"
        className={linkClassName}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-5 w-5 shrink-0 fill-none stroke-current"
          strokeWidth="1.8"
        >
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4.25" />
          <circle
            cx="17.4"
            cy="6.7"
            r="1"
            className="fill-current stroke-none"
          />
        </svg>
        <span className="break-all underline decoration-2 decoration-[#7fc5ef] underline-offset-4">
          @calvary_chapel_gangnam
        </span>
      </a>
    </div>
  );
}
