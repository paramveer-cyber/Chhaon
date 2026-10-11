import type { RouterOutputs } from "@repo/trpc/client";
import { trpc } from "~/trpc/client";

export type PlanPick = RouterOutputs["plan"]["getPlan"]["data"]["picks"][number];

export const usePlan = (date: string | undefined) => trpc.plan.getPlan.useQuery({ date });
