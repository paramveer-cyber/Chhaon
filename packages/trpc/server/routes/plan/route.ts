import { ApiResponse } from "@repo/services/api-response";
import { getPlan } from "@repo/services/plan";
import { publicProcedure, router } from "../../trpc";
import { generatePath } from "../../utils/path-generator";
import { getPlanInputModel, getPlanOutputModel } from "./models";

const planPath = generatePath("plan");

export const planRouter = router({
  getPlan: publicProcedure
    .meta({ openapi: { method: "GET", path: planPath(""), protect: false } })
    .input(getPlanInputModel)
    .output(getPlanOutputModel)
    .query(async ({ input }) => ApiResponse.ok("Plan", await getPlan(input.date))),
});
