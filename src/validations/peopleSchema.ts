import { z } from "zod";
import { PEOPLE_JOB_TITLES } from "@/types/people";
// UI requirements, pending BE validation/normalization and Job Title IDs.
const fields = {
  name: z.string().trim().min(1, "Nama wajib diisi."),
  nip: z.string(), // Preserve NIP as entered until BE normalization is specified.
  position: z.string(),
  jobTitle: z.enum(PEOPLE_JOB_TITLES, { error: "Pilih Job Title." }),
  outletId: z.string().regex(/^[1-9]\d*$/, "Pilih Outlet aktif dari master."),
  status: z.enum(["active", "inactive"]),
};
export const createManualPeopleSchema = z.object(fields);
export const updatePeopleSchema = z.object(fields);
export type PeopleFormValues = z.infer<typeof createManualPeopleSchema>;
