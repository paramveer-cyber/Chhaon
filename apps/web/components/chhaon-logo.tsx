import Link from "next/link";

export const ChhaonLogo = () => (
  <Link href="/" aria-label="Chhaon home" className="flex items-center gap-2.5">
    <svg role="img" aria-label="Chhaon" width={34} height={34} viewBox="0 0 120 120">
      <path d="M10 66 A50 50 0 0 1 110 66 Z" fill="#17504E" />
      <circle cx="60" cy="92" r="12" fill="#F08A3C" />
    </svg>
    <span className="font-brand text-3xl leading-none font-medium tracking-tight text-[#17504E]">chhaon</span>
  </Link>
);
