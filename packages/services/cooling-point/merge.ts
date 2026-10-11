import type { NewCoolingPoint } from "@repo/database/queries/cooling-point";
import {
  duplicateMergeDistanceInMetres,
  studyAreaMiddleLatitude,
} from "../config";
import { degreesOfLongitudeForMetres, distanceInMetres, metresPerDegreeLatitude } from "../geo";

const bucketLatitudeStep = duplicateMergeDistanceInMetres / metresPerDegreeLatitude;
const bucketLongitudeStep = degreesOfLongitudeForMetres(duplicateMergeDistanceInMetres, studyAreaMiddleLatitude);
const neighbourOffsets = [-1, 0, 1];

const bucketKey = (row: number, column: number) => `${row}:${column}`;

export const mergeNearbyCoolingPoints = (prioritisedPoints: NewCoolingPoint[]) => {
  const keptPointsByBucket = new Map<string, NewCoolingPoint[]>();
  const keptPoints: NewCoolingPoint[] = [];

  for (const point of prioritisedPoints) {
    const row = Math.floor(point.latitude / bucketLatitudeStep);
    const column = Math.floor(point.longitude / bucketLongitudeStep);
    const hasKeptNeighbour = neighbourOffsets.some((rowOffset) =>
      neighbourOffsets.some((columnOffset) =>
        keptPointsByBucket
          .get(bucketKey(row + rowOffset, column + columnOffset))
          ?.some((keptPoint) => distanceInMetres(keptPoint, point) <= duplicateMergeDistanceInMetres),
      ),
    );
    if (hasKeptNeighbour) continue;

    const ownBucketKey = bucketKey(row, column);
    keptPointsByBucket.set(ownBucketKey, [...(keptPointsByBucket.get(ownBucketKey) ?? []), point]);
    keptPoints.push(point);
  }
  return keptPoints;
};
