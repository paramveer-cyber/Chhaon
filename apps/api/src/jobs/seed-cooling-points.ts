import { logger } from "@repo/logger";
import { deleteAllDailyPlans } from "@repo/database/queries/daily-plan";
import { replaceAllCoolingPoints } from "@repo/database/queries/cooling-point";
import { buildCoolingPointRows } from "@repo/services/cooling-point";
import { minimumCoolingPointCount } from "@repo/services/config";
import { runJob } from "./run-job";

const seedCoolingPoints = async () => {
  const coolingPointRows = await buildCoolingPointRows();
  const officialPointCount = coolingPointRows.filter(({ source }) => source === "official").length;
  logger.info(`Built ${coolingPointRows.length} cooling points, ${officialPointCount} official`);
  if (coolingPointRows.length < minimumCoolingPointCount) {
    logger.warn(`Fewer than ${minimumCoolingPointCount} cooling points`);
  }
  await replaceAllCoolingPoints(coolingPointRows);
  await deleteAllDailyPlans();
  logger.info(`Stored ${coolingPointRows.length} cooling points`);
};

runJob("Seed cooling points job", seedCoolingPoints);
