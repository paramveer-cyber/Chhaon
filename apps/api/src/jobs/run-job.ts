import { logger } from "@repo/logger";
import { describeError } from "@repo/services/describe-error";

export const runJob = (jobName: string, job: () => Promise<void>) =>
  job()
    .catch((error) => {
      logger.error(`${jobName} failed: ${describeError(error)}`);
      process.exitCode = 1;
    })
    .finally(() => process.exit());
