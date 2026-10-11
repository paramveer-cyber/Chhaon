import { db } from "../../index";
import { coolingPointReport } from "../../models/cooling-point-report";

export type NewCoolingPointReport = typeof coolingPointReport.$inferInsert;

export const insertCoolingPointReport = (newCoolingPointReport: NewCoolingPointReport) =>
  db
    .insert(coolingPointReport)
    .values(newCoolingPointReport)
    .returning({ id: coolingPointReport.id });
