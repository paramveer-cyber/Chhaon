import { coolingPointReportTypes } from "@repo/database/models/cooling-point-report";
import { coolingPointTypes, coolingPointSources, hoursStatuses } from "@repo/database/models/cooling-point";
import { waterConfidences } from "@repo/services/config";
import { z, zodApiResponse, latitudeModel, locationInputModel, longitudeModel } from "../../schema";

export const coolingPointModel = z.object({
  id: z.number().int(),
  name: z.string(),
  type: z.enum(coolingPointTypes),
  latitude: latitudeModel,
  longitude: longitudeModel,
  source: z.enum(coolingPointSources),
  hoursStatus: z.enum(hoursStatuses),
  waterConfidence: z.enum(waterConfidences),
});

export const getNearestInputModel = locationInputModel;

const walkingRouteModel = z.object({
  durationInMinutes: z.number(),
  path: z.array(z.object({ latitude: latitudeModel, longitude: longitudeModel })),
});

export const nearestPlaceModel = coolingPointModel.extend({
  distanceInMetres: z.number(),
  bearingInDegrees: z.number().min(0).max(360),
  walkingRoute: walkingRouteModel.nullable().describe("null when routing fails"),
});

export type NearestPlace = z.infer<typeof nearestPlaceModel>;

export const getNearestOutputModel = zodApiResponse(
  z.object({ places: z.array(nearestPlaceModel).max(3) }),
);

export const reportCorrectionInputModel = z.object({
  reportType: z.enum(coolingPointReportTypes),
  coolingPointId: z.number().int().optional(),
  latitude: latitudeModel.optional(),
  longitude: longitudeModel.optional(),
  message: z.string().min(1).max(500),
});

export const reportCorrectionOutputModel = zodApiResponse(z.object({ reportId: z.number().int() }));
