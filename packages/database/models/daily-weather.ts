import { date, doublePrecision, pgTable } from "drizzle-orm/pg-core";

export const dailyWeather = pgTable("daily_weather", {
  weatherDate: date({ mode: "string" }).primaryKey(),
  apparentTemperatureMaxCelsius: doublePrecision().notNull(),
  weatherIndex: doublePrecision().notNull(),
});
