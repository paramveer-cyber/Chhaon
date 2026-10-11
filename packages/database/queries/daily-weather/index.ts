import { db, eq } from "../../index";
import { dailyWeather } from "../../models/daily-weather";

export type NewDailyWeather = typeof dailyWeather.$inferInsert;

export const findDailyWeatherByDate = async (weatherDate: string) => {
  const [foundDailyWeather] = await db
    .select()
    .from(dailyWeather)
    .where(eq(dailyWeather.weatherDate, weatherDate));
  return foundDailyWeather;
};

export const upsertDailyWeather = (newDailyWeather: NewDailyWeather) =>
  db
    .insert(dailyWeather)
    .values(newDailyWeather)
    .onConflictDoUpdate({ target: dailyWeather.weatherDate, set: newDailyWeather });
