// Intentionally no HTTP requests: no People/Job Title/AD routes exist in the inspected BE.
// Replace only after verifying the actual backend contract; never fall back to /users.
export const PEOPLE_API_AVAILABLE = false;
export const PEOPLE_UNAVAILABLE = "API People, master Job Title, dan inquiry AD belum tersedia. Data belum dapat dimuat atau disimpan. Form ini hanya menyiapkan draft lokal selama halaman terbuka.";
export class PeopleApiUnavailableError extends Error {
  constructor() { super(PEOPLE_UNAVAILABLE); this.name = "PeopleApiUnavailableError"; }
}
export async function getPeople(): Promise<never> { throw new PeopleApiUnavailableError(); }
export async function getPeopleById(_id: string): Promise<never> {
  void _id;
  throw new PeopleApiUnavailableError();
}
