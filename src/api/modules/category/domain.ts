import { z } from "zod";

export const CategoryNameSchema = z.string().trim().min(1).max(100);


export const CategoryDescriptionSchema = z.string().trim().min(1).max(2000);
