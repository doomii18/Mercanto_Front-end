import { z } from "zod";

export const MunicipalityNodeSchema = z.object({
  id: z.uuid(),
  name: z.string(),
});

export const DepartmentNodeSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  municipalities: z.array(MunicipalityNodeSchema),
});

export const CountryNodeSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  iso_code: z.string(),
  departments: z.array(DepartmentNodeSchema),
});
