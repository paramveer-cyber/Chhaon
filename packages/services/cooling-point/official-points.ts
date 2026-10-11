import type { NewCoolingPoint } from "@repo/database/queries/cooling-point";

type OfficialCoolingPoint = {
  name: string;
  latitude: number;
  longitude: number;
};

const officialCoolingPoints: OfficialCoolingPoint[] = [];

export const officialCoolingPointRows: NewCoolingPoint[] = officialCoolingPoints.map((officialPoint) => ({
  ...officialPoint,
  type: "cooling_zone",
  source: "official",
}));
