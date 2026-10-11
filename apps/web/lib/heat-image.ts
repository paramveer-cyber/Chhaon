import type { HeatGrid, HeatLevel } from "~/hooks/heat";
import { heatColourFor, heatScoreScaleMaximum } from "~/lib/heat-colour";
import { rangeOf } from "~/lib/range";

const opaqueAlpha = 255;
const channelsPerPixel = 4;

export const buildHeatImage = ({ cells, cellSizeInDegrees }: HeatGrid, visibleLevels: Set<HeatLevel>) => {
  const latitudeRange = rangeOf(cells.map(({ centreLatitude }) => centreLatitude));
  const longitudeRange = rangeOf(cells.map(({ centreLongitude }) => centreLongitude));
  const columnCount = Math.round((longitudeRange.highest - longitudeRange.lowest) / cellSizeInDegrees.longitude) + 1;
  const rowCount = Math.round((latitudeRange.highest - latitudeRange.lowest) / cellSizeInDegrees.latitude) + 1;

  const canvas = document.createElement("canvas");
  canvas.width = columnCount;
  canvas.height = rowCount;
  const canvasContext = canvas.getContext("2d");
  if (!canvasContext) return undefined;
  const imageData = canvasContext.createImageData(columnCount, rowCount);

  cells.forEach(({ centreLatitude, centreLongitude, heatScore, heatLevel }) => {
    if (!visibleLevels.has(heatLevel)) return;
    const columnIndex = Math.round((centreLongitude - longitudeRange.lowest) / cellSizeInDegrees.longitude);
    const rowIndex = Math.round((latitudeRange.highest - centreLatitude) / cellSizeInDegrees.latitude);
    const pixelOffset = (rowIndex * columnCount + columnIndex) * channelsPerPixel;
    const [red, green, blue] = heatColourFor(heatScore / heatScoreScaleMaximum);
    imageData.data.set([red, green, blue, opaqueAlpha], pixelOffset);
  });
  canvasContext.putImageData(imageData, 0, 0);

  const halfLatitudeStep = cellSizeInDegrees.latitude / 2;
  const halfLongitudeStep = cellSizeInDegrees.longitude / 2;
  return {
    imageUrl: canvas.toDataURL(),
    bounds: [
      [latitudeRange.lowest - halfLatitudeStep, longitudeRange.lowest - halfLongitudeStep],
      [latitudeRange.highest + halfLatitudeStep, longitudeRange.highest + halfLongitudeStep],
    ] as [[number, number], [number, number]],
  };
};
