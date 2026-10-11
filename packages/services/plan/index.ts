import { findCoolingPointsByIds, listAllCoolingPoints } from "@repo/database/queries/cooling-point";
import { findDailyPlanByDate, insertDailyPlan } from "@repo/database/queries/daily-plan";
import { listAllGridCells } from "@repo/database/queries/grid-cell";
import { ApiError } from "../api-response";
import {
  activeWaterConfidence,
  candidateWaterConfidence,
  plannedPlaceCount,
  walkingRadiusInMetres,
} from "../config";
import { withWaterConfidence } from "../cooling-point";
import { heatLevelForScore, heatScoreFor } from "../heat/formulas";
import { getDailyWeather, resolveWeatherDate } from "../weather";
import { coveragePercent, findUncoveredCells, pickPlacesGreedily, sumPopulation } from "./coverage";

type StoredPlan = NonNullable<Awaited<ReturnType<typeof findDailyPlanByDate>>>;

const buildAndStorePlan = async (planDate: string) => {
  const [dailyWeather, gridCells, coolingPoints] = await Promise.all([
    getDailyWeather(planDate),
    listAllGridCells(),
    listAllCoolingPoints(),
  ]);

  const highRiskCells = gridCells
    .filter(
      ({ baselineHeat, population }) =>
        population > 0 && heatLevelForScore(heatScoreFor(baselineHeat, dailyWeather.weatherIndex)) === "high",
    )
    .map(({ centreLatitude, centreLongitude, population }) => ({
      latitude: centreLatitude,
      longitude: centreLongitude,
      population,
    }));

  const coolingPointsWithConfidence = coolingPoints.map(withWaterConfidence);
  const activePoints = coolingPointsWithConfidence.filter(
    ({ waterConfidence }) => waterConfidence === activeWaterConfidence,
  );
  const candidatePoints = coolingPointsWithConfidence.filter(
    ({ waterConfidence }) => waterConfidence === candidateWaterConfidence,
  );

  const totalHighRiskPeople = sumPopulation(highRiskCells);
  const uncoveredCells = findUncoveredCells(highRiskCells, activePoints, walkingRadiusInMetres);
  const picks = pickPlacesGreedily(candidatePoints, uncoveredCells, walkingRadiusInMetres, plannedPlaceCount);

  const peopleCoveredBefore = totalHighRiskPeople - sumPopulation(uncoveredCells);
  const peopleNewlyCoveredByPicks = picks.reduce(
    (totalPeople, { peopleNewlyCovered }) => totalPeople + peopleNewlyCovered,
    0,
  );

  await insertDailyPlan(
    {
      planDate,
      coveragePercentBefore: coveragePercent(peopleCoveredBefore, totalHighRiskPeople),
      coveragePercentAfter: coveragePercent(peopleCoveredBefore + peopleNewlyCoveredByPicks, totalHighRiskPeople),
    },
    picks.map(({ candidateIndex, peopleNewlyCovered }, pickIndex) => ({
      coolingPointId: candidatePoints[candidateIndex]?.id ?? 0,
      rank: pickIndex + 1,
      peopleNewlyCovered: Math.round(peopleNewlyCovered),
    })),
  );

  const storedPlan = await findDailyPlanByDate(planDate);
  if (!storedPlan) throw ApiError.internal(`Plan for ${planDate} was not stored`);
  return storedPlan;
};

const toPlanResponse = async ({ planDate, coveragePercentBefore, coveragePercentAfter, picks }: StoredPlan) => {
  const coolingPoints = await findCoolingPointsByIds(picks.map(({ coolingPointId }) => coolingPointId));
  const coolingPointsById = new Map(coolingPoints.map((coolingPoint) => [coolingPoint.id, coolingPoint]));
  return {
    date: planDate,
    coveragePercentBefore,
    coveragePercentAfter,
    picks: picks.map(({ coolingPointId, rank, peopleNewlyCovered }) => {
      const coolingPoint = coolingPointsById.get(coolingPointId);
      if (!coolingPoint) throw ApiError.internal(`Cooling point ${coolingPointId} is missing`);
      return { ...withWaterConfidence(coolingPoint), rank, peopleNewlyCovered };
    }),
  };
};

export const getPlan = async (requestedDate?: string) => {
  const planDate = resolveWeatherDate(requestedDate);
  const storedPlan = (await findDailyPlanByDate(planDate)) ?? (await buildAndStorePlan(planDate));
  return toPlanResponse(storedPlan);
};
