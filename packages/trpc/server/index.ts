import { router } from "./trpc";

import { healthRouter } from "./routes/health/route";
import { heatRouter } from "./routes/heat/route";
import { coolingPointRouter } from "./routes/cooling-point/route";
import { planRouter } from "./routes/plan/route";

export const serverRouter = router({
  health: healthRouter,
  heat: heatRouter,
  coolingPoint: coolingPointRouter,
  plan: planRouter,
});

export { createContext } from "./context";
export type ServerRouter = typeof serverRouter;
