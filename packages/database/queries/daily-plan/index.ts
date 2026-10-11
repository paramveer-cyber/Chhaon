import { db, eq } from "../../index";
import { dailyPlan, planPick } from "../../models/daily-plan";

export type NewDailyPlan = typeof dailyPlan.$inferInsert;
export type NewPlanPick = Omit<typeof planPick.$inferInsert, "dailyPlanId">;

export const findDailyPlanByDate = async (planDate: string) => {
  const [foundDailyPlan] = await db.select().from(dailyPlan).where(eq(dailyPlan.planDate, planDate));
  if (!foundDailyPlan) return undefined;
  const picks = await db
    .select()
    .from(planPick)
    .where(eq(planPick.dailyPlanId, foundDailyPlan.id))
    .orderBy(planPick.rank);
  return { ...foundDailyPlan, picks };
};

export const insertDailyPlan = (newDailyPlan: NewDailyPlan, newPlanPicks: NewPlanPick[]) =>
  db.transaction(async (transaction) => {
    const [insertedDailyPlan] = await transaction
      .insert(dailyPlan)
      .values(newDailyPlan)
      .onConflictDoNothing()
      .returning({ id: dailyPlan.id });
    if (!insertedDailyPlan) return undefined;
    if (newPlanPicks.length > 0) {
      await transaction
        .insert(planPick)
        .values(newPlanPicks.map((newPlanPick) => ({ ...newPlanPick, dailyPlanId: insertedDailyPlan.id })));
    }
    return insertedDailyPlan.id;
  });

export const deleteAllDailyPlans = () => db.delete(dailyPlan);
