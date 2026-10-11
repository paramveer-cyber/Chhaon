"use client";

import { useEffect, useRef } from "react";
import { useLeafletMap } from "~/hooks/leaflet-map";
import type { NearestPlace } from "~/hooks/cooling-point";
import type { UserLocation } from "~/hooks/user-location";
import { mapPaddingInPixels, routeLineColour } from "~/lib/map";
import { buildNumberedPinIcon, buildUserMarker } from "~/lib/map-markers";

type NearbyPlacesMapProps = {
  userLocation: UserLocation | undefined;
  places: NearestPlace[];
  selectedPlaceId: number | undefined;
  onSelectPlace: (placeId: number) => void;
  onChooseLocation: (chosenLocation: UserLocation) => void;
};

export const NearbyPlacesMap = ({
  userLocation,
  places,
  selectedPlaceId,
  onSelectPlace,
  onChooseLocation,
}: NearbyPlacesMapProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapContext = useLeafletMap(mapContainerRef);

  useEffect(() => {
    if (!mapContext) return;
    const { map } = mapContext;
    const handleMapClick = ({ latlng }: { latlng: { lat: number; lng: number } }) =>
      onChooseLocation({ latitude: latlng.lat, longitude: latlng.lng });
    map.on("click", handleMapClick);
    return () => {
      map.off("click", handleMapClick);
    };
  }, [mapContext, onChooseLocation]);

  useEffect(() => {
    if (!mapContext || !userLocation) return;
    const { leaflet, map } = mapContext;
    const placePoints = places.map(({ latitude, longitude }) => leaflet.latLng(latitude, longitude));
    const visiblePoints = [leaflet.latLng(userLocation.latitude, userLocation.longitude), ...placePoints];
    map.fitBounds(leaflet.latLngBounds(visiblePoints), { padding: mapPaddingInPixels, maxZoom: 16 });
  }, [mapContext, userLocation, places]);

  useEffect(() => {
    if (!mapContext) return;
    const { leaflet, map } = mapContext;
    const layerGroup = leaflet.featureGroup().addTo(map);
    if (userLocation) buildUserMarker(leaflet, userLocation).addTo(layerGroup);
    places.forEach(({ id, name, latitude, longitude, walkingRoute }, placeIndex) => {
      const isSelected = id === selectedPlaceId;
      leaflet
        .marker([latitude, longitude], { icon: buildNumberedPinIcon(leaflet, String(placeIndex + 1), isSelected) })
        .bindTooltip(name)
        .on("click", () => onSelectPlace(id))
        .addTo(layerGroup);
      if (isSelected && walkingRoute) {
        leaflet
          .polyline(
            walkingRoute.path.map(({ latitude: pathLatitude, longitude: pathLongitude }) => [
              pathLatitude,
              pathLongitude,
            ]),
            { color: routeLineColour, weight: 5 },
          )
          .addTo(layerGroup);
      }
    });
    return () => {
      layerGroup.remove();
    };
  }, [mapContext, userLocation, places, selectedPlaceId, onSelectPlace]);

  return <div ref={mapContainerRef} className="size-full" />;
};
