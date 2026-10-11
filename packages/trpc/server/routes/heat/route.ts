import { ApiResponse } from "@repo/services/api-response";
import { getHeatAtLocation, getHeatGrid } from "@repo/services/heat";
import { publicProcedure, router } from "../../trpc";
import { generatePath } from "../../utils/path-generator";
import {
  getHeatAtLocationInputModel,
  getHeatAtLocationOutputModel,
  getHeatGridInputModel,
  getHeatGridOutputModel,
} from "./models";

const heatPath = generatePath("heat");

export const heatRouter = router({
  getHeatGrid: publicProcedure
    .meta({ openapi: { method: "GET", path: heatPath(""), protect: false } })
    .input(getHeatGridInputModel)
    .output(getHeatGridOutputModel)
    .query(async ({ input }) => ApiResponse.ok("Heat grid", await getHeatGrid(input.date))),

  getHeatAtLocation: publicProcedure
    .meta({ openapi: { method: "GET", path: heatPath("location"), protect: false } })
    .input(getHeatAtLocationInputModel)
    .output(getHeatAtLocationOutputModel)
    .query(async ({ input }) =>
      ApiResponse.ok("Heat at location", await getHeatAtLocation(input, input.date)),
    ),
});
