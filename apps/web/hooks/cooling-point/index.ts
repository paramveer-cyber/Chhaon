import type { RouterOutputs } from "@repo/trpc/client";
import { trpc } from "~/trpc/client";
import type { UserLocation } from "~/hooks/user-location";

export type NearestPlace = RouterOutputs["coolingPoint"]["getNearest"]["data"]["places"][number];

export const useNearestCoolingPoints = (userLocation: UserLocation | undefined) =>
  trpc.coolingPoint.getNearest.useQuery(userLocation as UserLocation, {
    enabled: userLocation !== undefined,
  });

export const useReportCorrection = () => trpc.coolingPoint.reportCorrection.useMutation();
