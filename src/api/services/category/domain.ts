
import { z } from "zod";

export const CategoryNameSchema = z.string().min(1).max(100);
export const CategoryDescriptionSchema = z.string().min(1).max(2000);
