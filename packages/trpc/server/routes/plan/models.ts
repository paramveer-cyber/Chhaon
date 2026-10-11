import { z, zodApiResponse, optionalDateModel } from "../../schema";
import { coolingPointModel } from "../cooling-point/models";

export const getPlanInputModel = z.object({ date: optionalDateModel });

export const planPickModel = coolingPointModel.extend({
  rank: z.number().int().min(1),
  peopleNewlyCovered: z.number(),
});

export type PlanPick = z.infer<typeof planPickModel>;

export const getPlanOutputModel = zodApiResponse(
  z.object({
    date: z.iso.date(),
    coveragePercentBefore: z.number().min(0).max(100),
    coveragePercentAfter: z.number().min(0).max(100),
    picks: z.array(planPickModel),
  }),
);
