"use client";

import { useEffect, useRef } from "react";
import { useLeafletMap } from "~/hooks/leaflet-map";
import type { UserLocation } from "~/hooks/user-location";
import { initialHeatMapCenter } from "~/lib/map";

type PickMapProps = {
  pinLabel: string;
  start: UserLocation | undefined;
  onCentreChange: (centre: UserLocation) => void;
};

/** Satellite map of Delhi with a fixed centre pin: the person moves the map, not the pin. */
export const PickMap = ({ pinLabel, start, onCentreChange }: PickMapProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapContext = useLeafletMap(mapContainerRef, "satellite", {
    zoomControl: false,
    minZoom: 10,
    maxBounds: [
      [28.3, 76.7],
      [29.0, 77.5],
    ],
    maxBoundsViscosity: 0.9,
  });

  useEffect(() => {
    if (!mapContext) return;
    const { map } = mapContext;
    map.setView(start ? [start.latitude, start.longitude] : initialHeatMapCenter, start ? 15 : 12);
    const report = () => {
      const centre = map.getCenter();
      onCentreChange({ latitude: centre.lat, longitude: centre.lng });
    };
    report();
    map.on("moveend", report);
    return () => {
      map.off("moveend", report);
    };
    // the start point is only used when the map opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapContext]);

  return (
    <div className="relative size-full">
      <div ref={mapContainerRef} className="size-full" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 z-[1000] flex -translate-x-1/2 -translate-y-full flex-col items-center">
        <span className="rounded-[9px] bg-ink px-3 py-2 font-heading text-sm font-semibold whitespace-nowrap text-surface shadow-lg">
          {pinLabel}
        </span>
        <span className="mt-1.5 size-[18px] rounded-full border-4 border-surface bg-brand shadow-md" />
      </div>
    </div>
  );
};
