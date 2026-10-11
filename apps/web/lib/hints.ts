export const hintText = {
  placesToOpen: "The plan picks up to 10 places. Each pick reaches the most high-risk people that no earlier pick reaches.",
  coveredNow: "Share of high-risk people who live within a 10-minute walk (800 m) of a cooling point today.",
  coveredAfter: "The same share after the officer opens the 10 picked places.",
  heatMap:
    "Each cell is 250 m wide. The colour shows surface heat from satellites plus the weather of the day. It is not air temperature.",
  yourHeat: "We find the 250 m cell that holds your location. Then we read its heat level.",
  nearestPlaces: "We pick the 3 closest places. Then we ask Amazon Location for a walking route to each place.",
  yourPlace: "Use your phone location, or tap the map. We use the point only to find places near you.",
} as const;
