import { fromUrl, GeoTIFF } from "geotiff";
import proj4 from "proj4";
import {
  baselineDateRange,
  gridCellSizeInMetres,
  maximumCloudCoverPercent,
  studyAreaBoundingBox,
} from "../config";
import { Coordinates } from "../geo";
import { requestJson } from "../http";

export const sentinel2CollectionName = "sentinel-2-l2a";

const earthSearchUrl = "https://earth-search.aws.element84.com/v1/search";
const defaultNoDataValue = 0;
const northernUtmFirstEpsgCode = 32601;
const northernUtmLastEpsgCode = 32660;
const northernUtmEpsgBase = 32600;

type StacRasterBand = { scale?: number; offset?: number; nodata?: number };

type StacAsset = {
  href: string;
  "raster:bands"?: StacRasterBand[];
};

export type Scene = {
  id: string;
  properties: { "proj:epsg": number };
  assets: Record<string, StacAsset>;
};

type StacSearchResult = { features: Scene[] };

type ProjectedPoint = [number, number];

export const searchScenes = async (collectionName: string, sceneLimit: number) => {
  const { westLongitude, southLatitude, eastLongitude, northLatitude } = studyAreaBoundingBox;
  const searchResult = await requestJson<StacSearchResult>(earthSearchUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      collections: [collectionName],
      bbox: [westLongitude, southLatitude, eastLongitude, northLatitude],
      datetime: `${baselineDateRange.startDate}T00:00:00Z/${baselineDateRange.endDate}T23:59:59Z`,
      query: { "eo:cloud_cover": { lt: maximumCloudCoverPercent } },
      limit: sceneLimit,
    }),
  });
  return searchResult.features;
};

const projectCellCentres = (cellCentres: Coordinates[], sceneEpsgCode: number) => {
  if (sceneEpsgCode < northernUtmFirstEpsgCode || sceneEpsgCode > northernUtmLastEpsgCode) {
    throw new Error(`Only northern UTM scenes are supported, got EPSG:${sceneEpsgCode}`);
  }
  const utmZone = sceneEpsgCode - northernUtmEpsgBase;
  const toSceneCrs = proj4("EPSG:4326", `+proj=utm +zone=${utmZone} +datum=WGS84 +units=m +no_defs`);
  return cellCentres.map(
    ({ latitude, longitude }) => toSceneCrs.forward([longitude, latitude]) as ProjectedPoint,
  );
};

const pickImageNearGridResolution = async (tiff: GeoTIFF) => {
  const imageCount = await tiff.getImageCount();
  const fullResolutionImage = await tiff.getImage(0);
  let pickedImage = fullResolutionImage;
  for (let imageIndex = 1; imageIndex < imageCount; imageIndex += 1) {
    const overviewImage = await tiff.getImage(imageIndex);
    const overviewPixelSize = Math.abs(overviewImage.getResolution(fullResolutionImage)[0] ?? Infinity);
    if (overviewPixelSize <= gridCellSizeInMetres) pickedImage = overviewImage;
  }
  return { fullResolutionImage, pickedImage };
};

const readBandAtProjectedPoints = async (
  scene: Scene,
  assetName: string,
  projectedPoints: ProjectedPoint[],
) => {
  const asset = scene.assets[assetName];
  if (!asset) throw new Error(`Scene ${scene.id} has no ${assetName} asset`);

  const tiff = await fromUrl(asset.href);
  const { fullResolutionImage, pickedImage } = await pickImageNearGridResolution(tiff);
  const [originX = 0, originY = 0] = fullResolutionImage.getOrigin();
  const [pixelWidth = 1, pixelHeight = -1] = pickedImage.getResolution(fullResolutionImage);

  const pixelPositions = projectedPoints.map(([projectedX, projectedY]) => ({
    column: Math.floor((projectedX - originX) / pixelWidth),
    row: Math.floor((projectedY - originY) / pixelHeight),
  }));
  const isInsideImage = ({ column, row }: { column: number; row: number }) =>
    column >= 0 && column < pickedImage.getWidth() && row >= 0 && row < pickedImage.getHeight();

  const bandValues = new Float32Array(projectedPoints.length).fill(NaN);
  const insidePositions = pixelPositions.filter(isInsideImage);
  if (insidePositions.length === 0) return bandValues;

  const left = Math.min(...insidePositions.map(({ column }) => column));
  const right = Math.max(...insidePositions.map(({ column }) => column)) + 1;
  const top = Math.min(...insidePositions.map(({ row }) => row));
  const bottom = Math.max(...insidePositions.map(({ row }) => row)) + 1;
  const [rasterBand] = (await pickedImage.readRasters({
    window: [left, top, right, bottom],
    samples: [0],
  })) as unknown as ArrayLike<number>[];
  if (!rasterBand) throw new Error(`${assetName} of scene ${scene.id} returned no raster band`);

  const { scale = 1, offset = 0, nodata = defaultNoDataValue } = asset["raster:bands"]?.[0] ?? {};
  pixelPositions.forEach((position, cellIndex) => {
    if (!isInsideImage(position)) return;
    const rawValue = rasterBand[(position.row - top) * (right - left) + (position.column - left)];
    if (rawValue === undefined || rawValue === nodata) return;
    bandValues[cellIndex] = rawValue * scale + offset;
  });
  return bandValues;
};

export const readSceneBands = async <AssetName extends string>(
  scene: Scene,
  assetNames: readonly AssetName[],
  cellCentres: Coordinates[],
) => {
  const projectedPoints = projectCellCentres(cellCentres, scene.properties["proj:epsg"]);
  const bandValuesPerAsset = await Promise.all(
    assetNames.map((assetName) => readBandAtProjectedPoints(scene, assetName, projectedPoints)),
  );
  return Object.fromEntries(
    assetNames.map((assetName, assetIndex) => [assetName, bandValuesPerAsset[assetIndex]]),
  ) as Record<AssetName, Float32Array>;
};
