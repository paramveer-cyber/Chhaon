import { date, doublePrecision, integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { coolingPoint } from "./cooling-point";

export const dailyPlan = pgTable("daily_plan", {
  id: serial().primaryKey(),
  planDate: date({ mode: "string" }).notNull().unique(),
  coveragePercentBefore: doublePrecision().notNull(),
  coveragePercentAfter: doublePrecision().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
});

export const planPick = pgTable("plan_pick", {
  id: serial().primaryKey(),
  dailyPlanId: integer()
    .notNull()
    .references(() => dailyPlan.id, { onDelete: "cascade" }),
  coolingPointId: integer()
    .notNull()
    .references(() => coolingPoint.id, { onDelete: "cascade" }),
  rank: integer().notNull(),
  peopleNewlyCovered: doublePrecision().notNull(),
});
