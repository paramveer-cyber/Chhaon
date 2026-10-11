import type { NewGridCell } from "@repo/database/queries/grid-cell";
import {
  baselineHeatWeights,
  gridCellSizeInMetres,
  studyAreaBoundingBox,
  studyAreaMiddleLatitude,
} from "../config";
import { Coordinates, degreesOfLongitudeForMetres, metresPerDegreeLatitude } from "../geo";
import { scaleToUnitRange } from "./indices";

type CellMeasurements = {
  surfaceTemperatureCelsius: Float32Array;
  ndvi: Float32Array;
  ndbi: Float32Array;
  ndwi: Float32Array;
  populationPerCell: Float32Array;
};

const valueAt = (values: Float32Array, index: number) => values[index] ?? NaN;

const { westLongitude, southLatitude, eastLongitude, northLatitude } = studyAreaBoundingBox;

export const gridStepInDegrees = {
  latitude: gridCellSizeInMetres / metresPerDegreeLatitude,
  longitude: degreesOfLongitudeForMetres(gridCellSizeInMetres, studyAreaMiddleLatitude),
} as const;

export const gridRowCount = Math.floor((northLatitude - southLatitude) / gridStepInDegrees.latitude);
export const gridColumnCount = Math.floor((eastLongitude - westLongitude) / gridStepInDegrees.longitude);

export const buildCellCentres = () => {
  const cellCentres: Coordinates[] = [];
  for (let rowIndex = 0; rowIndex < gridRowCount; rowIndex += 1) {
    for (let columnIndex = 0; columnIndex < gridColumnCount; columnIndex += 1) {
      cellCentres.push({
        latitude: southLatitude + (rowIndex + 0.5) * gridStepInDegrees.latitude,
        longitude: westLongitude + (columnIndex + 0.5) * gridStepInDegrees.longitude,
      });
    }
  }
  return cellCentres;
};

export const buildGridCellRows = (cellCentres: Coordinates[], measurements: CellMeasurements) => {
  const scaledTemperature = scaleToUnitRange(measurements.surfaceTemperatureCelsius);
  const scaledNdvi = scaleToUnitRange(measurements.ndvi);
  const scaledNdbi = scaleToUnitRange(measurements.ndbi);
  const scaledNdwi = scaleToUnitRange(measurements.ndwi);

  const gridCellRows: NewGridCell[] = [];
  cellCentres.forEach(({ latitude, longitude }, cellIndex) => {
    const surfaceTemperatureCelsius = valueAt(measurements.surfaceTemperatureCelsius, cellIndex);
    const ndvi = valueAt(measurements.ndvi, cellIndex);
    const ndbi = valueAt(measurements.ndbi, cellIndex);
    const ndwi = valueAt(measurements.ndwi, cellIndex);
    if (![surfaceTemperatureCelsius, ndvi, ndbi, ndwi].every(Number.isFinite)) return;
    const population = valueAt(measurements.populationPerCell, cellIndex);

    const baselineHeat =
      baselineHeatWeights.surfaceTemperature * valueAt(scaledTemperature, cellIndex) +
      baselineHeatWeights.builtUp * valueAt(scaledNdbi, cellIndex) +
      baselineHeatWeights.treeShortage * (1 - valueAt(scaledNdvi, cellIndex)) -
      baselineHeatWeights.waterCredit * valueAt(scaledNdwi, cellIndex);

    gridCellRows.push({
      centreLatitude: latitude,
      centreLongitude: longitude,
      surfaceTemperatureCelsius,
      ndvi,
      ndbi,
      ndwi,
      baselineHeat: Math.max(0, baselineHeat),
      population: Number.isFinite(population) ? population : 0,
    });
  });
  return gridCellRows;
};
