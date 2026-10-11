import { sql, type SQL } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";

export const orderByPlanarDistance = (
  latitudeColumn: PgColumn,
  longitudeColumn: PgColumn,
  origin: { latitude: number; longitude: number },
): SQL => {
  const latitudeOffset = sql`${latitudeColumn} - ${origin.latitude}::double precision`;
  const scaledLongitudeOffset = sql`(${longitudeColumn} - ${origin.longitude}::double precision) * cos(radians(${origin.latitude}::double precision))`;
  return sql`power(${latitudeOffset}, 2) + power(${scaledLongitudeOffset}, 2)`;
};
