import type { CoolingPointType } from "@repo/database/models/cooling-point";

export const studyAreaBoundingBox = {
  westLongitude: 76.84,
  southLatitude: 28.4,
  eastLongitude: 77.35,
  northLatitude: 28.88,
} as const;

export const baselineDateRange = {
  startDate: "2026-04-01",
  endDate: "2026-06-30",
} as const;

export const studyAreaMiddleLatitude =
  (studyAreaBoundingBox.southLatitude + studyAreaBoundingBox.northLatitude) / 2;

export const studyAreaMiddleLongitude =
  (studyAreaBoundingBox.westLongitude + studyAreaBoundingBox.eastLongitude) / 2;

export const maximumCloudCoverPercent = 20;
export const gridCellSizeInMetres = 250;
export const walkingRadiusInMetres = 800;
export const nearestPlaceCount = 3;
export const routingTimeoutInMilliseconds = 2000;

export const heatLevelMinimumScores = {
  high: 70,
  medium: 40,
} as const;

export const maximumScenesPerCollection = 12;
export const earthEngineProjectId = "heatmap-511209";
export const earthEngineScaleInMetres = 100;

export const baselineHeatWeights = {
  surfaceTemperature: 0.5,
  builtUp: 0.3,
  treeShortage: 0.2,
  waterCredit: 0.1,
} as const;

export const scalingPercentiles = {
  lower: 0.02,
  upper: 0.98,
} as const;

export const plausibleSurfaceTemperatureCelsius = {
  minimum: 30,
  maximum: 60,
} as const;

export const overpassUrl = "https://overpass-api.de/api/interpreter";
export const overpassTimeoutInSeconds = 180;
export const overpassFallbackUrls = [
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
] as const;
export const overpassAttemptCount = 6;
export const overpassRetryDelayInMilliseconds = 5000;
export const duplicateMergeDistanceInMetres = 20;
export const minimumCoolingPointCount = 50;

export const openMeteoForecastUrl = "https://api.open-meteo.com/v1/forecast";
export const openMeteoArchiveUrl = "https://archive-api.open-meteo.com/v1/archive";
export const weatherTimeZone = "Asia/Kolkata";

export const weatherIndexApparentTemperatureCelsius = {
  minimum: 30,
  maximum: 48,
} as const;

export const heatScoreWeights = {
  baselineHeat: 0.6,
  weatherIndex: 0.4,
} as const;

export const waterConfidences = ["listed", "likely", "unlikely"] as const;

export type WaterConfidence = (typeof waterConfidences)[number];

export const waterConfidenceByCoolingPointType: Record<CoolingPointType, WaterConfidence> = {
  drinking_water: "listed",
  cooling_zone: "listed",
  metro_station: "likely",
  hospital: "likely",
  place_of_worship: "likely",
  park: "unlikely",
  school: "unlikely",
};

export const plannedPlaceCount = 10;
export const activeWaterConfidence: WaterConfidence = "listed";
export const candidateWaterConfidence: WaterConfidence = "likely";
