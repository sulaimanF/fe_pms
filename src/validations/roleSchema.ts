import { z } from "zod";
export const roleSchema = z.object({
  code: z.string().trim().min(1, "Kode role wajib diisi.").max(50),
  name: z.string().trim().min(1, "Nama role wajib diisi.").max(100),
  description: z.string(),
  permission_ids: z.array(z.number().int().positive()),
});
export type RoleFormValues = z.infer<typeof roleSchema>;
