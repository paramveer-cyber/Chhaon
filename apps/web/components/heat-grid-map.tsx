"use client";

import { useEffect, useMemo, useRef } from "react";
import { useLeafletMap } from "~/hooks/leaflet-map";
import type { HeatGrid, HeatLevel } from "~/hooks/heat";
import type { PlanPick } from "~/hooks/plan";
import { HeatRampStrip } from "~/components/heat-ramp-strip";
import { heatScoreScaleMaximum } from "~/lib/heat-colour";
import { buildHeatImage } from "~/lib/heat-image";
import { heatOverlayOpacity, initialHeatMapCenter, initialHeatMapZoom, placeFocusZoom } from "~/lib/map";
import { buildNumberedPinIcon } from "~/lib/map-markers";
import { rangeOf } from "~/lib/range";

type HeatGridMapProps = {
  heatGrid: HeatGrid | undefined;
  visibleLevels: Set<HeatLevel>;
  picks: PlanPick[];
  selectedPlaceId: number | undefined;
  onSelectPlace: (placeId: number) => void;
};

export const HeatGridMap = ({ heatGrid, visibleLevels, picks, selectedPlaceId, onSelectPlace }: HeatGridMapProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapContext = useLeafletMap(mapContainerRef);
  const scoreRange = useMemo(
    () => (heatGrid ? rangeOf(heatGrid.cells.map(({ heatScore }) => heatScore)) : undefined),
    [heatGrid],
  );

  useEffect(() => {
    mapContext?.map.setView(initialHeatMapCenter, initialHeatMapZoom);
  }, [mapContext]);

  useEffect(() => {
    if (!mapContext || !heatGrid) return;
    const { leaflet, map } = mapContext;
    const heatImage = buildHeatImage(heatGrid, visibleLevels);
    if (!heatImage) return;
    const heatOverlay = leaflet
      .imageOverlay(heatImage.imageUrl, heatImage.bounds, {
        opacity: heatOverlayOpacity,
        interactive: false,
        className: "heat-image-overlay",
      })
      .addTo(map);
    return () => {
      heatOverlay.remove();
    };
  }, [mapContext, heatGrid, visibleLevels]);

  useEffect(() => {
    if (!mapContext) return;
    const { leaflet, map } = mapContext;
    const pinMarkers = picks.map(({ id, name, rank, latitude, longitude }) =>
      leaflet
        .marker([latitude, longitude], { icon: buildNumberedPinIcon(leaflet, String(rank), id === selectedPlaceId) })
        .bindTooltip(name)
        .on("click", () => onSelectPlace(id)),
    );
    const pinGroup = leaflet.featureGroup(pinMarkers).addTo(map);
    return () => {
      pinGroup.remove();
    };
  }, [mapContext, picks, selectedPlaceId, onSelectPlace]);

  useEffect(() => {
    const selectedPick = picks.find(({ id }) => id === selectedPlaceId);
    if (!mapContext || !selectedPick) return;
    mapContext.map.flyTo([selectedPick.latitude, selectedPick.longitude], placeFocusZoom);
  }, [mapContext, picks, selectedPlaceId]);

  return (
    <div className="relative size-full">
      <div ref={mapContainerRef} className="size-full" />
      {scoreRange && (
        <div className="absolute bottom-4 left-4 z-[1000] flex w-56 flex-col gap-1 rounded-xl bg-surface p-3 shadow-md">
          <HeatRampStrip />
          <div className="flex justify-between font-body text-sm text-ink-soft">
            <span>Cooler, 0</span>
            <span>Hotter, {heatScoreScaleMaximum}</span>
          </div>
          <p className="font-body text-sm text-ink-soft">Hottest cell on this day: {Math.round(scoreRange.highest)}</p>
        </div>
      )}
    </div>
  );
};
