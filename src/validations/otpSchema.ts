import { z } from "zod";

export const otpSchema = z.object({
  otp: z
    .string()
    .min(6, "Kode OTP harus 6 digit")
    .max(6, "Kode OTP harus 6 digit")
    .regex(/^\d+$/, "OTP hanya boleh angka"),
});

export type OtpFormData = z.infer<typeof otpSchema>;