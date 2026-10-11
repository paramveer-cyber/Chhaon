"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Languages, LocateFixed, Map as MapIcon, MapPin, Navigation, Phone, RotateCw, Share2 } from "lucide-react";
import { ChhaonLogo } from "~/components/chhaon-logo";
import { NearbyPlacesMap } from "~/components/nearby-places-map";
import { ReportForm } from "~/components/report-form";
import { PickMap } from "~/components/public/pick-map";
import { useNearestCoolingPoints, type NearestPlace } from "~/hooks/cooling-point";
import { useHeatAtLocation } from "~/hooks/heat";
import { useUserLocation, type UserLocation } from "~/hooks/user-location";
import { demoHotDate } from "~/lib/demo";
import { compassDirectionFor, formatDistance, walkingDirectionsUrlFor } from "~/lib/format";
import { hoursStatusLabels, placeTypeDetails, waterConfidenceLabels } from "~/lib/place-details";
import {
  compassHindi,
  formatDay,
  formatDistanceHi,
  hoursHindi,
  placeTypeHindi,
  publicCopy,
  waterConfidenceHindi,
  type Language,
} from "~/lib/public-copy";
import { routeLengthInMetres } from "~/lib/route";
import { cn } from "~/lib/utils";

const delhiBounds = { west: 76.84, south: 28.4, east: 77.35, north: 28.88 };
const insideDelhi = ({ latitude, longitude }: UserLocation) =>
  latitude >= delhiBounds.south && latitude <= delhiBounds.north && longitude >= delhiBounds.west && longitude <= delhiBounds.east;

const heatCardClass = {
  high: "bg-heat-high-soft text-heat-high-deep",
  medium: "bg-heat-medium-soft text-heat-medium-deep",
  low: "bg-heat-low-soft text-heat-low-deep",
} as const;
const heatNumberClass = { high: "text-heat-high", medium: "text-heat-medium", low: "text-heat-low-deep" } as const;

const languageKey = "chhaon-language";
const readLanguage = (): Language => {
  try {
    return localStorage.getItem(languageKey) === "hi" ? "hi" : "en";
  } catch {
    return "en";
  }
};

/** Walking distance and time from the route, so the two always agree. */
const placeDistance = (place: NearestPlace, language: Language) => {
  const copy = publicCopy[language];
  const format = language === "hi" ? formatDistanceHi : formatDistance;
  if (!place.walkingRoute) {
    const direction = compassDirectionFor(place.bearingInDegrees) ?? "";
    return copy.awayNoRoute(format(place.distanceInMetres), language === "hi" ? (compassHindi[direction] ?? direction) : direction);
  }
  const metres = Math.max(place.distanceInMetres, routeLengthInMetres(place.walkingRoute.path));
  return copy.away(format(metres), Math.max(1, Math.round(place.walkingRoute.durationInMinutes)));
};

const placeTypeName = (place: NearestPlace, language: Language) =>
  language === "hi" ? placeTypeHindi[place.type] : placeTypeDetails[place.type].label;

/** OpenStreetMap often names a place only by its type ("Park"). Then we say "Your spot" instead of "Near Park". */
const isGenericName = (place: NearestPlace) =>
  place.name.trim().toLowerCase() === placeTypeDetails[place.type].label.toLowerCase();

const Chip = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-page px-3 font-body text-[15px] text-ink">{children}</span>
);

export const PublicApp = () => {
  const { userLocation, isLocating, locationErrorMessage, locateWithBrowser, chooseLocation } = useUserLocation();
  const [language, setLanguage] = useState<Language>("en");
  const [isPicking, setIsPicking] = useState(true);
  const [pickCentre, setPickCentre] = useState<UserLocation>();
  const [pickError, setPickError] = useState<string>();
  const [selectedPlaceId, setSelectedPlaceId] = useState<number>();
  const copy = publicCopy[language];

  useEffect(() => setLanguage(readLanguage()), []);
  useEffect(() => {
    if (userLocation) setIsPicking(false);
  }, [userLocation]);

  const heatQuery = useHeatAtLocation(userLocation, demoHotDate);
  const nearestQuery = useNearestCoolingPoints(userLocation);
  const heat = heatQuery.data?.data;
  const places = useMemo(() => nearestQuery.data?.data.places ?? [], [nearestQuery.data]);
  const selectedPlace = places.find(({ id }) => id === selectedPlaceId) ?? places[0];
  const selectedRank = selectedPlace ? places.indexOf(selectedPlace) + 1 : 0;
  const otherPlaces = places.filter((place) => place !== selectedPlace);
  const queryError = heatQuery.error ?? nearestQuery.error;

  const toggleLanguage = () => {
    const next: Language = language === "hi" ? "en" : "hi";
    setLanguage(next);
    try {
      localStorage.setItem(languageKey, next);
    } catch {
      /* the choice just won't be remembered */
    }
  };

  const confirmPick = () => {
    if (!pickCentre) return;
    if (!insideDelhi(pickCentre)) {
      setPickError(copy.outsideDelhi);
      return;
    }
    setPickError(undefined);
    setSelectedPlaceId(undefined);
    chooseLocation(pickCentre);
    setIsPicking(false);
  };

  const header = (
    <header className="flex items-center justify-between px-5 pt-5">
      <ChhaonLogo />
      <button
        type="button"
        onClick={toggleLanguage}
        className="flex h-10 items-center gap-2 rounded-full bg-surface px-4 font-body text-[15px] font-semibold text-ink shadow-sm"
      >
        <Languages size={17} className="text-brand" />
        {copy.languageToggle}
      </button>
    </header>
  );

  /* ---------- 1. pick a spot ---------- */
  if (isPicking || !userLocation) {
    return (
      <main className="mx-auto flex h-dvh max-w-[440px] flex-col bg-page" lang={language}>
        {header}
        <div className="flex flex-col gap-1.5 px-5 pt-5 pb-4">
          <h1 className="font-heading text-[30px] leading-tight font-bold tracking-tight">{copy.pickTitle}</h1>
          <p className="font-body text-[17px] leading-snug text-ink-soft">{copy.pickLead}</p>
        </div>
        <div className="relative min-h-0 flex-1 overflow-hidden">
          <PickMap pinLabel={copy.pinLabel} start={userLocation} onCentreChange={setPickCentre} />
        </div>
        <div className="flex flex-col gap-2.5 rounded-t-3xl bg-surface px-5 pt-5 pb-7 shadow-[0_-8px_24px_rgba(28,26,22,.08)]">
          {(pickError ?? locationErrorMessage) && (
            <p role="alert" className="rounded-xl bg-heat-high-soft px-3 py-2 font-body text-[15px] text-heat-high-deep">
              {pickError ?? locationErrorMessage}
            </p>
          )}
          <button
            type="button"
            onClick={confirmPick}
            className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-brand font-heading text-lg font-semibold text-surface hover:bg-brand-deep"
          >
            <MapPin size={20} />
            {copy.useThisSpot}
          </button>
          <button
            type="button"
            onClick={locateWithBrowser}
            disabled={isLocating}
            className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-brand-soft font-heading text-lg font-semibold text-brand-deep disabled:opacity-60"
          >
            <LocateFixed size={20} className={cn(isLocating && "animate-pulse")} />
            {isLocating ? copy.locating : copy.useLiveLocation}
          </button>
        </div>
      </main>
    );
  }

  /* ---------- 2. home ---------- */
  const nearestNamed = places.find((place) => !isGenericName(place));
  const locationLine = nearestNamed ? copy.near(nearestNamed.name) : copy.yourSpot;

  return (
    <main className="mx-auto flex min-h-dvh max-w-[440px] flex-col gap-4 bg-page pb-10" lang={language}>
      {header}

      <div className="flex items-center justify-between gap-3 px-5">
        <p className="flex min-w-0 items-center gap-2 font-body text-[17px] font-semibold">
          <Navigation size={18} className="shrink-0 text-[#2F7FE0]" />
          <span className="truncate">{locationLine}</span>
        </p>
        <button type="button" onClick={() => setIsPicking(true)} className="shrink-0 font-body text-[16px] font-semibold text-brand">
          {copy.change}
        </button>
      </div>

      {queryError && (
        <div role="alert" className="mx-4 flex items-center justify-between gap-3 rounded-2xl bg-heat-high-soft p-4">
          <p className="font-body text-[16px] text-heat-high-deep">{copy.errorTitle}</p>
          <button
            type="button"
            onClick={() => {
              void heatQuery.refetch();
              void nearestQuery.refetch();
            }}
            className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-surface px-3 font-heading text-[15px] font-semibold text-ink"
          >
            <RotateCw size={16} />
            {copy.retry}
          </button>
        </div>
      )}

      {heat && (
        <section className={cn("mx-4 animate-rise rounded-[20px] p-[18px]", heatCardClass[heat.heatLevel])}>
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-heading text-[24px] leading-tight font-bold">{copy.heatTitle[heat.heatLevel]}</h2>
            <p className={cn("font-heading text-[34px] leading-none font-bold", heatNumberClass[heat.heatLevel])}>
              {Math.round(heat.apparentTemperatureMaxCelsius)}°
            </p>
          </div>
          <p className="mt-1.5 font-body text-[17px] leading-snug">{copy.heatAdvice[heat.heatLevel]}</p>
          {heat.heatLevel === "high" && <p className="mt-2 font-body text-[17px] font-bold">{copy.goNow}</p>}
        </section>
      )}

      {nearestQuery.isFetching && !places.length && (
        <div className="mx-4 flex flex-col gap-3 rounded-[20px] bg-surface p-5">
          <span className="h-4 w-40 animate-pulse rounded bg-page" />
          <span className="h-8 w-56 animate-pulse rounded bg-page" />
          <span className="h-4 w-48 animate-pulse rounded bg-page" />
          <p className="font-body text-[15px] text-ink-faint">{copy.checking}</p>
        </div>
      )}

      {nearestQuery.isSuccess && !places.length && (
        <p className="mx-4 rounded-[20px] bg-surface p-5 font-body text-[17px] text-ink-soft">{copy.nonePlaces}</p>
      )}

      {selectedPlace && (
        <section className="mx-4 flex animate-rise flex-col gap-3 rounded-[20px] bg-surface p-5" key={selectedPlace.id}>
          <p className="flex items-center gap-2 font-body text-[15px] font-semibold text-brand">
            <span className="size-2 rounded-full bg-brand" />
            {selectedRank === 1 ? copy.nearestLabel : copy.otherLabel(selectedRank)}
          </p>
          <div className="flex flex-col gap-1">
            <h2 className="font-heading text-[30px] leading-[1.1] font-bold tracking-tight">{selectedPlace.name}</h2>
            <p className="font-body text-[17px] text-ink-soft">{placeDistance(selectedPlace, language)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Chip>
              {(() => {
                const { Icon } = placeTypeDetails[selectedPlace.type];
                return <Icon size={16} className="text-brand" />;
              })()}
              {placeTypeName(selectedPlace, language)}
            </Chip>
            <Chip>
              {language === "hi" ? waterConfidenceHindi[selectedPlace.waterConfidence] : waterConfidenceLabels[selectedPlace.waterConfidence]}
            </Chip>
            <Chip>{language === "hi" ? hoursHindi[selectedPlace.hoursStatus] : hoursStatusLabels[selectedPlace.hoursStatus]}</Chip>
          </div>
          <div className="mt-1 flex gap-2.5">
            <a
              href={walkingDirectionsUrlFor(selectedPlace)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl bg-brand font-heading text-[17px] font-semibold text-surface hover:bg-brand-deep"
            >
              <Navigation size={19} />
              {copy.directions}
            </a>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(copy.shareText(selectedPlace.name, walkingDirectionsUrlFor(selectedPlace)))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-[52px] items-center justify-center gap-2 rounded-2xl bg-brand-soft px-5 font-heading text-[17px] font-semibold text-brand-deep"
            >
              <Share2 size={18} />
              {copy.share}
            </a>
          </div>
          <p className="font-body text-[14px] text-ink-faint">{copy.opensMaps}</p>
          <div className="border-t border-line pt-3">
            <ReportForm coolingPointId={selectedPlace.id} />
          </div>
        </section>
      )}

      {places.length > 0 && (
        <section className="relative mx-4 h-56 overflow-hidden rounded-[20px] bg-surface">
          <NearbyPlacesMap
            userLocation={userLocation}
            places={places}
            selectedPlaceId={selectedPlace?.id}
            onSelectPlace={setSelectedPlaceId}
            tileStyle="light"
            compact
          />
          <span className="pointer-events-none absolute top-3 left-3 z-[1000] flex items-center gap-1.5 rounded-full bg-surface/95 px-3 py-1.5 font-heading text-[14px] font-semibold shadow-sm">
            <MapIcon size={15} />
            {copy.mapTitle}
          </span>
          <span className="pointer-events-none absolute right-3 bottom-3 z-[1000] flex items-center gap-3 rounded-full bg-surface/95 px-3 py-1 font-body text-[13px] shadow-sm">
            <span className="flex items-center gap-1">
              <span className="size-2.5 rounded-full bg-[#2F7FE0]" />
              {copy.you}
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2.5 rounded-full bg-brand" />
              {copy.place}
            </span>
          </span>
        </section>
      )}

      {otherPlaces.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="px-6 font-heading text-[15px] font-semibold text-ink-faint">{copy.moreNearby}</h3>
          <div className="mx-4 flex flex-col gap-0.5 overflow-hidden rounded-2xl">
            {otherPlaces.map((place) => {
              const { Icon } = placeTypeDetails[place.type];
              return (
                <button
                  key={place.id}
                  type="button"
                  onClick={() => {
                    setSelectedPlaceId(place.id);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="flex min-h-[68px] items-center gap-3.5 bg-surface px-4 py-3 text-left hover:bg-[#FBF8F2]"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-page">
                    <Icon size={19} className="text-brand" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-heading text-[17px] font-semibold">{place.name}</span>
                    <span className="font-body text-[15px] text-ink-soft">{placeDistance(place, language)}</span>
                  </span>
                  <ChevronRight size={20} className="shrink-0 text-ink-faint" />
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h3 className="px-6 font-heading text-[15px] font-semibold text-ink-faint">{copy.help}</h3>
        <div className="mx-4 flex flex-col gap-0.5 overflow-hidden rounded-2xl">
          {[
            { number: "112", label: copy.emergency },
            { number: "1077", label: copy.heatHelpline },
          ].map(({ number, label }) => (
            <a key={number} href={`tel:${number}`} className="flex min-h-[64px] items-center gap-3.5 bg-surface px-4 py-2.5">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand text-surface">
                <Phone size={18} />
              </span>
              <span className="flex flex-1 flex-col">
                <span className="font-heading text-[20px] leading-tight font-bold">{number}</span>
                <span className="font-body text-[15px] text-ink-soft">{label}</span>
              </span>
              <span className="font-body text-[16px] font-semibold text-brand">{copy.call}</span>
            </a>
          ))}
        </div>
        <p className="mx-4 flex items-start gap-2.5 rounded-2xl bg-[#ECE6DA] px-4 py-3 font-body text-[15px] leading-snug text-ink-soft">
          <Phone size={17} className="mt-0.5 shrink-0 text-brand" />
          {copy.noPhone}
        </p>
      </section>

      <p className="px-6 font-body text-[13px] leading-snug text-ink-faint">
        {copy.dataNote(formatDay(heat?.date ?? demoHotDate, language))}
      </p>
      <Link href="/ward" className="px-6 font-body text-[15px] font-semibold text-brand">
        {copy.planLink} →
      </Link>
    </main>
  );
};
