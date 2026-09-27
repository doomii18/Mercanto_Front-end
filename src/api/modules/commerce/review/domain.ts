import { z } from "zod";

// ReviewRating | rating score between 1 and 5
export const ReviewRatingSchema = z
  .number()
  .int("La calificación debe ser un número entero")
  .min(1, "La calificación mínima es 1")
  .max(5, "La calificación máxima es 5");

// ReviewComment | optional text review comment
export const ReviewCommentSchema = z
  .string()
  .trim()
  .max(2000, "El comentario no debe exceder los 2000 caracteres");
