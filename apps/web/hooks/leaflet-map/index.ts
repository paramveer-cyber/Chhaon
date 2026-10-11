import { useEffect, useState, type RefObject } from "react";
import type * as LeafletTypes from "leaflet";
import {
  defaultMapCenter,
  defaultMapZoom,
  maximumTileZoom,
  tileAttribution,
  tileLayerUrl,
} from "~/lib/map";

export type LeafletLibrary = typeof LeafletTypes;

type LeafletMapContext = { leaflet: LeafletLibrary; map: LeafletTypes.Map };

export const useLeafletMap = (containerRef: RefObject<HTMLDivElement | null>) => {
  const [mapContext, setMapContext] = useState<LeafletMapContext>();

  useEffect(() => {
    const mapContainer = containerRef.current;
    if (!mapContainer) return;
    let isCancelled = false;
    let createdMap: LeafletTypes.Map | undefined;

    import("leaflet").then((leaflet) => {
      if (isCancelled) return;
      createdMap = leaflet.map(mapContainer, { center: defaultMapCenter, zoom: defaultMapZoom });
      leaflet
        .tileLayer(tileLayerUrl, { attribution: tileAttribution, maxZoom: maximumTileZoom })
        .addTo(createdMap);
      setMapContext({ leaflet, map: createdMap });
    });

    return () => {
      isCancelled = true;
      createdMap?.remove();
      setMapContext(undefined);
    };
  }, [containerRef]);

  return mapContext;
};
