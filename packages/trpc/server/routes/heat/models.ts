import {
  z,
  zodApiResponse,
  latitudeModel,
  locationInputModel,
  longitudeModel,
  optionalDateModel,
} from "../../schema";

export const getHeatGridInputModel = z.object({ date: optionalDateModel });

export const getHeatAtLocationInputModel = locationInputModel.extend({ date: optionalDateModel });

const heatRatingModel = z.object({
  heatScore: z.number().min(0).max(100),
  heatLevel: z.enum(["high", "medium", "low"]),
});

export const heatCellModel = heatRatingModel.extend({
  cellId: z.number().int(),
  centreLatitude: latitudeModel,
  centreLongitude: longitudeModel,
});

export type HeatCell = z.infer<typeof heatCellModel>;

const dailyWeatherModel = z.object({
  date: z.iso.date(),
  apparentTemperatureMaxCelsius: z.number(),
  weatherIndex: z.number().min(0).max(1),
});

export const getHeatGridOutputModel = zodApiResponse(
  dailyWeatherModel.extend({
    surfaceHeatDataRange: z.object({ startDate: z.iso.date(), endDate: z.iso.date() }),
    cellSizeInDegrees: z.object({ latitude: z.number(), longitude: z.number() }),
    cells: z.array(heatCellModel),
  }),
);

export const getHeatAtLocationOutputModel = zodApiResponse(dailyWeatherModel.extend(heatRatingModel.shape));
