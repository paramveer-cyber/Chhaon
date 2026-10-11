import { scalingPercentiles } from "../config";

export const sentinelBandNames = ["green", "red", "nir", "swir16"] as const;

type SentinelBands = Record<(typeof sentinelBandNames)[number], Float32Array>;

const valueAt = (values: Float32Array, index: number) => values[index] ?? NaN;

const normalisedDifference = (firstBand: Float32Array, secondBand: Float32Array) =>
  firstBand.map((firstValue, index) => {
    const secondValue = valueAt(secondBand, index);
    const total = firstValue + secondValue;
    return total === 0 ? NaN : (firstValue - secondValue) / total;
  });

export const computeSentinelIndices = ({ green, red, nir, swir16 }: SentinelBands) => ({
  ndvi: normalisedDifference(nir, red),
  ndbi: normalisedDifference(swir16, nir),
  ndwi: normalisedDifference(green, nir),
});

const sortedFiniteValues = (values: ArrayLike<number>) =>
  Array.from(values)
    .filter(Number.isFinite)
    .sort((firstValue, secondValue) => firstValue - secondValue);

const medianOfSorted = (sortedValues: number[]) => {
  const middleIndex = Math.floor(sortedValues.length / 2);
  const middleValue = sortedValues[middleIndex];
  const lowerMiddleValue = sortedValues[middleIndex - 1];
  if (middleValue === undefined) return NaN;
  if (sortedValues.length % 2 === 1 || lowerMiddleValue === undefined) return middleValue;
  return (lowerMiddleValue + middleValue) / 2;
};

export const medianAcrossScenes = (valuesPerScene: Float32Array[]) => {
  const cellCount = valuesPerScene[0]?.length ?? 0;
  return Float32Array.from({ length: cellCount }, (_, cellIndex) =>
    medianOfSorted(sortedFiniteValues(valuesPerScene.map((sceneValues) => valueAt(sceneValues, cellIndex)))),
  );
};

export const scaleToUnitRange = (values: Float32Array) => {
  const sortedValues = sortedFiniteValues(values);
  const lowerBound = sortedValues[Math.round(scalingPercentiles.lower * (sortedValues.length - 1))] ?? 0;
  const upperBound = sortedValues[Math.round(scalingPercentiles.upper * (sortedValues.length - 1))] ?? 0;
  const range = upperBound - lowerBound;
  return values.map((value) =>
    range === 0 ? 0 : Math.min(1, Math.max(0, (value - lowerBound) / range)),
  );
};
