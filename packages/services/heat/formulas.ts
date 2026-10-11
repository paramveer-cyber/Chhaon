import {
  heatLevelMinimumScores,
  heatScoreWeights,
  weatherIndexApparentTemperatureCelsius,
} from "../config";

export type HeatLevel = "high" | "medium" | "low";

type GridCellForHeat = {
  id: number;
  centreLatitude: number;
  centreLongitude: number;
  baselineHeat: number;
};

const maximumHeatScore = 100;
const heatScoreDecimalPlaces = 1;

export const weatherIndexFor = (apparentTemperatureMaxCelsius: number) => {
  const { minimum, maximum } = weatherIndexApparentTemperatureCelsius;
  const scaledTemperature = (apparentTemperatureMaxCelsius - minimum) / (maximum - minimum);
  return Math.min(1, Math.max(0, scaledTemperature));
};

export const heatScoreFor = (baselineHeat: number, weatherIndex: number) =>
  Math.min(
    maximumHeatScore,
    Math.max(
      0,
      maximumHeatScore * (heatScoreWeights.baselineHeat * baselineHeat + heatScoreWeights.weatherIndex * weatherIndex),
    ),
  );

export const heatLevelForScore = (heatScore: number): HeatLevel => {
  if (heatScore >= heatLevelMinimumScores.high) return "high";
  if (heatScore >= heatLevelMinimumScores.medium) return "medium";
  return "low";
};

export const rateHeat = (baselineHeat: number, weatherIndex: number) => {
  const heatScore = heatScoreFor(baselineHeat, weatherIndex);
  return {
    heatScore: Number(heatScore.toFixed(heatScoreDecimalPlaces)),
    heatLevel: heatLevelForScore(heatScore),
  };
};

export const buildHeatCells = (gridCells: GridCellForHeat[], weatherIndex: number) =>
  gridCells.map(({ id, centreLatitude, centreLongitude, baselineHeat }) => ({
    cellId: id,
    centreLatitude,
    centreLongitude,
    ...rateHeat(baselineHeat, weatherIndex),
  }));
