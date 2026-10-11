import { logger } from "@repo/logger";
import { deleteAllDailyPlans } from "@repo/database/queries/daily-plan";
import { replaceAllGridCells } from "@repo/database/queries/grid-cell";
import { buildBaselineGridCells } from "@repo/services/baseline";
import { plausibleSurfaceTemperatureCelsius } from "@repo/services/config";
import { runJob } from "./run-job";

const buildBaseline = async () => {
  const gridCellRows = await buildBaselineGridCells();
  const surfaceTemperatures = gridCellRows.map(({ surfaceTemperatureCelsius }) => surfaceTemperatureCelsius);
  const coldestTemperature = Math.min(...surfaceTemperatures);
  const hottestTemperature = Math.max(...surfaceTemperatures);
  logger.info(`Surface temperature range: ${coldestTemperature.toFixed(1)} to ${hottestTemperature.toFixed(1)} C`);
  if (
    coldestTemperature < plausibleSurfaceTemperatureCelsius.minimum ||
    hottestTemperature > plausibleSurfaceTemperatureCelsius.maximum
  ) {
    logger.warn("Surface temperature range is outside the plausible range");
  }
  await replaceAllGridCells(gridCellRows);
  await deleteAllDailyPlans();
  logger.info(`Stored ${gridCellRows.length} grid cells`);
};

runJob("Baseline job", buildBaseline);
