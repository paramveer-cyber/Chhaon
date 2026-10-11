"use client";

import { useState } from "react";
import { ArrowUp, LocateFixed, Navigation } from "lucide-react";
import { ChhaonLogo } from "~/components/chhaon-logo";
import { NearbyPlacesMap } from "~/components/nearby-places-map";
import { AnimatedNumber } from "~/components/animated-number";
import { PlaceCard } from "~/components/place-card";
import { PlaceListSkeleton } from "~/components/place-list-skeleton";
import { ReportForm } from "~/components/report-form";
import { ScreenSwitchLink } from "~/components/screen-switch-link";
import { StepHeading } from "~/components/step-heading";
import { useNearestCoolingPoints } from "~/hooks/cooling-point";
import { useHeatAtLocation } from "~/hooks/heat";
import { useUserLocation } from "~/hooks/user-location";
import { compassDirectionFor, formatDegrees, formatDistance, walkingDirectionsUrlFor } from "~/lib/format";
import { heatLevelDetails } from "~/lib/heat-level-details";
import { hintText } from "~/lib/hints";
import { nearestLoadingMessages } from "~/lib/loading-messages";
import { cn } from "~/lib/utils";

const WaitingHint = ({ children }: { children: React.ReactNode }) => (
  <p className="flex items-center gap-3 rounded-2xl border border-dashed border-line bg-surface p-4 font-body text-base text-ink-faint">
    <ArrowUp size={20} className="shrink-0 animate-bounce text-sun-deep" />
    {children}
  </p>
);

export const PublicScreen = () => {
  const { userLocation, isLocating, locationErrorMessage, locateWithBrowser, chooseLocation } = useUserLocation();
  const [selectedPlaceId, setSelectedPlaceId] = useState<number>();
  const heatQuery = useHeatAtLocation(userLocation);
  const nearestQuery = useNearestCoolingPoints(userLocation);

  const heat = heatQuery.data?.data;
  const places = nearestQuery.data?.data.places ?? [];
  const errorMessage = locationErrorMessage ?? heatQuery.error?.message ?? nearestQuery.error?.message;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-5 px-4 pt-6 pb-10">
      <ChhaonLogo />
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl leading-tight font-bold tracking-tight">Find a cool place near you</h1>
        <p className="font-body text-lg text-ink-soft">
          Check the heat where you are. Then walk to the nearest shade and water.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <StepHeading stepNumber={1} title="Where are you?" hintText={hintText.yourPlace} />
        <button
          type="button"
          onClick={locateWithBrowser}
          disabled={isLocating}
          className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-brand font-heading text-lg font-semibold text-surface disabled:opacity-60"
        >
          <span className="relative flex size-5 items-center justify-center">
          {isLocating && <span className="absolute size-full animate-ping rounded-full bg-surface/70" />}
          <LocateFixed size={20} className="relative" />
        </span>
          {isLocating ? "Finding your location…" : "Use my location"}
        </button>
        <p className="font-body text-base text-ink-soft">Or tap the map to set where you are.</p>
        {errorMessage && (
          <p role="alert" className="rounded-2xl bg-heat-high-soft p-4 font-body text-base text-heat-high-deep">
            {errorMessage}
          </p>
        )}
        <div className="h-72 overflow-hidden rounded-2xl bg-surface">
          <NearbyPlacesMap
            userLocation={userLocation}
            places={places}
            selectedPlaceId={selectedPlaceId}
            onSelectPlace={setSelectedPlaceId}
            onChooseLocation={chooseLocation}
          />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <StepHeading stepNumber={2} title="How hot is it here?" hintText={hintText.yourHeat} />
        {heat ? (
          <div className={cn("flex animate-rise flex-col gap-1.5 rounded-2xl p-4", heatLevelDetails[heat.heatLevel].cardClass)}>
            <h3 className="font-heading text-xl font-bold">{heatLevelDetails[heat.heatLevel].label} today</h3>
            <p className="font-body text-base">
              Feels like <AnimatedNumber value={heat.apparentTemperatureMaxCelsius} format={formatDegrees} /> at most.{" "}
              {heatLevelDetails[heat.heatLevel].advice}
            </p>
            {heat.heatLevel === "high" && (
              <p className="font-body text-base font-bold">Heat is high here. Go to a place in step 3 now.</p>
            )}
          </div>
        ) : (
          <WaitingHint>Set your place in step 1. We show the heat level here.</WaitingHint>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <StepHeading stepNumber={3} title="Nearest cooling points" hintText={hintText.nearestPlaces} />
        {nearestQuery.isFetching && <PlaceListSkeleton messages={nearestLoadingMessages} />}
        {!userLocation && <WaitingHint>Set your place in step 1. We show 3 places here.</WaitingHint>}
        {places.map((place, placeIndex) => (
          <PlaceCard
            key={place.id}
            enterIndex={placeIndex}
            place={place}
            rankLabel={String(placeIndex + 1)}
            isSelected={place.id === selectedPlaceId}
            onSelect={() => setSelectedPlaceId(place.id)}
          >
            <p className="font-body text-base text-ink-soft">
              {formatDistance(place.distanceInMetres)} away
              {place.walkingRoute
                ? `, ${Math.round(place.walkingRoute.durationInMinutes)} min walk`
                : `, to the ${compassDirectionFor(place.bearingInDegrees)}. No walking route now.`}
            </p>
            <a
              href={walkingDirectionsUrlFor(place)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(clickEvent) => clickEvent.stopPropagation()}
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-brand font-heading text-base font-semibold text-surface"
            >
              <Navigation size={18} />
              Get directions
            </a>
            <ReportForm coolingPointId={place.id} />
          </PlaceCard>
        ))}
      </section>

      <ScreenSwitchLink href="/ward" label="Plan for a ward? See the heat map and plan" />
    </main>
  );
};
