"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Check, Navigation, Search, Undo2, X } from "lucide-react";
import { HeatLoader } from "~/components/heat-loader";
import { PlaceListSkeleton } from "~/components/place-list-skeleton";
import { ControlMap } from "~/components/ward/control-map";
import { useHeatGrid, type HeatLevel } from "~/hooks/heat";
import { usePlan, type PlanPick } from "~/hooks/plan";
import { demoHotDate } from "~/lib/demo";
import { formatPeople, formatPercent, walkingDirectionsUrlFor } from "~/lib/format";
import { formatDay } from "~/lib/public-copy";
import { heatGradientCss } from "~/lib/heat-colour";
import { heatLevelOrder } from "~/lib/heat-level-details";
import { heatMapLoadingMessages, planLoadingMessages } from "~/lib/loading-messages";
import { hoursStatusLabels, placeTypeDetails, waterConfidenceLabels } from "~/lib/place-details";
import { cn } from "~/lib/utils";

const levelChip: Record<HeatLevel, { label: string; on: string; dot: string }> = {
  high: { label: "High", on: "bg-heat-high-soft text-ink", dot: "bg-heat-high" },
  medium: { label: "Medium", on: "bg-heat-medium-soft text-ink", dot: "bg-heat-medium" },
  low: { label: "Low", on: "bg-heat-low-soft text-ink", dot: "bg-heat-low" },
};

const dataSources = [
  "Landsat 8–9 surface heat",
  "Sentinel-2 on AWS Open Data",
  "WorldPop population",
  "Open-Meteo weather",
  "Walking routes by Amazon Location",
];

const nowHHMM = () => new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });

/** Which places the officer has asked, kept on this device for the demo (the API has no write for it yet). */
const useAskedPlaces = (date: string) => {
  const storageKey = `chhaon-asked-${date}`;
  const [asked, setAsked] = useState<Record<number, string>>({});
  useEffect(() => {
    try {
      setAsked(JSON.parse(localStorage.getItem(storageKey) ?? "{}") as Record<number, string>);
    } catch {
      setAsked({});
    }
  }, [storageKey]);
  const save = (next: Record<number, string>) => {
    setAsked(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      /* not remembered after reload */
    }
  };
  return {
    asked,
    ask: (ids: number[]) => save({ ...asked, ...Object.fromEntries(ids.map((id) => [id, nowHHMM()])) }),
    undo: (id: number) => {
      const next = { ...asked };
      delete next[id];
      save(next);
    },
  };
};

const Chip = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-page px-3 font-body text-[15px] text-ink">{children}</span>
);

const Stat = ({ label, value, tone }: { label: string; value: string; tone: "ink" | "teal" | "red" }) => (
  <div className="flex items-baseline gap-2.5">
    <span className="font-body text-[17px] text-ink-soft">{label}</span>
    <span
      className={cn(
        "font-heading text-[32px] leading-none font-bold tracking-tight",
        tone === "teal" ? "text-brand" : tone === "red" ? "text-heat-high" : "text-ink",
      )}
    >
      {value}
    </span>
  </div>
);

export const WardControlRoom = () => {
  const [selectedDate, setSelectedDate] = useState(demoHotDate);
  const [visibleLevels, setVisibleLevels] = useState<Set<HeatLevel>>(() => new Set(heatLevelOrder));
  const [selectedPlaceId, setSelectedPlaceId] = useState<number>();
  const [query, setQuery] = useState("");
  const [onlyNotAsked, setOnlyNotAsked] = useState(false);
  const heatGridQuery = useHeatGrid(selectedDate);
  const planQuery = usePlan(selectedDate);
  const { asked, ask, undo } = useAskedPlaces(selectedDate);
  const panelRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (selectedPlaceId !== undefined) panelRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [selectedPlaceId]);

  const heatGrid = heatGridQuery.data?.data;
  const plan = planQuery.data?.data;
  const picks = useMemo(() => plan?.picks ?? [], [plan]);
  const errorMessage = heatGridQuery.error?.message ?? planQuery.error?.message;
  const askedIds = useMemo(() => new Set(Object.keys(asked).map(Number)), [asked]);
  const selectedPick = picks.find(({ id }) => id === selectedPlaceId);
  const mostCovered = Math.max(1, ...picks.map(({ peopleNewlyCovered }) => peopleNewlyCovered));
  const notAskedIds = picks.filter(({ id }) => !askedIds.has(id)).map(({ id }) => id);

  const levelCounts = useMemo(() => {
    const counts: Record<HeatLevel, number> = { high: 0, medium: 0, low: 0 };
    heatGrid?.cells.forEach(({ heatLevel }) => (counts[heatLevel] += 1));
    return counts;
  }, [heatGrid]);

  const shownPicks = picks.filter(
    (pick) =>
      (!onlyNotAsked || !askedIds.has(pick.id)) &&
      (!query.trim() ||
        `${pick.name} ${placeTypeDetails[pick.type].label}`.toLowerCase().includes(query.trim().toLowerCase())),
  );

  const toggleLevel = (level: HeatLevel) =>
    setVisibleLevels((current) => {
      const next = new Set(current);
      if (!next.delete(level)) next.add(level);
      return next;
    });
  const highOnly = visibleLevels.size === 1 && visibleLevels.has("high");

  const askButton = (pick: PlanPick, large = false) =>
    askedIds.has(pick.id) ? (
      <span className="flex items-center gap-2">
        <span className={cn("flex items-center gap-1.5 font-body text-brand-deep", large ? "text-[17px]" : "text-[15px]")}>
          <Check size={17} /> Asked at {asked[pick.id]}
        </span>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            undo(pick.id);
          }}
          aria-label={`Undo request to ${pick.name}`}
          className="grid size-8 place-items-center rounded-lg text-ink-faint hover:bg-page hover:text-ink"
        >
          <Undo2 size={16} />
        </button>
      </span>
    ) : (
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          ask([pick.id]);
        }}
        className={cn(
          "flex items-center gap-2 rounded-xl bg-brand font-heading font-semibold text-surface hover:bg-brand-deep",
          large ? "h-12 px-5 text-[17px]" : "h-11 px-4 text-[16px]",
        )}
      >
        Ask to open <ArrowRight size={17} />
      </button>
    );

  return (
    <main className="mx-auto flex max-w-[1440px] flex-col gap-5 px-6 py-8 lg:px-10">
      {/* ---------- header ---------- */}
      <header className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3.5">
            <Link href="/" aria-label="Chhaon home" className="flex items-center gap-3">
              <svg role="img" aria-label="Chhaon" width={44} height={44} viewBox="0 0 120 120">
                <path d="M10 66 A50 50 0 0 1 110 66 Z" fill="#17504E" />
                <circle cx="60" cy="92" r="12" fill="#F08A3C" />
              </svg>
              <span className="font-brand text-[34px] leading-none font-medium tracking-tight text-[#17504E]">chhaon</span>
            </Link>
            <span className="border-l border-line pl-3.5 font-body text-[17px] text-ink-faint">Delhi ward office</span>
          </div>
          <h1 className="font-heading text-[56px] leading-none font-bold tracking-[-0.025em]">Delhi today</h1>
          <p className="font-body text-[19px] text-ink-soft">
            {heatGrid
              ? `${formatDay(heatGrid.date)}. Feels like ${Math.round(heatGrid.apparentTemperatureMaxCelsius)}°C at most.`
              : formatDay(selectedDate)}
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-x-10 gap-y-4">
          {heatGrid && <Stat label="High-heat cells" value={formatPeople(levelCounts.high)} tone="red" />}
          {plan && <Stat label="Covered now" value={formatPercent(plan.coveragePercentBefore)} tone="ink" />}
          {plan && <Stat label="After the plan" value={formatPercent(plan.coveragePercentAfter)} tone="teal" />}
          <label className="flex items-center gap-2 rounded-xl bg-surface py-1.5 pr-1.5 pl-3.5 font-body text-[15px] text-ink-faint shadow-sm">
            Day
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => {
                setSelectedDate(event.target.value || demoHotDate);
                setSelectedPlaceId(undefined);
              }}
              className="h-9 rounded-lg bg-page px-2.5 font-body text-[16px] text-ink"
            />
          </label>
        </div>
      </header>

      {errorMessage && (
        <div role="alert" className="flex items-center justify-between gap-4 rounded-2xl bg-heat-high-soft px-6 py-4">
          <p className="font-body text-[17px] text-heat-high-deep">We could not load the heat data. {errorMessage}</p>
          <button
            type="button"
            onClick={() => {
              void heatGridQuery.refetch();
              void planQuery.refetch();
            }}
            className="h-10 shrink-0 rounded-xl bg-surface px-4 font-heading text-[15px] font-semibold"
          >
            Try again
          </button>
        </div>
      )}

      {/* ---------- coverage alert ---------- */}
      {plan && picks.length > 0 && (
        <section className="flex flex-wrap items-center justify-between gap-5 rounded-2xl bg-heat-high-soft px-6 py-5">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <AlertTriangle size={24} className="mt-0.5 shrink-0 text-heat-high" />
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <p className="font-body text-[19px] leading-snug text-heat-high-deep">
                <strong className="font-semibold">
                  Only {formatPercent(plan.coveragePercentBefore)} of high-risk people live within a 10-minute walk of a
                  cooling point.
                </strong>{" "}
                Open the {picks.length} places below to reach {formatPercent(plan.coveragePercentAfter)}.
              </p>
              <div className="flex items-center gap-4">
                <div
                  key={`${selectedDate}-${plan.coveragePercentAfter}`}
                  className="flex h-2 w-full max-w-[420px] origin-left animate-bar-grow overflow-hidden rounded-full bg-heat-high/15"
                >
                  <div className="bg-heat-high" style={{ width: `${plan.coveragePercentBefore}%` }} />
                  <div
                    className="bg-brand"
                    style={{ width: `${Math.max(0, plan.coveragePercentAfter - plan.coveragePercentBefore)}%` }}
                  />
                </div>
                <span className="font-body text-[16px] font-semibold whitespace-nowrap text-heat-high-deep">
                  {formatPercent(plan.coveragePercentBefore)} now → {formatPercent(plan.coveragePercentAfter)} after
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={highOnly}
            onClick={() => setVisibleLevels(highOnly ? new Set(heatLevelOrder) : new Set<HeatLevel>(["high"]))}
            className="flex h-12 items-center gap-3 rounded-xl bg-surface pr-3 pl-4 font-body text-[17px] font-semibold text-ink"
          >
            High heat only
            <span className={cn("flex h-6 w-11 items-center rounded-full p-0.5 transition-colors", highOnly ? "bg-brand" : "bg-line")}>
              <span className={cn("size-5 rounded-full bg-surface shadow transition-transform", highOnly && "translate-x-5")} />
            </span>
          </button>
        </section>
      )}

      {plan && picks.length === 0 && (
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-brand-soft px-6 py-4">
          <p className="font-body text-[17px] text-brand-deep">
            No area has high heat on this day, so no new cooling point is needed. Pick a hotter day to see a plan.
          </p>
          <button
            type="button"
            onClick={() => setSelectedDate(demoHotDate)}
            className="h-11 rounded-xl bg-brand px-4 font-heading text-[16px] font-semibold text-surface"
          >
            Show a hot day
          </button>
        </section>
      )}

      {/* ---------- data sources line ---------- */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 font-body text-[15px] text-ink-soft">
        <span className="text-ink-faint">Data</span>
        {dataSources.map((source, sourceIndex) => (
          <span key={source} className="flex items-center gap-2">
            <span className={cn("size-1.5 rounded-full", sourceIndex === 0 ? "bg-brand" : "bg-ink-faint/50")} />
            {source}
          </span>
        ))}
      </div>

      {/* ---------- map + panel ---------- */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_470px]">
        <section className="relative h-[780px] overflow-hidden rounded-[20px] bg-surface">
          <ControlMap
            heatGrid={heatGrid}
            visibleLevels={visibleLevels}
            picks={picks}
            askedIds={askedIds}
            selectedPlaceId={selectedPlaceId}
            onSelectPlace={setSelectedPlaceId}
          />
          <div className="pointer-events-none absolute top-5 left-5 z-[1000] flex flex-col gap-2.5">
            <span className="w-fit rounded-xl bg-surface/95 px-3.5 py-2 font-heading text-[16px] font-semibold text-ink-soft shadow-sm">
              Surface heat, 250 m cells
            </span>
            <div className="pointer-events-auto flex gap-1.5 rounded-2xl bg-surface p-1.5 shadow-md">
              {heatLevelOrder.map((level) => (
                <button
                  key={level}
                  type="button"
                  aria-pressed={visibleLevels.has(level)}
                  onClick={() => toggleLevel(level)}
                  className={cn(
                    "flex h-10 items-center gap-2 rounded-xl px-3.5 font-heading text-[16px] font-semibold",
                    visibleLevels.has(level) ? levelChip[level].on : "text-ink-faint",
                  )}
                >
                  <span className={cn("size-3 rotate-45 rounded-[2px]", levelChip[level].dot)} />
                  {levelChip[level].label}
                  {heatGrid && <span className="font-body font-medium text-ink-soft">{formatPeople(levelCounts[level])}</span>}
                </button>
              ))}
            </div>
          </div>
          <div className="pointer-events-none absolute bottom-5 left-5 z-[1000] flex flex-col gap-2 rounded-2xl bg-surface/95 px-4 py-3 shadow-md">
            <div className="h-2 w-48 rounded-full" style={{ background: heatGradientCss }} />
            <div className="flex w-48 justify-between font-body text-[13px] text-ink-soft">
              <span>Cooler</span>
              <span>Hotter</span>
            </div>
            <div className="flex items-center gap-4 font-body text-[14px] text-ink">
              <span className="flex items-center gap-1.5">
                <span className="grid size-5 place-items-center rounded-full bg-brand font-heading text-[11px] font-bold text-surface">1</span>
                To open
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-5 rounded-full border-2 border-dashed border-brand bg-surface" />
                Asked
              </span>
            </div>
          </div>
          {heatGridQuery.isFetching && (
            <div className="absolute inset-0 z-[1001] flex items-center justify-center bg-page/70 backdrop-blur-sm">
              <HeatLoader messages={heatMapLoadingMessages} />
            </div>
          )}
        </section>

        <aside ref={panelRef} className="flex h-[780px] flex-col gap-5 overflow-auto rounded-[20px] bg-surface p-6 [&>*]:shrink-0">
          {selectedPick && (
            <section className="flex animate-rise flex-col gap-3 border-b border-line pb-5">
              <div className="flex items-start justify-between gap-3">
                <span className="w-fit rounded-full bg-heat-high-soft px-3.5 py-1.5 font-heading text-[15px] font-semibold text-heat-high-deep">
                  Rank {selectedPick.rank} of {picks.length}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedPlaceId(undefined)}
                  aria-label="Close"
                  className="grid size-9 place-items-center rounded-lg text-ink-faint hover:bg-page hover:text-ink"
                >
                  <X size={18} />
                </button>
              </div>
              <h2 className="font-heading text-[36px] leading-[1.05] font-bold tracking-[-0.025em]">{selectedPick.name}</h2>
              <p className="font-body text-[18px] leading-snug text-ink-soft">
                {placeTypeDetails[selectedPick.type].label}. Opening it brings{" "}
                <strong className="font-semibold text-ink">{formatPeople(selectedPick.peopleNewlyCovered)} more high-risk people</strong>{" "}
                within a 10-minute walk of a cooling point.
              </p>
              <div className="flex flex-wrap gap-2">
                <Chip>{waterConfidenceLabels[selectedPick.waterConfidence]}</Chip>
                <Chip>{hoursStatusLabels[selectedPick.hoursStatus]}</Chip>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {askButton(selectedPick, true)}
                <a
                  href={walkingDirectionsUrlFor(selectedPick)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-12 items-center gap-2 rounded-xl bg-brand-soft px-4 font-heading text-[16px] font-semibold text-brand-deep"
                >
                  <Navigation size={17} /> Directions
                </a>
              </div>
            </section>
          )}

          <div className="flex items-end justify-between gap-3">
            <div className="flex flex-col gap-1">
              <h2 className="font-heading text-[24px] font-bold tracking-tight">Places to open</h2>
              <p className="font-body text-[16px] text-ink-soft">Ranked by the high-risk people each place newly reaches.</p>
            </div>
            <div className="flex shrink-0 rounded-xl bg-page p-1">
              {[
                { label: "All", value: false },
                { label: "Not asked", value: true },
              ].map(({ label, value }) => (
                <button
                  key={label}
                  type="button"
                  aria-pressed={onlyNotAsked === value}
                  onClick={() => setOnlyNotAsked(value)}
                  className={cn(
                    "h-9 rounded-lg px-3 font-heading text-[15px] font-semibold",
                    onlyNotAsked === value ? "bg-surface text-ink shadow-sm" : "text-ink-soft",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <label className="flex h-12 items-center gap-2.5 rounded-xl bg-page px-3.5">
            <Search size={18} className="text-ink-faint" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search places by name or type"
              className="h-full flex-1 bg-transparent font-body text-[17px] outline-none placeholder:text-ink-faint"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="text-ink-faint hover:text-ink">
                <X size={17} />
              </button>
            )}
          </label>

          {notAskedIds.length > 1 && (
            <button
              type="button"
              onClick={() => ask(notAskedIds)}
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-brand font-heading text-[17px] font-semibold text-surface hover:bg-brand-deep"
            >
              Ask all {notAskedIds.length} to open <ArrowRight size={17} />
            </button>
          )}

          {planQuery.isFetching && <PlaceListSkeleton messages={planLoadingMessages} />}

          <div className="flex flex-col gap-3">
            {shownPicks.map((pick, pickIndex) => {
              const { Icon, label } = placeTypeDetails[pick.type];
              const isAsked = askedIds.has(pick.id);
              return (
                <article
                  key={pick.id}
                  onClick={() => setSelectedPlaceId(pick.id)}
                  style={{ animationDelay: `${pickIndex * 40}ms` }}
                  className={cn(
                    "flex animate-rise cursor-pointer flex-col gap-3 rounded-2xl bg-[#FBF8F2] p-4 transition-shadow hover:shadow-md",
                    pick.id === selectedPlaceId && "ring-2 ring-ink",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface">
                      <Icon size={20} className="text-brand" />
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <h3 className="font-heading text-[18px] leading-tight font-semibold">{pick.name}</h3>
                      <p className="font-body text-[15px] text-ink-soft">
                        {label} · rank {pick.rank}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2.5 py-1 font-heading text-[13px] font-semibold",
                        isAsked ? "bg-brand-soft text-brand-deep" : "bg-[#ECE6DA] text-ink",
                      )}
                    >
                      {isAsked ? "Asked" : "Not asked"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Chip>{waterConfidenceLabels[pick.waterConfidence]}</Chip>
                    <Chip>{hoursStatusLabels[pick.hoursStatus]}</Chip>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <p className="font-body text-[15px] text-ink-soft">
                      <strong className="font-heading text-[16px] font-bold text-ink">{formatPeople(pick.peopleNewlyCovered)}</strong>{" "}
                      high-risk people newly reached
                    </p>
                    <div className="h-1.5 overflow-hidden rounded-full bg-line">
                      <div className="h-full rounded-full bg-brand" style={{ width: `${(pick.peopleNewlyCovered / mostCovered) * 100}%` }} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <a
                      href={walkingDirectionsUrlFor(pick)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(event) => event.stopPropagation()}
                      className="font-body text-[15px] font-semibold text-brand"
                    >
                      Directions
                    </a>
                    {askButton(pick)}
                  </div>
                </article>
              );
            })}
            {plan && shownPicks.length === 0 && picks.length > 0 && (
              <p className="font-body text-[16px] text-ink-soft">No place matches. Clear the search or show all.</p>
            )}
          </div>
          {picks.length > 0 && (
            <p className="font-body text-[13px] text-ink-faint">Requests are tracked on this device for the demo.</p>
          )}
        </aside>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/public" className="font-body text-[16px] font-semibold text-brand">
          Need a cool place now? Open the public app →
        </Link>
        {heatGrid && (
          <p className="max-w-[760px] font-body text-[14px] text-ink-faint">
            Surface heat comes from the last clear satellite pass ({heatGrid.surfaceHeatDataRange.startDate} to{" "}
            {heatGrid.surfaceHeatDataRange.endDate}) and the weather of the day. It is not air temperature.
          </p>
        )}
      </div>
    </main>
  );
};
