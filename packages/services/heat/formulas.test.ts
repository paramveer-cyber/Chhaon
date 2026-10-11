import assert from "node:assert/strict";
import { test } from "node:test";
import { buildHeatCells, heatLevelForScore, heatScoreFor, weatherIndexFor } from "./formulas";

const comparisonTolerance = 1e-9;

const expectCloseTo = (actualValue: number, expectedValue: number) =>
  assert.ok(
    Math.abs(actualValue - expectedValue) < comparisonTolerance,
    `expected ${expectedValue}, got ${actualValue}`,
  );

const sampleGridCell = { id: 1, centreLatitude: 28.6, centreLongitude: 77.2, baselineHeat: 0.5 };

test("weather index is 0 at 30 degrees", () => expectCloseTo(weatherIndexFor(30), 0));

test("weather index is 1 at 48 degrees", () => expectCloseTo(weatherIndexFor(48), 1));

test("weather index is 0.5 at 39 degrees", () => expectCloseTo(weatherIndexFor(39), 0.5));

test("weather index stays at 0 below 30 degrees", () => expectCloseTo(weatherIndexFor(25), 0));

test("weather index stays at 1 above 48 degrees", () => expectCloseTo(weatherIndexFor(55), 1));

test("heat score is 50 for baseline 0.5 and weather 0.5", () => expectCloseTo(heatScoreFor(0.5, 0.5), 50));

test("heat score is 100 for baseline 1 and weather 1", () => expectCloseTo(heatScoreFor(1, 1), 100));

test("heat score is 40 for baseline 0 and weather 1", () => expectCloseTo(heatScoreFor(0, 1), 40));

test("level cut-offs are 70 and 40", () => {
  assert.equal(heatLevelForScore(70), "high");
  assert.equal(heatLevelForScore(69.9), "medium");
  assert.equal(heatLevelForScore(40), "medium");
  assert.equal(heatLevelForScore(39.9), "low");
});

test("a hot day gives a higher score than a cool day for the same cell", () => {
  const [hotDayCell] = buildHeatCells([sampleGridCell], weatherIndexFor(46));
  const [coolDayCell] = buildHeatCells([sampleGridCell], weatherIndexFor(32));
  assert.ok((hotDayCell?.heatScore ?? 0) > (coolDayCell?.heatScore ?? 0));
});
