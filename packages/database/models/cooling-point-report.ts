import { doublePrecision, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { coolingPoint } from "./cooling-point";

export const coolingPointReportTypes = ["closed", "new_place", "hours"] as const;

export const coolingPointReport = pgTable("cooling_point_report", {
  id: serial().primaryKey(),
  coolingPointId: integer().references(() => coolingPoint.id, { onDelete: "set null" }),
  reportType: text({ enum: coolingPointReportTypes }).notNull(),
  latitude: doublePrecision(),
  longitude: doublePrecision(),
  message: text().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
});
