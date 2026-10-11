import { logger } from "@repo/logger";
import { readSurfaceTemperatureCelsius } from "@repo/services/baseline/earth-engine";
import { buildCellCentres } from "@repo/services/baseline/grid";
import { Scene, searchScenes, sentinel2CollectionName } from "@repo/services/baseline/satellite";
import { openMeteoForecastUrl, overpassUrl, studyAreaBoundingBox } from "@repo/services/config";
import { describeError } from "@repo/services/describe-error";
import { requestJson } from "@repo/services/http";


const { westLongitude, southLatitude, eastLongitude, northLatitude } = studyAreaBoundingBox;
const studyAreaCentre = {
  latitude: (southLatitude + northLatitude) / 2,
  longitude: (westLongitude + eastLongitude) / 2,
};

type OpenMeteoForecast = {
  daily: { apparent_temperature_max: number[] };
};

type OverpassCountResult = {
  elements: { tags: { total: string } }[];
};

type DataAccessCheck = {
  sourceName: string;
  run: () => Promise<string>;
};

const findFirstScene = async (collectionName: string) => {
  const [firstScene] = await searchScenes(collectionName, 1);
  if (!firstScene) throw new Error(`No ${collectionName} scene found`);
  return firstScene;
};

const readFirstBytesOfAsset = async (scene: Scene, assetName: string) => {
  const asset = scene.assets[assetName];
  if (!asset) throw new Error(`Scene has no ${assetName} asset`);
  const assetResponse = await fetch(asset.href, {
    headers: { Range: "bytes=0-1023" },
  });
  if (!assetResponse.ok) {
    const responseText = await assetResponse.text();
    throw new Error(`${assetName} read answered ${assetResponse.status}: ${responseText.slice(0, 400)}`);
  }
  return `scene ${scene.id}, ${assetName} readable`;
};

const dataAccessChecks: DataAccessCheck[] = [
  {
    sourceName: "Sentinel-2 scene search and file read",
    run: async () => readFirstBytesOfAsset(await findFirstScene(sentinel2CollectionName), "red"),
  },
  {
    sourceName: "Earth Engine Landsat surface temperature",
    run: async () => {
      const surfaceTemperatures = await readSurfaceTemperatureCelsius(buildCellCentres());
      const validTemperatures = Array.from(surfaceTemperatures).filter(Number.isFinite);
      if (validTemperatures.length === 0) throw new Error("No cell has a surface temperature");
      const coldestTemperature = Math.min(...validTemperatures).toFixed(1);
      const hottestTemperature = Math.max(...validTemperatures).toFixed(1);
      return `${validTemperatures.length} of ${surfaceTemperatures.length} cells have a temperature, from ${coldestTemperature} to ${hottestTemperature} C`;
    },
  },
  {
    sourceName: "Open-Meteo forecast",
    run: async () => {
      const forecast = await requestJson<OpenMeteoForecast>(
        `${openMeteoForecastUrl}?latitude=${studyAreaCentre.latitude}&longitude=${studyAreaCentre.longitude}&daily=apparent_temperature_max&forecast_days=1&timezone=Asia%2FKolkata`,
      );
      return `apparent temperature maximum today: ${forecast.daily.apparent_temperature_max[0]}`;
    },
  },
  {
    sourceName: "Overpass drinking water points",
    run: async () => {
      const overpassQuery = `[out:json][timeout:25];node["amenity"="drinking_water"](${southLatitude},${westLongitude},${northLatitude},${eastLongitude});out count;`;
      const countResult = await requestJson<OverpassCountResult>(overpassUrl, {
        method: "POST",
        body: new URLSearchParams({ data: overpassQuery }),
      });
      const drinkingWaterPointCount = countResult.elements[0]?.tags.total;
      if (drinkingWaterPointCount === undefined) throw new Error("Overpass returned no count");
      return `${drinkingWaterPointCount} drinking water points in the study area`;
    },
  },
];

const runDataAccessChecks = async () => {
  let failedCheckCount = 0;
  for (const { sourceName, run } of dataAccessChecks) {
    try {
      logger.info(`PASS ${sourceName}: ${await run()}`);
    } catch (err) {
      failedCheckCount += 1;
      logger.error(`FAIL ${sourceName}: ${describeError(err)}`);
    }
  }
  process.exitCode = failedCheckCount === 0 ? 0 : 1;
};

runDataAccessChecks();
