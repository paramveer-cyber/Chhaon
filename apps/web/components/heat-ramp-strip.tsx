import { heatGradientCss } from "~/lib/heat-colour";
import { cn } from "~/lib/utils";

type HeatRampStripProps = { className?: string };

export const HeatRampStrip = ({ className }: HeatRampStripProps) => (
  <div aria-hidden className={cn("h-2 rounded-full", className)} style={{ background: heatGradientCss }} />
);
