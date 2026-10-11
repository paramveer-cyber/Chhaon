type RgbColour = [number, number, number];

const heatColourStops: { position: number; colour: RgbColour }[] = [
  { position: 0, colour: [46, 158, 91] },
  { position: 0.25, colour: [167, 201, 74] },
  { position: 0.5, colour: [242, 212, 61] },
  { position: 0.75, colour: [240, 138, 60] },
  { position: 1, colour: [195, 38, 46] },
];

export const heatScoreScaleMaximum = 100;

export const heatGradientCss = `linear-gradient(to right, ${heatColourStops
  .map(({ position, colour }) => `rgb(${colour.join(",")}) ${position * 100}%`)
  .join(", ")})`;

export const heatColourFor = (heatFraction: number): RgbColour => {
  const clampedFraction = Math.min(1, Math.max(0, heatFraction));
  const upperIndex = Math.max(
    1,
    heatColourStops.findIndex(({ position }) => position >= clampedFraction),
  );
  const lowerStop = heatColourStops[upperIndex - 1];
  const upperStop = heatColourStops[upperIndex];
  if (!lowerStop || !upperStop) return heatColourStops[0]!.colour;
  const blend = (clampedFraction - lowerStop.position) / (upperStop.position - lowerStop.position);
  return lowerStop.colour.map((channel, channelIndex) =>
    Math.round(channel + blend * ((upperStop.colour[channelIndex] ?? channel) - channel)),
  ) as RgbColour;
};
