export const tileLayerUrl = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
export const tileAttribution = "&copy; OpenStreetMap contributors";

export type MapTileStyle = "street" | "light" | "satellite";

/** Base layers. "light" is a calm, low-contrast street map that lets the heat colours lead. */
export const mapTileStyles: Record<MapTileStyle, { url: string; attribution: string; overlayUrl?: string }> = {
  street: { url: tileLayerUrl, attribution: tileAttribution },
  light: {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Imagery &copy; Esri, Maxar",
    overlayUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
  },
};
export const maximumTileZoom = 19;
export const defaultMapCenter: [number, number] = [28.64, 77.12];
export const defaultMapZoom = 10;
export const placeFocusZoom = 15;
export const mapPaddingInPixels: [number, number] = [40, 40];
export const heatOverlayOpacity = 0.78;
export const userMarkerColour = "#2F7FE0";
export const routeLineColour = "#0B6E6A";
export const initialHeatMapCenter: [number, number] = [28.6139, 77.209];
export const initialHeatMapZoom = 12;
