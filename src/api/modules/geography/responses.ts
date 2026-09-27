import { z } from "zod";

// MunicipalityNode | municipality leaf node in geography tree
export const MunicipalityNodeSchema = z.object({
  id: z.uuid(),
  name: z.string(),
});

// DepartmentNode | department node with child municipalities
export const DepartmentNodeSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  municipalities: z.array(MunicipalityNodeSchema),
});

// CountryNode | full hierarchical geography tree for country
export const CountryNodeSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  iso_code: z.string(),
  departments: z.array(DepartmentNodeSchema),
});

// MunicipalityResponseDto | resolved municipality from coordinates
export const MunicipalityResponseSchema = z.object({
  id: z.uuid(),
  municipality: z.string(),
  department_id: z.uuid(),
});
