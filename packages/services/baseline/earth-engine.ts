import { readFile } from "node:fs/promises";
import ee from "@google/earthengine";
import { fromArrayBuffer } from "geotiff";
import { logger } from "@repo/logger";
import {
  baselineDateRange,
  earthEngineProjectId,
  earthEngineScaleInMetres,
  maximumCloudCoverPercent,
  studyAreaBoundingBox,
} from "../config";
import { Coordinates } from "../geo";
import { requestArrayBuffer } from "../http";

const landsat8CollectionId = "LANDSAT/LC08/C02/T1_L2";
const landsat9CollectionId = "LANDSAT/LC09/C02/T1_L2";
const surfaceTemperatureBandName = "ST_B10";
const surfaceTemperatureScale = 0.00341802;
const surfaceTemperatureOffsetInKelvin = 149;
const kelvinToCelsiusOffset = 273.15;
const missingTemperatureCelsius = -9999;
const outputBandName = "surface_temperature_celsius";

type CallbackStarter = (onSuccess: () => void, onFailure: (message: string) => void) => void;

const waitForCallbacks = (start: CallbackStarter) =>
  new Promise<void>((resolve, reject) => start(resolve, (message) => reject(new Error(message))));

const initialiseEarthEngine = async () => {
  const keyFilePath = process.env.EARTH_ENGINE_KEY_FILE;
  if (!keyFilePath) throw new Error("EARTH_ENGINE_KEY_FILE is not set");
  const privateKey = JSON.parse(await readFile(keyFilePath, "utf8"));
  await waitForCallbacks((onSuccess, onFailure) =>
    ee.data.authenticateViaPrivateKey(privateKey, onSuccess, onFailure),
  );
  await waitForCallbacks((onSuccess, onFailure) =>
    ee.initialize(null, null, onSuccess, onFailure, null, earthEngineProjectId),
  );
};

const buildStudyArea = () => {
  const { westLongitude, southLatitude, eastLongitude, northLatitude } = studyAreaBoundingBox;
  return ee.Geometry.Rectangle([westLongitude, southLatitude, eastLongitude, northLatitude]);
};

const buildMedianSurfaceTemperatureImage = (studyArea: unknown) =>
  ee
    .ImageCollection(landsat8CollectionId)
    .merge(ee.ImageCollection(landsat9CollectionId))
    .filterBounds(studyArea)
    .filterDate(baselineDateRange.startDate, baselineDateRange.endDate)
    .filter(ee.Filter.lt("CLOUD_COVER", maximumCloudCoverPercent))
    .select(surfaceTemperatureBandName)
    .map((image: any) =>
      image
        .multiply(surfaceTemperatureScale)
        .add(surfaceTemperatureOffsetInKelvin)
        .subtract(kelvinToCelsiusOffset)
        .rename(outputBandName),
    )
    .median()
    .unmask(missingTemperatureCelsius)
    .toFloat();

const requestDownloadUrl = (image: any, studyArea: unknown) =>
  new Promise<string>((resolve, reject) =>
    image.getDownloadURL(
      { region: studyArea, scale: earthEngineScaleInMetres, crs: "EPSG:4326", format: "GEO_TIFF" },
      (downloadUrl: string | undefined, errorMessage: string | undefined) =>
        downloadUrl ? resolve(downloadUrl) : reject(new Error(errorMessage ?? "Earth Engine returned no download URL")),
    ),
  );

export const readSurfaceTemperatureCelsius = async (cellCentres: Coordinates[]) => {
  await initialiseEarthEngine();
  const studyArea = buildStudyArea();
  const downloadUrl = await requestDownloadUrl(buildMedianSurfaceTemperatureImage(studyArea), studyArea);
  const tiff = await fromArrayBuffer(await requestArrayBuffer(downloadUrl));
  const image = await tiff.getImage();
  const [originLongitude = 0, originLatitude = 0] = image.getOrigin();
  const [signedPixelWidth = 1, signedPixelHeight = 1] = image.getResolution();
  const pixelWidth = Math.abs(signedPixelWidth);
  const pixelHeight = Math.abs(signedPixelHeight);
  const imageWidth = image.getWidth();
  const imageHeight = image.getHeight();
  const [rasterBand] = (await image.readRasters({ samples: [0] })) as unknown as ArrayLike<number>[];
  if (!rasterBand) throw new Error("Earth Engine file has no raster band");
  logger.info(
    `Earth Engine image ${imageWidth}x${imageHeight}, origin ${originLongitude}, ${originLatitude}, pixel ${pixelWidth}, ${pixelHeight}`,
  );

  return Float32Array.from(cellCentres, ({ latitude, longitude }) => {
    const column = Math.floor((longitude - originLongitude) / pixelWidth);
    const row = Math.floor((originLatitude - latitude) / pixelHeight);
    const isInsideImage = column >= 0 && column < imageWidth && row >= 0 && row < imageHeight;
    const temperature = isInsideImage ? rasterBand[row * imageWidth + column] : undefined;
    return temperature === undefined || temperature === missingTemperatureCelsius ? NaN : temperature;
  });
};
