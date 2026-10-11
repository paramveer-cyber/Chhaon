import { z } from "zod";

export const zodUndefinedModel = z.undefined().describe("undefined");

export const zodApiResponse = <DataModel extends z.ZodType>(dataModel: DataModel) =>
  z.object({
    success: z.literal(true),
    message: z.string(),
    data: dataModel,
  });

export const latitudeModel = z.number().min(-90).max(90).describe("latitude in degrees");
export const longitudeModel = z.number().min(-180).max(180).describe("longitude in degrees");

export const locationInputModel = z.object({
  latitude: z.coerce.number().pipe(latitudeModel),
  longitude: z.coerce.number().pipe(longitudeModel),
});

export const optionalDateModel = z.iso
  .date()
  .optional()
  .describe("date as YYYY-MM-DD, default is today");

export { z };
