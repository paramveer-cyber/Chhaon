import type { RouterOutputs } from "@repo/trpc/client";
import { trpc } from "~/trpc/client";
import type { UserLocation } from "~/hooks/user-location";

export type HeatGrid = RouterOutputs["heat"]["getHeatGrid"]["data"];
export type HeatLevel = HeatGrid["cells"][number]["heatLevel"];

export const useHeatGrid = (date: string | undefined) => trpc.heat.getHeatGrid.useQuery({ date });

export const useHeatAtLocation = (userLocation: UserLocation | undefined, date?: string) =>
  trpc.heat.getHeatAtLocation.useQuery({ ...(userLocation as UserLocation), date }, {
    enabled: userLocation !== undefined,
  });
