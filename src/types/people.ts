// FE planning models only. These are NOT a verified backend wire contract.
export const PEOPLE_JOB_TITLES = ["Customer Service", "Teller", "Loan Service", "Satpam"] as const;
export type PeopleJobTitle = (typeof PEOPLE_JOB_TITLES)[number];
export type PeopleSource = "AD" | "Manual";
export interface PeopleViewModel {
  id: string;
  name: string;
  nip: string | null;
  position: string | null;
  jobTitle: PeopleJobTitle;
  outletId: number;
  outletName: string;
  outletCode: string;
  regionId: number | null;
  regionName: string | null;
  source: PeopleSource;
  active: boolean;
}
export interface PeopleFilters {
  search: string;
  jobTitle: string;
  regionId: string;
  outletId: string;
  source: string;
  status: string;
}
export interface PeopleInquiryResult {
  nip: string;
  name: string;
  position: string | null;
  placement: string;
  outletCode: string;
  duplicate: boolean;
  matchedOutlet: { id: number; name: string; active: boolean } | null;
}
export type PeopleInquiryState =
  | { status: "idle" | "unavailable"; nip: string }
  | { status: "searching"; nip: string; requestId: number }
  | { status: "found" | "duplicate" | "mapping-failed" | "outlet-inactive"; nip: string; result: PeopleInquiryResult }
  | { status: "not-found" | "failed"; nip: string };
