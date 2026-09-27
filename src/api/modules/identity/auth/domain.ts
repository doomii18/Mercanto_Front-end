import { z } from "zod";

// Email | email format and length
export const EmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "El correo electrónico es requerido")
  .max(255, "El correo electrónico no debe exceder 255 caracteres")
  .regex(
    /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/,
    "Formato de correo electrónico inválido"
  );

// Password | basic password length
export const PasswordSchema = z
  .string()
  .trim()
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .max(128, "La contraseña no debe exceder 128 caracteres");

// SecurePassword | password with complexity checks
export const SecurePasswordSchema = PasswordSchema.refine(
  (pwd) => /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /\d/.test(pwd),
  "La contraseña debe contener al menos una letra mayúscula, una minúscula y un número"
);

// AccountRole | system permission role
export const AccountRoleSchema = z.enum(["auditor", "member", "admin"]);
