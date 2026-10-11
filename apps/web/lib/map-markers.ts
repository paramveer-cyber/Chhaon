import type { LeafletLibrary } from "~/hooks/leaflet-map";
import { userMarkerColour } from "~/lib/map";

const pinSizeInPixels = 30;
const selectedPinSizeInPixels = 38;
const userMarkerSizeInPixels = 20;

export const buildNumberedPinIcon = (leaflet: LeafletLibrary, label: string, isSelected: boolean) => {
  const sizeInPixels = isSelected ? selectedPinSizeInPixels : pinSizeInPixels;
  const colourClass = isSelected ? "bg-ink" : "bg-brand";
  return leaflet.divIcon({
    className: "",
    html: `<span class="${colourClass} flex h-full w-full items-center justify-center rounded-full border-2 border-surface font-heading text-sm font-bold text-surface shadow-md">${label}</span>`,
    iconSize: [sizeInPixels, sizeInPixels],
    iconAnchor: [sizeInPixels / 2, sizeInPixels / 2],
  });
};

export const buildUserMarker = (
  leaflet: LeafletLibrary,
  userLocation: { latitude: number; longitude: number },
) =>
  leaflet.marker([userLocation.latitude, userLocation.longitude], {
    interactive: false,
    icon: leaflet.divIcon({
      className: "",
      html: `<span class="relative flex h-full w-full"><span class="absolute h-full w-full animate-ping rounded-full opacity-50" style="background:${userMarkerColour}"></span><span class="relative h-full w-full rounded-full border-[3px] border-white" style="background:${userMarkerColour}"></span></span>`,
      iconSize: [userMarkerSizeInPixels, userMarkerSizeInPixels],
      iconAnchor: [userMarkerSizeInPixels / 2, userMarkerSizeInPixels / 2],
    }),
  });
