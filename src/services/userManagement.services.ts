import axios from "@/lib/axios";
import {
  UserResponse,
  UserDetailResponse,
} from "@/types/userManagement";

export const getUsers = async () => {
  const response = await axios.get<UserResponse>("/users");
  return response.data;
};

export const getUserById = async (id: number) => {
  const response = await axios.get<UserDetailResponse>(`/users/${id}`);
  return response.data;
};

export const updateUser = async (
  id: number,
  payload: any
) => {
  const response = await axios.put<UserDetailResponse>(
    `/users/${id}`,
    payload
  );

  return response.data;
};