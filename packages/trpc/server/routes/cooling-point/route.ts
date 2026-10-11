import { ApiResponse } from "@repo/services/api-response";
import { reportCoolingPointCorrection } from "@repo/services/cooling-point";
import { getNearestCoolingPoints } from "@repo/services/directions";
import { publicProcedure, router } from "../../trpc";
import { generatePath } from "../../utils/path-generator";
import {
  getNearestInputModel,
  getNearestOutputModel,
  reportCorrectionInputModel,
  reportCorrectionOutputModel,
} from "./models";

const coolingPointPath = generatePath("cooling-points");

export const coolingPointRouter = router({
  getNearest: publicProcedure
    .meta({ openapi: { method: "GET", path: coolingPointPath("nearest"), protect: false } })
    .input(getNearestInputModel)
    .output(getNearestOutputModel)
    .query(async ({ input }) =>
      ApiResponse.ok("Nearest cooling points", { places: await getNearestCoolingPoints(input) }),
    ),

  reportCorrection: publicProcedure
    .meta({ openapi: { method: "POST", path: coolingPointPath("reports"), protect: false } })
    .input(reportCorrectionInputModel)
    .output(reportCorrectionOutputModel)
    .mutation(async ({ input }) =>
      ApiResponse.created("Report stored", { reportId: await reportCoolingPointCorrection(input) }),
    ),
});
