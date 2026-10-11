import { doublePrecision, pgTable, serial } from "drizzle-orm/pg-core";

export const gridCell = pgTable("grid_cell", {
  id: serial().primaryKey(),
  centreLatitude: doublePrecision().notNull(),
  centreLongitude: doublePrecision().notNull(),
  surfaceTemperatureCelsius: doublePrecision().notNull(),
  ndvi: doublePrecision().notNull(),
  ndbi: doublePrecision().notNull(),
  ndwi: doublePrecision().notNull(),
  baselineHeat: doublePrecision().notNull(),
  population: doublePrecision().notNull(),
});
