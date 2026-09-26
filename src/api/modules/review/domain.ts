import { z } from 'zod';

export const ReviewRatingSchema = z.number().int().min(1).max(5);
export const ReviewCommentSchema = z.string();
