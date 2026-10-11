import { useEffect, useState, type RefObject } from "react";
import type * as LeafletTypes from "leaflet";
import { defaultMapCenter, defaultMapZoom, mapTileStyles, maximumTileZoom, type MapTileStyle } from "~/lib/map";

export type LeafletLibrary = typeof LeafletTypes;

type LeafletMapContext = { leaflet: LeafletLibrary; map: LeafletTypes.Map };

export const useLeafletMap = (
  containerRef: RefObject<HTMLDivElement | null>,
  tileStyle: MapTileStyle = "street",
  mapOptions: LeafletTypes.MapOptions = {},
) => {
  const [mapContext, setMapContext] = useState<LeafletMapContext>();

  useEffect(() => {
    const mapContainer = containerRef.current;
    if (!mapContainer) return;
    let isCancelled = false;
    let createdMap: LeafletTypes.Map | undefined;

    import("leaflet").then((leaflet) => {
      if (isCancelled) return;
      createdMap = leaflet.map(mapContainer, { center: defaultMapCenter, zoom: defaultMapZoom, ...mapOptions });
      const tiles = mapTileStyles[tileStyle];
      leaflet.tileLayer(tiles.url, { attribution: tiles.attribution, maxZoom: maximumTileZoom }).addTo(createdMap);
      if (tiles.overlayUrl) leaflet.tileLayer(tiles.overlayUrl, { maxZoom: maximumTileZoom }).addTo(createdMap);
      setMapContext({ leaflet, map: createdMap });
    });

    return () => {
      isCancelled = true;
      createdMap?.remove();
      setMapContext(undefined);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the map is created once per container
  }, [containerRef, tileStyle]);

  return mapContext;
};
