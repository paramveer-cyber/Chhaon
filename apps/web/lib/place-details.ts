import {
  Building2,
  Droplets,
  GraduationCap,
  Hospital,
  Snowflake,
  TrainFront,
  Trees,
  type LucideIcon,
} from "lucide-react";
import type { PlanPick } from "~/hooks/plan";

type PlaceType = PlanPick["type"];
type WaterConfidence = PlanPick["waterConfidence"];
type HoursStatus = PlanPick["hoursStatus"];

export const placeTypeDetails: Record<PlaceType, { label: string; Icon: LucideIcon }> = {
  drinking_water: { label: "Drinking water point", Icon: Droplets },
  park: { label: "Park", Icon: Trees },
  metro_station: { label: "Metro station", Icon: TrainFront },
  hospital: { label: "Hospital", Icon: Hospital },
  school: { label: "School", Icon: GraduationCap },
  place_of_worship: { label: "Place of worship", Icon: Building2 },
  cooling_zone: { label: "Official cooling zone", Icon: Snowflake },
};

export const waterConfidenceLabels: Record<WaterConfidence, string> = {
  listed: "Water listed",
  likely: "Water likely",
  unlikely: "Water not likely",
};

export const waterConfidenceHints: Record<WaterConfidence, string> = {
  listed: "Map data lists this place as a drinking water point.",
  likely: "This type of place often has drinking water. We cannot confirm it.",
  unlikely: "This type of place seldom has drinking water. Carry your own.",
};

export const hoursStatusHints: Record<HoursStatus, string> = {
  unconfirmed: "No source confirms the opening hours. Call or check before you walk far.",
  confirmed: "A trusted source confirms the opening hours.",
};

export const hoursStatusLabels: Record<HoursStatus, string> = {
  unconfirmed: "Hours not confirmed",
  confirmed: "Hours confirmed",
};
