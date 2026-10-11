export const rangeOf = (values: number[]) =>
  values.reduce(
    (range, value) => ({ lowest: Math.min(range.lowest, value), highest: Math.max(range.highest, value) }),
    { lowest: Infinity, highest: -Infinity },
  );
