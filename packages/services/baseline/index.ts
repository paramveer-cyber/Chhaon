import { logger } from "@repo/logger";
import { maximumScenesPerCollection } from "../config";
import { Coordinates } from "../geo";
import { buildCellCentres, buildGridCellRows } from "./grid";
import { readSurfaceTemperatureCelsius } from "./earth-engine";
import { readPopulationPerCell } from "./population";
import { computeSentinelIndices, medianAcrossScenes, sentinelBandNames } from "./indices";
import { readSceneBands, Scene, searchScenes, sentinel2CollectionName } from "./satellite";

const readAllScenes = async <AssetName extends string, SceneResult>(
  collectionName: string,
  assetNames: readonly AssetName[],
  cellCentres: Coordinates[],
  convertBands: (bands: Record<AssetName, Float32Array>) => SceneResult,
) => {
  const scenes: Scene[] = await searchScenes(collectionName, maximumScenesPerCollection);
  logger.info(`${collectionName}: ${scenes.length} scenes found`);
  const sceneResults: SceneResult[] = [];
  for (const scene of scenes) {
    sceneResults.push(convertBands(await readSceneBands(scene, assetNames, cellCentres)));
    logger.info(`${collectionName}: read ${scene.id}`);
  }
  return sceneResults;
};

export const buildBaselineGridCells = async () => {
  const cellCentres = buildCellCentres();
  logger.info(`Study area has ${cellCentres.length} cells`);

  const sentinelIndicesPerScene = await readAllScenes(
    sentinel2CollectionName,
    sentinelBandNames,
    cellCentres,
    computeSentinelIndices,
  );
  const surfaceTemperatureCelsius = await readSurfaceTemperatureCelsius(cellCentres);

  const populationPerCell = await readPopulationPerCell();

  const gridCellRows = buildGridCellRows(cellCentres, {
    surfaceTemperatureCelsius,
    populationPerCell,
    ndvi: medianAcrossScenes(sentinelIndicesPerScene.map(({ ndvi }) => ndvi)),
    ndbi: medianAcrossScenes(sentinelIndicesPerScene.map(({ ndbi }) => ndbi)),
    ndwi: medianAcrossScenes(sentinelIndicesPerScene.map(({ ndwi }) => ndwi)),
  });
  const completeCellPercent = (100 * gridCellRows.length) / cellCentres.length;
  logger.info(`${gridCellRows.length} of ${cellCentres.length} cells complete (${completeCellPercent.toFixed(1)}%)`);
  return gridCellRows;
};
