import { CalculateRoutesCommand, GeoRoutesClient, type Route } from "@aws-sdk/client-geo-routes";
import { routingTimeoutInMilliseconds } from "../config";
import type { Coordinates } from "../geo";

const geoRoutesClient = new GeoRoutesClient({});

const secondsPerMinute = 60;

export type WalkingRoute = {
  durationInMinutes: number;
  path: Coordinates[];
};

const toPositionArray = ({ latitude, longitude }: Coordinates) => [longitude, latitude];

const readDurationInSeconds = ({ Summary: routeSummary, Legs: legs = [] }: Route) => {
  if (routeSummary?.Duration !== undefined) return routeSummary.Duration;
  const legDurations = legs
    .map(({ PedestrianLegDetails: pedestrianDetails }) => pedestrianDetails?.Summary?.Overview?.Duration)
    .filter((legDuration): legDuration is number => legDuration !== undefined);
  if (legDurations.length === 0 || legDurations.length !== legs.length) return undefined;
  return legDurations.reduce((totalDuration, legDuration) => totalDuration + legDuration, 0);
};

export const calculateWalkingRoute = async (origin: Coordinates, destination: Coordinates): Promise<WalkingRoute> => {
  const { Routes: routes } = await geoRoutesClient.send(
    new CalculateRoutesCommand({
      Origin: toPositionArray(origin),
      Destination: toPositionArray(destination),
      TravelMode: "Pedestrian",
      LegGeometryFormat: "Simple",
      LegAdditionalFeatures: ["Summary"],
    }),
    { abortSignal: AbortSignal.timeout(routingTimeoutInMilliseconds) },
  );
  const [route] = routes ?? [];
  if (!route) throw new Error("Amazon Location returned no route");

  const durationInSeconds = readDurationInSeconds(route);
  if (durationInSeconds === undefined) throw new Error("Amazon Location route has no duration");

  const path = (route.Legs ?? [])
    .flatMap(({ Geometry: geometry }) => geometry?.LineString ?? [])
    .map(([longitude = 0, latitude = 0]) => ({ latitude, longitude }));

  return { durationInMinutes: Math.max(1, Math.round(durationInSeconds / secondsPerMinute)), path };
};
