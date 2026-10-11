"use client";

import { useEffect, useRef } from "react";
import { useLeafletMap } from "~/hooks/leaflet-map";
import type { HeatGrid, HeatLevel } from "~/hooks/heat";
import type { PlanPick } from "~/hooks/plan";
import { buildHeatImage } from "~/lib/heat-image";
import { heatOverlayOpacity, initialHeatMapCenter, placeFocusZoom } from "~/lib/map";

type ControlMapProps = {
  heatGrid: HeatGrid | undefined;
  visibleLevels: Set<HeatLevel>;
  picks: PlanPick[];
  askedIds: Set<number>;
  selectedPlaceId: number | undefined;
  onSelectPlace: (placeId: number) => void;
};

const pinHtml = (label: string, state: "idle" | "asked" | "selected") => {
  const size = state === "selected" ? 38 : 32;
  const style =
    state === "selected"
      ? "background:#1C1A16;color:#FFFDF9;border:3px solid #FFFDF9"
      : state === "asked"
        ? "background:#FFFDF9;color:#0B6E6A;border:3px dashed #0B6E6A"
        : "background:#0B6E6A;color:#FFFDF9;border:3px solid #FFFDF9";
  return {
    size,
    html: `<span style="${style};width:${size}px;height:${size}px;border-radius:999px;display:flex;align-items:center;justify-content:center;font:700 14px/1 var(--font-schibsted),sans-serif;box-shadow:0 2px 8px rgba(28,26,22,.35)">${label}</span>`,
  };
};

/** The ward office heat map: 250 m heat cells on a calm base map, with the ranked places to open. */
export const ControlMap = ({ heatGrid, visibleLevels, picks, askedIds, selectedPlaceId, onSelectPlace }: ControlMapProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapContext = useLeafletMap(mapContainerRef, "light", { zoomControl: false });

  useEffect(() => {
    if (!mapContext) return;
    mapContext.map.setView(initialHeatMapCenter, 11);
    mapContext.leaflet.control.zoom({ position: "bottomright" }).addTo(mapContext.map);
  }, [mapContext]);

  useEffect(() => {
    if (!mapContext || !heatGrid) return;
    const heatImage = buildHeatImage(heatGrid, visibleLevels);
    if (!heatImage) return;
    const overlay = mapContext.leaflet
      .imageOverlay(heatImage.imageUrl, heatImage.bounds, {
        opacity: heatOverlayOpacity,
        interactive: false,
        className: "heat-image-overlay",
      })
      .addTo(mapContext.map);
    return () => {
      overlay.remove();
    };
  }, [mapContext, heatGrid, visibleLevels]);

  useEffect(() => {
    if (!mapContext) return;
    const { leaflet, map } = mapContext;
    const markers = picks.map(({ id, name, rank, latitude, longitude }) => {
      const pin = pinHtml(String(rank), id === selectedPlaceId ? "selected" : askedIds.has(id) ? "asked" : "idle");
      return leaflet
        .marker([latitude, longitude], {
          icon: leaflet.divIcon({ className: "", html: pin.html, iconSize: [pin.size, pin.size], iconAnchor: [pin.size / 2, pin.size / 2] }),
          zIndexOffset: id === selectedPlaceId ? 1000 : 0,
        })
        .bindTooltip(name, { direction: "top", offset: [0, -14] })
        .on("click", () => onSelectPlace(id));
    });
    const group = leaflet.featureGroup(markers).addTo(map);
    return () => {
      group.remove();
    };
  }, [mapContext, picks, askedIds, selectedPlaceId, onSelectPlace]);

  useEffect(() => {
    const pick = picks.find(({ id }) => id === selectedPlaceId);
    if (!mapContext || !pick) return;
    mapContext.map.flyTo([pick.latitude, pick.longitude], placeFocusZoom - 1, { duration: 0.8 });
  }, [mapContext, picks, selectedPlaceId]);

  return <div ref={mapContainerRef} className="size-full" />;
};
