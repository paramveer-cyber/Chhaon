import { doublePrecision, pgTable, serial, text } from "drizzle-orm/pg-core";

export const coolingPointTypes = [
  "drinking_water",
  "park",
  "metro_station",
  "hospital",
  "school",
  "place_of_worship",
  "cooling_zone",
] as const;

export type CoolingPointType = (typeof coolingPointTypes)[number];

export const coolingPointSources = ["osm", "official"] as const;

export const hoursStatuses = ["unconfirmed", "confirmed"] as const;

export const coolingPoint = pgTable("cooling_point", {
  id: serial().primaryKey(),
  name: text().notNull(),
  type: text({ enum: coolingPointTypes }).notNull(),
  latitude: doublePrecision().notNull(),
  longitude: doublePrecision().notNull(),
  source: text({ enum: coolingPointSources }).notNull(),
  hoursStatus: text({ enum: hoursStatuses }).notNull().default("unconfirmed"),
});
