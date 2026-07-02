import { z } from "zod";

export const loginSchema = z.object({
  login: z
    .string()
    .min(1, "Username wajib diisi"),

  password: z
    .string()
    .min(1, "Password wajib diisi"),
});

export type LoginFormData = z.infer<typeof loginSchema>;