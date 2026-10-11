import { logger } from "@repo/logger";
import { CoolingPointType, coolingPointTypes } from "@repo/database/models/cooling-point";
import type { NewCoolingPoint } from "@repo/database/queries/cooling-point";
import {
  overpassAttemptCount,
  overpassFallbackUrls,
  overpassRetryDelayInMilliseconds,
  overpassTimeoutInSeconds,
  overpassUrl,
  studyAreaBoundingBox,
} from "../config";
import { requestJson } from "../http";

type OverpassElement = {
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

type OverpassResult = { elements: OverpassElement[] };

const coolingPointTagRules: { type: CoolingPointType; tagKey: string; tagValue: string }[] = [
  { type: "drinking_water", tagKey: "amenity", tagValue: "drinking_water" },
  { type: "park", tagKey: "leisure", tagValue: "park" },
  { type: "metro_station", tagKey: "station", tagValue: "subway" },
  { type: "hospital", tagKey: "amenity", tagValue: "hospital" },
  { type: "school", tagKey: "amenity", tagValue: "school" },
  { type: "place_of_worship", tagKey: "amenity", tagValue: "place_of_worship" },
];

const { westLongitude, southLatitude, eastLongitude, northLatitude } = studyAreaBoundingBox;
const boundingBoxText = `${southLatitude},${westLongitude},${northLatitude},${eastLongitude}`;

const overpassQuery = `[out:json][timeout:${overpassTimeoutInSeconds}];(${coolingPointTagRules
  .map(({ tagKey, tagValue }) => `nwr["${tagKey}"="${tagValue}"](${boundingBoxText});`)
  .join("")});out center tags;`;

const defaultNameForType = (type: CoolingPointType) => {
  const readableType = type.replaceAll("_", " ");
  return readableType.charAt(0).toUpperCase() + readableType.slice(1);
};

const typePriority = (type: CoolingPointType) => coolingPointTypes.indexOf(type);

const toCoolingPointRow = ({ lat, lon, center, tags = {} }: OverpassElement): NewCoolingPoint | undefined => {
  const latitude = lat ?? center?.lat;
  const longitude = lon ?? center?.lon;
  const matchedRule = coolingPointTagRules.find(({ tagKey, tagValue }) => tags[tagKey] === tagValue);
  if (latitude === undefined || longitude === undefined || !matchedRule) return undefined;
  return {
    name: tags.name ?? defaultNameForType(matchedRule.type),
    type: matchedRule.type,
    latitude,
    longitude,
    source: "osm",
  };
};

const overpassUrlsInOrder = [overpassUrl, ...overpassFallbackUrls];

const waitForMilliseconds = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const fetchOverpassElements = async () => {
  let lastError: unknown;
  for (let attemptNumber = 1; attemptNumber <= overpassAttemptCount; attemptNumber += 1) {
    try {
      const attemptUrl = overpassUrlsInOrder[(attemptNumber - 1) % overpassUrlsInOrder.length] ?? overpassUrl;
      const { elements } = await requestJson<OverpassResult>(attemptUrl, {
        method: "POST",
        body: new URLSearchParams({ data: overpassQuery }),
      });
      return elements;
    } catch (error) {
      lastError = error;
      logger.warn(`Overpass attempt ${attemptNumber} of ${overpassAttemptCount} failed`);
      await waitForMilliseconds(overpassRetryDelayInMilliseconds);
    }
  }
  throw lastError;
};

export const readOpenStreetMapCoolingPoints = async () =>
  (await fetchOverpassElements())
    .map(toCoolingPointRow)
    .filter((coolingPointRow): coolingPointRow is NewCoolingPoint => coolingPointRow !== undefined)
    .sort((firstRow, secondRow) => typePriority(firstRow.type) - typePriority(secondRow.type));
