"use client";

import { Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";

type InfoHintProps = { hintText: string };

export const InfoHint = ({ hintText }: InfoHintProps) => (
  <Popover>
    <PopoverTrigger asChild>
      <button
        type="button"
        aria-label="More information"
        className="inline-flex size-6 shrink-0 items-center justify-center rounded-full text-sun-deep hover:bg-sun-soft focus-visible:ring-2 focus-visible:ring-sun"
      >
        <Info size={16} />
      </button>
    </PopoverTrigger>
    <PopoverContent side="top" className="z-[2000] w-64 border-line bg-surface p-3 font-body text-sm text-ink-soft">
      {hintText}
    </PopoverContent>
  </Popover>
);
