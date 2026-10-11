import { findCoolingPointsByIds } from "@repo/database/queries/cooling-point";
import { type NewCoolingPointReport, insertCoolingPointReport } from "@repo/database/queries/cooling-point-report";
import type { CoolingPointType } from "@repo/database/models/cooling-point";
import { ApiError } from "../api-response";
import { waterConfidenceByCoolingPointType } from "../config";
import { mergeNearbyCoolingPoints } from "./merge";
import { officialCoolingPointRows } from "./official-points";
import { readOpenStreetMapCoolingPoints } from "./overpass";

export { mergeNearbyCoolingPoints } from "./merge";

export const buildCoolingPointRows = async () =>
  mergeNearbyCoolingPoints([...officialCoolingPointRows, ...(await readOpenStreetMapCoolingPoints())]);

export const withWaterConfidence = <CoolingPointRow extends { type: CoolingPointType }>(
  coolingPointRow: CoolingPointRow,
) => ({
  ...coolingPointRow,
  waterConfidence: waterConfidenceByCoolingPointType[coolingPointRow.type],
});

export const reportCoolingPointCorrection = async (newReport: NewCoolingPointReport) => {
  const { reportType, coolingPointId, latitude, longitude } = newReport;

  if (reportType === "new_place" && (latitude == null || longitude == null)) {
    throw ApiError.badRequest("A new place report needs latitude and longitude");
  }
  if (reportType !== "new_place" && coolingPointId == null) {
    throw ApiError.badRequest("This report type needs a cooling point id");
  }
  if (coolingPointId != null && (await findCoolingPointsByIds([coolingPointId])).length === 0) {
    throw ApiError.notFound("Cooling point not found");
  }

  const [insertedReport] = await insertCoolingPointReport(newReport);
  if (!insertedReport) throw ApiError.internal("Report was not stored");
  return insertedReport.id;
};
