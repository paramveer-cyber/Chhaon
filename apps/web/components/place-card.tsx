"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { cn } from "~/lib/utils";
import { InfoHint } from "~/components/info-hint";
import {
  hoursStatusHints,
  hoursStatusLabels,
  placeTypeDetails,
  waterConfidenceHints,
  waterConfidenceLabels,
} from "~/lib/place-details";
import type { PlanPick } from "~/hooks/plan";

type PlaceCardProps = {
  place: Pick<PlanPick, "name" | "type" | "waterConfidence" | "hoursStatus">;
  rankLabel?: string;
  enterIndex?: number;
  isSelected?: boolean;
  onSelect?: () => void;
  children?: ReactNode;
};

const enterStaggerInMilliseconds = 70;

const tagClassName =
  "flex items-center gap-0.5 rounded-full bg-surface py-0.5 pr-1 pl-2.5 font-body text-sm font-medium text-ink-soft";

export const PlaceCard = ({
  place,
  rankLabel,
  enterIndex = 0,
  isSelected = false,
  onSelect,
  children,
}: PlaceCardProps) => {
  const { label, Icon } = placeTypeDetails[place.type];
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isSelected) cardRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [isSelected]);

  return (
    <div
      ref={cardRef}
      style={{ animationDelay: `${enterIndex * enterStaggerInMilliseconds}ms` }}
      className={cn(
        "flex animate-rise flex-col gap-3 rounded-2xl bg-page p-4 text-left transition",
        isSelected && "ring-2 ring-brand",
        onSelect && "cursor-pointer hover:-translate-y-0.5 active:scale-[0.99]",
      )}
      onClick={onSelect}
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onKeyDown={(keyboardEvent) => {
        const isCardKey = keyboardEvent.key === "Enter" || keyboardEvent.key === " ";
        if (onSelect && isCardKey && keyboardEvent.target === keyboardEvent.currentTarget) {
          keyboardEvent.preventDefault();
          onSelect();
        }
      }}
    >
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface text-ink-soft">
          {rankLabel ? <span className="font-heading text-lg font-bold">{rankLabel}</span> : <Icon size={20} />}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="font-heading text-lg leading-tight font-semibold">{place.name}</span>
          <span className="font-body text-base text-ink-soft">{label}</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <span className={tagClassName}>
          {waterConfidenceLabels[place.waterConfidence]}
          <InfoHint hintText={waterConfidenceHints[place.waterConfidence]} />
        </span>
        <span className={tagClassName}>
          {hoursStatusLabels[place.hoursStatus]}
          <InfoHint hintText={hoursStatusHints[place.hoursStatus]} />
        </span>
      </div>
      {children}
    </div>
  );
};
