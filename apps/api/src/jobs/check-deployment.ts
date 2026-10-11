import { logger } from "@repo/logger";
import { runJob } from "./run-job";
import { spotCheckPlaces, type SpotCheckPlace } from "./spot-check-places";

const parallelRequestCount = 20;
const nearestTimeLimitInMilliseconds = 3000;
const requiredSpotCheckMatches = 16;
const replayDate = "2026-05-25";

type TimedResponse = {
  status: number;
  durationInMilliseconds: number;
  body: unknown;
};

type HeatAtLocationBody = { data: { heatScore: number } };
type NearestBody = { data: { places: { walkingRoute: unknown }[] } };

const requestTimed = async (url: string): Promise<TimedResponse> => {
  const startTime = performance.now();
  try {
    const response = await fetch(url);
    const body = await response.json().catch(() => null);
    return { status: response.status, durationInMilliseconds: Math.round(performance.now() - startTime), body };
  } catch {
    return { status: 0, durationInMilliseconds: Math.round(performance.now() - startTime), body: null };
  }
};

const locationQuery = ({ latitude, longitude }: SpotCheckPlace) => `latitude=${latitude}&longitude=${longitude}`;

const checkLoad = async (baseUrl: string) => {
  const [firstPlace = spotCheckPlaces[0]] = spotCheckPlaces;
  if (!firstPlace) throw new Error("No spot check places");
  const endpointPaths = {
    health: "/health",
    heat: `/api/heat?date=${replayDate}`,
    heatAtLocation: `/api/heat/location?${locationQuery(firstPlace)}&date=${replayDate}`,
    plan: `/api/plan?date=${replayDate}`,
    nearest: `/api/cooling-points/nearest?${locationQuery(firstPlace)}`,
  };

  const endpointResults = await Promise.all(
    Object.entries(endpointPaths).map(async ([endpointName, endpointPath]) => {
      const responses = await Promise.all(
        Array.from({ length: parallelRequestCount }, () => requestTimed(baseUrl + endpointPath)),
      );
      const failedCount = responses.filter(({ status }) => status !== 200).length;
      const slowestInMilliseconds = Math.max(...responses.map(({ durationInMilliseconds }) => durationInMilliseconds));
      logger.info(`Load ${endpointName}: ${failedCount} failed of ${parallelRequestCount}, slowest ${slowestInMilliseconds} ms`);
      return failedCount === 0;
    }),
  );
  return endpointResults.every(Boolean);
};

const checkNearestSpeed = async (baseUrl: string) => {
  let allPassed = true;
  let missingRouteCount = 0;
  for (const place of spotCheckPlaces) {
    const { status, durationInMilliseconds, body } = await requestTimed(
      `${baseUrl}/api/cooling-points/nearest?${locationQuery(place)}`,
    );
    const isFastEnough = durationInMilliseconds < nearestTimeLimitInMilliseconds;
    if (status !== 200 || !isFastEnough) {
      allPassed = false;
      logger.error(`Nearest ${place.name}: status ${status}, ${durationInMilliseconds} ms`);
    }
    missingRouteCount += ((body as NearestBody | null)?.data.places ?? []).filter(
      ({ walkingRoute }) => walkingRoute === null,
    ).length;
  }
  logger.info(`Nearest speed: ${allPassed ? "all passed" : "some failed"}, places without route: ${missingRouteCount}`);
  return allPassed;
};

const checkSpotCheck = async (baseUrl: string) => {
  const scoredPlaces = await Promise.all(
    spotCheckPlaces.map(async (place) => {
      const { body } = await requestTimed(`${baseUrl}/api/heat/location?${locationQuery(place)}&date=${replayDate}`);
      return { ...place, heatScore: (body as HeatAtLocationBody | null)?.data.heatScore ?? Number.NaN };
    }),
  );
  if (scoredPlaces.some(({ heatScore }) => Number.isNaN(heatScore))) {
    logger.error("Spot check: some places returned no heat score");
    return false;
  }

  const rankedPlaces = [...scoredPlaces].sort((firstPlace, secondPlace) => secondPlace.heatScore - firstPlace.heatScore);
  const hotHalfSize = rankedPlaces.length / 2;
  const matchCount = rankedPlaces.filter(({ kind }, rankIndex) => (rankIndex < hotHalfSize) === (kind === "market")).length;
  rankedPlaces.forEach(({ name, kind, heatScore }, rankIndex) =>
    logger.info(`Rank ${rankIndex + 1}: ${name} (${kind}) ${heatScore}`),
  );
  logger.info(`Spot check: ${matchCount} of ${rankedPlaces.length} as expected, need ${requiredSpotCheckMatches}`);
  return matchCount >= requiredSpotCheckMatches;
};

const checkDeployment = async () => {
  const baseUrl = process.argv[2];
  if (!baseUrl) throw new Error("Pass the base URL as the first argument");
  const checkResults = [await checkLoad(baseUrl), await checkNearestSpeed(baseUrl), await checkSpotCheck(baseUrl)];
  if (checkResults.includes(false)) throw new Error("One or more deployment checks failed");
  logger.info("All deployment checks passed");
};

runJob("Deployment check", checkDeployment);
