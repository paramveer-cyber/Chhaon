"use client";

import { Skeleton } from "~/components/ui/skeleton";
import { useCyclingMessage } from "~/hooks/cycling-message";

const skeletonCardCount = 3;

type PlaceListSkeletonProps = { messages: readonly string[] };

export const PlaceListSkeleton = ({ messages }: PlaceListSkeletonProps) => {
  const currentMessage = useCyclingMessage(messages);

  return (
    <div role="status" className="flex flex-col gap-3">
      <p key={currentMessage} className="animate-rise font-body text-base text-ink-soft">
        {currentMessage}
      </p>
      {Array.from({ length: skeletonCardCount }, (_, cardIndex) => (
        <div key={cardIndex} className="flex flex-col gap-3 rounded-2xl bg-page p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-xl bg-line" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-2/3 bg-line" />
              <Skeleton className="h-3 w-1/3 bg-line" />
            </div>
          </div>
          <Skeleton className="h-6 w-1/2 rounded-full bg-line" />
        </div>
      ))}
    </div>
  );
};
