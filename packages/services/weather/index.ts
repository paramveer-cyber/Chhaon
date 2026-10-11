import { findDailyWeatherByDate, upsertDailyWeather } from "@repo/database/queries/daily-weather";
import {
  openMeteoArchiveUrl,
  openMeteoForecastUrl,
  studyAreaMiddleLatitude,
  studyAreaMiddleLongitude,
  weatherTimeZone,
} from "../config";
import { ApiError } from "../api-response";
import { weatherIndexFor } from "../heat/formulas";
import { requestJson } from "../http";

type OpenMeteoDailyResult = {
  daily: { apparent_temperature_max: (number | null)[] };
};

const todayInStudyArea = () => new Date().toLocaleDateString("en-CA", { timeZone: weatherTimeZone });

export const resolveWeatherDate = (requestedDate?: string) => {
  const todayDate = todayInStudyArea();
  if (requestedDate === undefined) return todayDate;
  if (requestedDate > todayDate) throw ApiError.badRequest("Date must not be in the future");
  return requestedDate;
};

const readApparentTemperatureMaxCelsius = async (weatherDate: string) => {
  const sourceUrl = weatherDate === todayInStudyArea() ? openMeteoForecastUrl : openMeteoArchiveUrl;
  const queryText = new URLSearchParams({
    latitude: String(studyAreaMiddleLatitude),
    longitude: String(studyAreaMiddleLongitude),
    daily: "apparent_temperature_max",
    start_date: weatherDate,
    end_date: weatherDate,
    timezone: weatherTimeZone,
  });
  const { daily } = await requestJson<OpenMeteoDailyResult>(`${sourceUrl}?${queryText}`);
  const apparentTemperatureMaxCelsius = daily.apparent_temperature_max[0];
  if (apparentTemperatureMaxCelsius === null || apparentTemperatureMaxCelsius === undefined) {
    throw ApiError.notFound(`No weather data for ${weatherDate}`);
  }
  return apparentTemperatureMaxCelsius;
};

export const getDailyWeather = async (weatherDate: string) => {
  const cachedDailyWeather = await findDailyWeatherByDate(weatherDate);
  if (cachedDailyWeather) return cachedDailyWeather;

  const apparentTemperatureMaxCelsius = await readApparentTemperatureMaxCelsius(weatherDate);
  const newDailyWeather = {
    weatherDate,
    apparentTemperatureMaxCelsius,
    weatherIndex: weatherIndexFor(apparentTemperatureMaxCelsius),
  };
  await upsertDailyWeather(newDailyWeather);
  return newDailyWeather;
};
