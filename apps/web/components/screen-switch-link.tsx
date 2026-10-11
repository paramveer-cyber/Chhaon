import Link from "next/link";
import { ArrowRight } from "lucide-react";

type ScreenSwitchLinkProps = { href: string; label: string };

export const ScreenSwitchLink = ({ href, label }: ScreenSwitchLinkProps) => (
  <Link href={href} className="flex items-center gap-2 font-heading text-base font-semibold text-brand hover:underline">
    {label}
    <ArrowRight size={18} />
  </Link>
);
