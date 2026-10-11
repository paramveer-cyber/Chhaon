"use client";

import { useCyclingMessage } from "~/hooks/cycling-message";

const loaderColumnCount = 6;
const loaderRowCount = 4;
const waveDelayInMilliseconds = 140;

type HeatLoaderProps = { messages: readonly string[] };

export const HeatLoader = ({ messages }: HeatLoaderProps) => {
  const currentMessage = useCyclingMessage(messages);

  return (
    <div role="status" className="flex flex-col items-center gap-4 rounded-2xl bg-surface p-6 shadow-md">
      <div aria-hidden className="grid grid-cols-6 gap-1">
        {Array.from({ length: loaderColumnCount * loaderRowCount }, (_, cellIndex) => {
          const columnIndex = cellIndex % loaderColumnCount;
          const rowIndex = Math.floor(cellIndex / loaderColumnCount);
          return (
            <span
              key={cellIndex}
              className="size-5 animate-heat-cell rounded-sm bg-heat-low"
              style={{ animationDelay: `${(columnIndex + rowIndex) * waveDelayInMilliseconds}ms` }}
            />
          );
        })}
      </div>
      <p key={currentMessage} className="animate-rise font-heading text-base font-semibold text-ink">
        {currentMessage}
      </p>
    </div>
  );
};
