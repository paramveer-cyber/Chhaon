"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const istTime = () =>
  new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata" });

/** Fake iOS status bar: Delhi time, signal, wifi, battery. Shown only inside the desktop phone frame. */
const StatusBar = () => {
  const [time, setTime] = useState("");
  useEffect(() => {
    setTime(istTime());
    const timer = setInterval(() => setTime(istTime()), 20_000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-[1100] hidden h-[50px] items-center justify-between bg-page px-8 pt-1.5 text-ink md:flex">
      <span className="w-14 text-center font-heading text-[16px] font-semibold">{time}</span>
      <span className="flex items-center gap-1.5">
        <span className="flex h-[11px] items-end gap-[1.5px]">
          {[4, 6, 8.5, 11].map((height) => (
            <span key={height} className="w-[3px] rounded-[1px] bg-ink" style={{ height }} />
          ))}
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
          <path d="M12 20h.01M2 8.82a15 15 0 0 1 20 0M5 12.86a10 10 0 0 1 14 0M8.5 16.43a5 5 0 0 1 7 0" />
        </svg>
        <span className="flex items-center gap-px">
          <span className="flex h-3 w-[25px] rounded-[4px] border-[1.3px] border-ink/90 p-[1.5px]">
            <span className="w-[72%] rounded-[2px] bg-ink" />
          </span>
          <span className="h-1 w-[1.5px] rounded-r-[1px] bg-ink/50" />
        </span>
      </span>
    </div>
  );
};

/**
 * On a laptop the public app sits inside an iPhone 16 Pro frame, fully interactive, so it can be demoed next to the
 * ward office. On a phone (narrower than 768 px) every frame layer collapses and the app fills the screen as before.
 */
export const PhoneStage = ({ children }: { children: React.ReactNode }) => (
  <div className="md:flex md:min-h-screen md:items-center md:justify-center md:gap-16 md:bg-[#E9E3D7] md:px-8 md:py-6">
    <aside className="hidden max-w-[300px] flex-col gap-4 md:flex">
      <span className="font-heading text-[15px] font-semibold text-ink-faint">Public app</span>
      <h1 className="font-heading text-[34px] leading-[1.1] font-bold tracking-tight">Find a cool place on a hot day.</h1>
      <p className="font-body text-[17px] leading-snug text-ink-soft">
        This is what residents see on their phone. Pick a spot on the map, see the heat there, and walk to the nearest
        cooling point. Works in English and Hindi.
      </p>
      <p className="font-body text-[15px] text-ink-soft">
        Open <strong className="font-semibold text-ink">chhaon-psi.vercel.app/public</strong> on a phone to use it full screen.
      </p>
      <Link href="/ward" className="font-body text-[16px] font-semibold text-brand">
        See the ward office view →
      </Link>
    </aside>

    {/* titanium frame */}
    <div className="md:rounded-[72px] md:bg-[linear-gradient(150deg,#9A958E_0%,#D3CFC8_22%,#827E77_48%,#BEBAB3_74%,#8C8881_100%)] md:p-1 md:shadow-[0_30px_60px_rgba(28,26,22,.22),0_4px_12px_rgba(28,26,22,.12)]">
      {/* black bezel */}
      <div className="md:rounded-[68px] md:bg-[#0D0C0B] md:p-2">
        {/* screen: 402 x 874 like the design, shorter on small laptop screens so it always fits */}
        <div className="phone-screen md:relative md:h-[min(874px,calc(100vh-88px))] md:w-[402px] md:overflow-hidden md:rounded-[60px] md:bg-page">
          <StatusBar />
          <div className="pointer-events-none absolute top-[11px] left-1/2 z-[1200] hidden h-[37px] w-[125px] -translate-x-1/2 rounded-[19px] bg-black md:block" />
          <div className="phone-scroll md:absolute md:inset-x-0 md:top-[50px] md:bottom-0 md:overflow-y-auto md:overscroll-contain">
            {children}
          </div>
          <div className="pointer-events-none absolute bottom-2 left-1/2 z-[1200] hidden h-[5px] w-[140px] -translate-x-1/2 rounded-full bg-ink md:block" />
        </div>
      </div>
    </div>
  </div>
);
