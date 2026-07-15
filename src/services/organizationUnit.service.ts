import axios from "@/lib/axios";

export const getOrganizationUnits = async () => {
  const { data } = await axios.get("/organization-units");

  return data;
};