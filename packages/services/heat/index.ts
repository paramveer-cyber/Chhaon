import { findNearestGridCell, listAllGridCells } from "@repo/database/queries/grid-cell";
import { ApiError } from "../api-response";
import { baselineDateRange } from "../config";
import { gridStepInDegrees } from "../baseline/grid";
import { type Coordinates, isInsideStudyArea } from "../geo";
import { getDailyWeather, resolveWeatherDate } from "../weather";
import { buildHeatCells, rateHeat } from "./formulas";

export * from "./formulas";

export const getHeatGrid = async (requestedDate?: string) => {
  const weatherDate = resolveWeatherDate(requestedDate);
  const [dailyWeather, gridCells] = await Promise.all([getDailyWeather(weatherDate), listAllGridCells()]);
  return {
    date: weatherDate,
    apparentTemperatureMaxCelsius: dailyWeather.apparentTemperatureMaxCelsius,
    weatherIndex: dailyWeather.weatherIndex,
    surfaceHeatDataRange: baselineDateRange,
    cellSizeInDegrees: gridStepInDegrees,
    cells: buildHeatCells(gridCells, dailyWeather.weatherIndex),
  };
};

export const getHeatAtLocation = async (location: Coordinates, requestedDate?: string) => {
  if (!isInsideStudyArea(location)) throw ApiError.badRequest("Location is outside the study area");
  const weatherDate = resolveWeatherDate(requestedDate);
  const [dailyWeather, nearestGridCell] = await Promise.all([
    getDailyWeather(weatherDate),
    findNearestGridCell(location),
  ]);
  if (!nearestGridCell) throw ApiError.notFound("No heat data for this location");
  return {
    date: weatherDate,
    apparentTemperatureMaxCelsius: dailyWeather.apparentTemperatureMaxCelsius,
    weatherIndex: dailyWeather.weatherIndex,
    ...rateHeat(nearestGridCell.baselineHeat, dailyWeather.weatherIndex),
  };
};
