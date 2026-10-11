import type { HeatLevel } from "~/hooks/heat";

export const heatLevelOrder: HeatLevel[] = ["high", "medium", "low"];

export const heatLevelDetails: Record<
  HeatLevel,
  { label: string; swatchClass: string; cardClass: string; advice: string }
> = {
  high: {
    label: "High heat",
    swatchClass: "bg-heat-high",
    cardClass: "bg-heat-high-soft text-heat-high-deep",
    advice: "Stay out of the sun from 12:00 to 16:00. Drink water every 20 minutes.",
  },
  medium: {
    label: "Medium heat",
    swatchClass: "bg-heat-medium",
    cardClass: "bg-heat-medium-soft text-heat-medium-deep",
    advice: "Do not do hard work outside after noon. Carry water.",
  },
  low: {
    label: "Low heat",
    swatchClass: "bg-heat-low",
    cardClass: "bg-heat-low-soft text-heat-low-deep",
    advice: "Wear light clothes and a cap. Rest in the shade.",
  },
};
