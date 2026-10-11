import { listNearestCoolingPoints } from "@repo/database/queries/cooling-point";
import { logger } from "@repo/logger";
import { ApiError } from "../api-response";
import { calculateWalkingRoute } from "../clients/amazon-location";
import { nearestPlaceCount } from "../config";
import { withWaterConfidence } from "../cooling-point";
import { describeError } from "../describe-error";
import { type Coordinates, bearingInDegrees, distanceInMetres, isInsideStudyArea } from "../geo";

const findWalkingRouteOrNull = async (origin: Coordinates, destination: Coordinates) => {
  try {
    return await calculateWalkingRoute(origin, destination);
  } catch (error) {
    logger.warn(`Walking route failed: ${describeError(error)}`);
    return null;
  }
};

export const getNearestCoolingPoints = async (origin: Coordinates) => {
  if (!isInsideStudyArea(origin)) throw ApiError.badRequest("Location is outside the study area");
  const nearestPoints = await listNearestCoolingPoints(origin, nearestPlaceCount);
  return Promise.all(
    nearestPoints.map(async (coolingPoint) => ({
      ...withWaterConfidence(coolingPoint),
      distanceInMetres: distanceInMetres(origin, coolingPoint),
      bearingInDegrees: bearingInDegrees(origin, coolingPoint),
      walkingRoute: await findWalkingRouteOrNull(origin, coolingPoint),
    })),
  );
};
