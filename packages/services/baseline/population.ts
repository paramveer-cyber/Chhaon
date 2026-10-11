import { fromFile } from "geotiff";
import { studyAreaBoundingBox } from "../config";
import { gridColumnCount, gridRowCount, gridStepInDegrees } from "./grid";

const { westLongitude, southLatitude, eastLongitude, northLatitude } = studyAreaBoundingBox;

export const readPopulationPerCell = async () => {
  const worldPopFilePath = process.env.WORLDPOP_FILE_PATH;
  if (!worldPopFilePath) throw new Error("WORLDPOP_FILE_PATH is not set");

  const image = await (await fromFile(worldPopFilePath)).getImage();
  const [originLongitude = 0, originLatitude = 0] = image.getOrigin();
  const [pixelWidthInDegrees = 1, pixelHeightInDegrees = -1] = image.getResolution();

  const firstColumn = Math.max(0, Math.floor((westLongitude - originLongitude) / pixelWidthInDegrees));
  const lastColumn = Math.min(image.getWidth(), Math.ceil((eastLongitude - originLongitude) / pixelWidthInDegrees));
  const firstRow = Math.max(0, Math.floor((northLatitude - originLatitude) / pixelHeightInDegrees));
  const lastRow = Math.min(image.getHeight(), Math.ceil((southLatitude - originLatitude) / pixelHeightInDegrees));
  const windowWidth = lastColumn - firstColumn;

  const [rasterBand] = (await image.readRasters({
    window: [firstColumn, firstRow, lastColumn, lastRow],
    samples: [0],
  })) as unknown as ArrayLike<number>[];
  if (!rasterBand) throw new Error("WorldPop file returned no raster band");

  const populationPerCell = new Float32Array(gridRowCount * gridColumnCount);
  for (let pixelIndex = 0; pixelIndex < rasterBand.length; pixelIndex += 1) {
    const peopleInPixel = rasterBand[pixelIndex];
    if (peopleInPixel === undefined || !Number.isFinite(peopleInPixel) || peopleInPixel < 0) continue;

    const pixelLongitude = originLongitude + (firstColumn + (pixelIndex % windowWidth) + 0.5) * pixelWidthInDegrees;
    const pixelLatitude = originLatitude + (firstRow + Math.floor(pixelIndex / windowWidth) + 0.5) * pixelHeightInDegrees;
    const cellRow = Math.floor((pixelLatitude - southLatitude) / gridStepInDegrees.latitude);
    const cellColumn = Math.floor((pixelLongitude - westLongitude) / gridStepInDegrees.longitude);
    if (cellRow < 0 || cellRow >= gridRowCount || cellColumn < 0 || cellColumn >= gridColumnCount) continue;

    const cellIndex = cellRow * gridColumnCount + cellColumn;
    populationPerCell[cellIndex] = (populationPerCell[cellIndex] ?? 0) + peopleInPixel;
  }
  return populationPerCell;
};
