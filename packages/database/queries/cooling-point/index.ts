import { db, inArray } from "../../index";
import { orderByPlanarDistance } from "../../planar-distance";
import { replaceAllRows } from "../../replace-all-rows";
import { coolingPoint } from "../../models/cooling-point";

export type NewCoolingPoint = typeof coolingPoint.$inferInsert;

export const listAllCoolingPoints = () => db.select().from(coolingPoint);

export const replaceAllCoolingPoints = (newCoolingPoints: NewCoolingPoint[]) =>
  replaceAllRows(coolingPoint, newCoolingPoints);

export const listNearestCoolingPoints = (
  origin: { latitude: number; longitude: number },
  resultLimit: number,
) =>
  db
    .select()
    .from(coolingPoint)
    .orderBy(orderByPlanarDistance(coolingPoint.latitude, coolingPoint.longitude, origin))
    .limit(resultLimit);

export const findCoolingPointsByIds = (coolingPointIds: number[]) =>
  db.select().from(coolingPoint).where(inArray(coolingPoint.id, coolingPointIds));
