import assert from "node:assert/strict";
import { test } from "node:test";
import { coveragePercent, findUncoveredCells, pickPlacesGreedily, sumPopulation } from "./coverage";

const walkingRadiusInMetres = 800;
const longitude = 77.2;

const firstCell = { latitude: 28.6, longitude, population: 100 };
const secondCell = { latitude: 28.605, longitude, population: 50 };
const thirdCell = { latitude: 28.61, longitude, population: 30 };
const cells = [firstCell, secondCell, thirdCell];

const candidateCoveringFirstTwoCells = { latitude: 28.6015, longitude };
const candidateCoveringLastTwoCells = { latitude: 28.6075, longitude };
const candidateFarAway = { latitude: 28.9, longitude };

test("first pick is the candidate that covers the most people", () => {
  const [firstPick] = pickPlacesGreedily(
    [candidateCoveringLastTwoCells, candidateCoveringFirstTwoCells],
    cells,
    walkingRadiusInMetres,
    10,
  );
  assert.deepEqual(firstPick, { candidateIndex: 1, peopleNewlyCovered: 150 });
});

test("people already covered are removed before the next pick", () => {
  const picks = pickPlacesGreedily(
    [candidateCoveringFirstTwoCells, candidateCoveringLastTwoCells],
    cells,
    walkingRadiusInMetres,
    10,
  );
  assert.deepEqual(picks, [
    { candidateIndex: 0, peopleNewlyCovered: 150 },
    { candidateIndex: 1, peopleNewlyCovered: 30 },
  ]);
});

test("a candidate that covers nobody is never picked", () => {
  const picks = pickPlacesGreedily([candidateFarAway], cells, walkingRadiusInMetres, 10);
  assert.deepEqual(picks, []);
});

test("pick count limits the number of picks", () => {
  const picks = pickPlacesGreedily(
    [candidateCoveringFirstTwoCells, candidateCoveringLastTwoCells],
    cells,
    walkingRadiusInMetres,
    1,
  );
  assert.equal(picks.length, 1);
});

test("cells near an active point are not uncovered", () => {
  const uncoveredCells = findUncoveredCells(cells, [candidateCoveringFirstTwoCells], walkingRadiusInMetres);
  assert.deepEqual(uncoveredCells, [thirdCell]);
});

test("coverage percent is the covered share of all people", () => {
  assert.equal(coveragePercent(sumPopulation([firstCell, secondCell]), sumPopulation(cells)), 83.3);
  assert.equal(coveragePercent(0, 0), 0);
});
