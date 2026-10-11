import { Coordinates, isWithinRadius } from "../geo";

export type PopulatedCell = Coordinates & { population: number };

export type GreedyPick = {
  candidateIndex: number;
  peopleNewlyCovered: number;
};

const percentDecimalPlaces = 1;

export const sumPopulation = (cells: PopulatedCell[]) =>
  cells.reduce((totalPopulation, { population }) => totalPopulation + population, 0);

export const coveragePercent = (coveredPeople: number, totalPeople: number) =>
  totalPeople === 0 ? 0 : Number(((100 * coveredPeople) / totalPeople).toFixed(percentDecimalPlaces));

export const findUncoveredCells = (
  cells: PopulatedCell[],
  coveringPoints: Coordinates[],
  radiusInMetres: number,
) =>
  cells.filter((cell) => !coveringPoints.some((coveringPoint) => isWithinRadius(cell, coveringPoint, radiusInMetres)));

export const pickPlacesGreedily = (
  candidatePoints: Coordinates[],
  uncoveredCells: PopulatedCell[],
  radiusInMetres: number,
  pickCount: number,
) => {
  const cellIndexesPerCandidate = candidatePoints.map((candidatePoint) =>
    uncoveredCells.flatMap((cell, cellIndex) =>
      isWithinRadius(cell, candidatePoint, radiusInMetres) ? [cellIndex] : [],
    ),
  );
  const stillUncoveredCellIndexes = new Set(uncoveredCells.keys());
  const picks: GreedyPick[] = [];

  while (picks.length < pickCount) {
    let bestCandidateIndex = -1;
    let bestPeopleNewlyCovered = 0;
    cellIndexesPerCandidate.forEach((cellIndexes, candidateIndex) => {
      const peopleNewlyCovered = cellIndexes.reduce(
        (totalPeople, cellIndex) =>
          stillUncoveredCellIndexes.has(cellIndex)
            ? totalPeople + (uncoveredCells[cellIndex]?.population ?? 0)
            : totalPeople,
        0,
      );
      if (peopleNewlyCovered > bestPeopleNewlyCovered) {
        bestCandidateIndex = candidateIndex;
        bestPeopleNewlyCovered = peopleNewlyCovered;
      }
    });
    if (bestCandidateIndex === -1) break;

    picks.push({ candidateIndex: bestCandidateIndex, peopleNewlyCovered: bestPeopleNewlyCovered });
    cellIndexesPerCandidate[bestCandidateIndex]?.forEach((cellIndex) => stillUncoveredCellIndexes.delete(cellIndex));
  }
  return picks;
};
