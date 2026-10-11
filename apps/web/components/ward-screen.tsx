"use client";

import { useMemo, useState } from "react";
import { HeatGridMap } from "~/components/heat-grid-map";
import { ChhaonLogo } from "~/components/chhaon-logo";
import { PlaceCard } from "~/components/place-card";
import { PlaceListSkeleton } from "~/components/place-list-skeleton";
import { AnimatedNumber } from "~/components/animated-number";
import { HeatLoader } from "~/components/heat-loader";
import { InfoHint } from "~/components/info-hint";
import { ScreenSwitchLink } from "~/components/screen-switch-link";
import { StatTile } from "~/components/stat-tile";
import { useHeatGrid, type HeatLevel } from "~/hooks/heat";
import { usePlan } from "~/hooks/plan";
import { formatLongDate, formatPeople, formatPercent } from "~/lib/format";
import { demoHotDate, demoScopeNote } from "~/lib/demo";
import { heatLevelDetails, heatLevelOrder } from "~/lib/heat-level-details";
import { hintText } from "~/lib/hints";
import { heatMapLoadingMessages, planLoadingMessages } from "~/lib/loading-messages";
import { cn } from "~/lib/utils";

export const WardScreen = () => {
  const [selectedDate, setSelectedDate] = useState<string>(demoHotDate);
  const [visibleLevels, setVisibleLevels] = useState<Set<HeatLevel>>(() => new Set(heatLevelOrder));
  const [selectedPlaceId, setSelectedPlaceId] = useState<number>();
  const heatGridQuery = useHeatGrid(selectedDate);
  const planQuery = usePlan(selectedDate);

  const heatGrid = heatGridQuery.data?.data;
  const plan = planQuery.data?.data;
  const picks = useMemo(() => plan?.picks ?? [], [plan]);
  const errorMessage = heatGridQuery.error?.message ?? planQuery.error?.message;

  const toggleLevel = (heatLevel: HeatLevel) =>
    setVisibleLevels((currentLevels) => {
      const nextLevels = new Set(currentLevels);
      if (!nextLevels.delete(heatLevel)) nextLevels.add(heatLevel);
      return nextLevels;
    });

  return (
    <main className="mx-auto flex max-w-[1440px] flex-col gap-5 px-5 py-6 lg:px-10">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3.5">
            <ChhaonLogo />
            <span className="border-l border-line pl-3.5 font-body text-base text-ink-faint">Delhi ward office</span>
            <span className="rounded-full bg-heat-low-soft px-3 py-1 font-heading text-sm font-semibold text-heat-low-deep">
              Hackathon demo
            </span>
          </div>
          <h1 className="font-heading text-4xl leading-none font-bold tracking-tight">Delhi heat plan</h1>
          {heatGrid && (
            <p className="font-body text-lg text-ink-soft">
              {formatLongDate(heatGrid.date)}. Feels like {Math.round(heatGrid.apparentTemperatureMaxCelsius)}°C at
              most.
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
          <StatTile label="Places to open" value={<AnimatedNumber value={picks.length} format={formatPeople} />} hintText={hintText.placesToOpen} />
          {plan && <StatTile label="Covered now" value={<AnimatedNumber value={plan.coveragePercentBefore} format={formatPercent} />} hintText={hintText.coveredNow} />}
          {plan && <StatTile label="Covered after" value={<AnimatedNumber value={plan.coveragePercentAfter} format={formatPercent} />} hintText={hintText.coveredAfter} />}
          <label className="flex flex-col gap-1 font-body text-sm text-ink-faint">
            Day
            <input
              type="date"
              value={selectedDate}
              onChange={(changeEvent) => setSelectedDate(changeEvent.target.value || demoHotDate)}
              className="h-10 rounded-xl bg-surface px-3 font-body text-base text-ink"
            />
          </label>
        </div>
      </header>

      {errorMessage && (
        <p role="alert" className="rounded-2xl bg-heat-high-soft p-4 font-body text-lg text-heat-high-deep">
          {errorMessage}
        </p>
      )}

      {plan && picks.length === 0 && (
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-brand-soft p-4 pl-6">
          <p className="font-body text-lg text-brand-deep">
            No area has high heat on this day, so no new cooling point is needed. Choose a hotter day to see a plan.
          </p>
          <button
            type="button"
            onClick={() => setSelectedDate(demoHotDate)}
            className="h-11 rounded-xl bg-brand px-4 font-heading text-base font-semibold text-surface"
          >
            Show a hot day ({demoHotDate})
          </button>
        </section>
      )}

      {plan && picks.length > 0 && (
        <section className="flex flex-col gap-3 rounded-2xl bg-brand-soft p-4 pl-6">
          <p className="font-body text-lg text-brand-deep">
            <strong className="font-bold">
              {formatPercent(plan.coveragePercentAfter)} of high-risk people can reach a cooling point in 10 minutes
              on foot
            </strong>{" "}
            if you open the {picks.length} places on this list. Today the number is{" "}
            {formatPercent(plan.coveragePercentBefore)}.
          </p>
          <div
            key={`${selectedDate}-${plan.coveragePercentAfter}`}
            className="flex h-1.5 max-w-md origin-left animate-bar-grow overflow-hidden rounded-full bg-brand/15"
          >
            <div className="bg-brand-deep" style={{ width: `${plan.coveragePercentBefore}%` }} />
            <div
              className="bg-brand/55"
              style={{ width: `${Math.max(0, plan.coveragePercentAfter - plan.coveragePercentBefore)}%` }}
            />
          </div>
        </section>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_440px]">
        <section className="relative h-[70vh] min-h-[480px] overflow-hidden rounded-2xl bg-surface">
          <HeatGridMap
            heatGrid={heatGrid}
            visibleLevels={visibleLevels}
            picks={picks}
            selectedPlaceId={selectedPlaceId}
            onSelectPlace={setSelectedPlaceId}
          />
          <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
            <span className="flex w-fit items-center gap-1 rounded-xl bg-surface py-0.5 pr-1 pl-3 font-heading text-sm font-semibold text-ink-soft shadow-md">
              Surface heat, 250 m cells
              <InfoHint hintText={hintText.heatMap} />
            </span>
            <div className="flex gap-1 rounded-xl bg-surface p-1 shadow-md">
              {heatLevelOrder.map((heatLevel) => (
                <button
                  key={heatLevel}
                  type="button"
                  aria-pressed={visibleLevels.has(heatLevel)}
                  onClick={() => toggleLevel(heatLevel)}
                  className={cn(
                    "flex h-10 items-center gap-2 rounded-lg px-3 font-heading text-sm font-semibold",
                    visibleLevels.has(heatLevel) ? "bg-page text-ink" : "text-ink-faint",
                  )}
                >
                  <span className={cn("size-3 rounded-full", heatLevelDetails[heatLevel].swatchClass)} />
                  {heatLevelDetails[heatLevel].label}
                </button>
              ))}
            </div>
          </div>
          {heatGridQuery.isFetching && (
            <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-page/70 backdrop-blur-sm">
              <HeatLoader messages={heatMapLoadingMessages} />
            </div>
          )}
        </section>

        <aside id="plan" className="flex max-h-[70vh] min-h-[480px] flex-col gap-4 overflow-auto rounded-2xl bg-surface p-6">
          <div className="flex flex-col gap-1">
            <h2 className="font-heading text-2xl font-bold tracking-tight">Places to open</h2>
            <p className="font-body text-base text-ink-soft">
              Ranked by the high-risk people that each place newly covers.
            </p>
          </div>
          {planQuery.isFetching && <PlaceListSkeleton messages={planLoadingMessages} />}
          {plan && picks.length === 0 && <p className="font-body text-base text-ink-soft">No places to open.</p>}
          {picks.map((pick, pickIndex) => (
            <PlaceCard
              key={pick.id}
              enterIndex={pickIndex}
              place={pick}
              rankLabel={String(pick.rank)}
              isSelected={pick.id === selectedPlaceId}
              onSelect={() => setSelectedPlaceId(pick.id)}
            >
              <p className="font-body text-base text-ink-soft">
                <strong className="font-heading font-bold text-ink">
                  <AnimatedNumber value={pick.peopleNewlyCovered} format={formatPeople} />
                </strong>{" "}
                people newly covered
              </p>
            </PlaceCard>
          ))}
        </aside>
      </div>

      <ScreenSwitchLink href="/public" label="Need a cool place now? Find the nearest one" />

      {heatGrid && (
        <p className="font-body text-sm text-ink-faint">
          Surface heat comes from the last clear satellite pass ({heatGrid.surfaceHeatDataRange.startDate} to{" "}
          {heatGrid.surfaceHeatDataRange.endDate}) and the weather of the day. It is not air temperature.{" "}
          {demoScopeNote}
        </p>
      )}
    </main>
  );
};
