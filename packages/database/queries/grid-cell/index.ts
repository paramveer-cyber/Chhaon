import { db } from "../../index";
import { orderByPlanarDistance } from "../../planar-distance";
import { replaceAllRows } from "../../replace-all-rows";
import { gridCell } from "../../models/grid-cell";

export type NewGridCell = typeof gridCell.$inferInsert;

export const listAllGridCells = () => db.select().from(gridCell);

export const findNearestGridCell = async (origin: { latitude: number; longitude: number }) => {
  const [nearestGridCell] = await db
    .select()
    .from(gridCell)
    .orderBy(orderByPlanarDistance(gridCell.centreLatitude, gridCell.centreLongitude, origin))
    .limit(1);
  return nearestGridCell;
};

export const replaceAllGridCells = (newGridCells: NewGridCell[]) =>
  replaceAllRows(gridCell, newGridCells);
