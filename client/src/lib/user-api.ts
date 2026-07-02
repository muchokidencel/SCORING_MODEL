import { apiRequest } from "@/lib/api";

export interface UserDetail {
  id: string;
  email: string;
  name: string;
  role: "VIEWER" | "SCORER" | "ADMIN";
  createdAt: string;
  updatedAt: string;
}

export const listUsers = () =>
  apiRequest<{ users: UserDetail[] }>("/users");

export const updateUserRole = (id: string, role: "VIEWER" | "SCORER" | "ADMIN") =>
  apiRequest<{ user: UserDetail }>(`/users/${id}/role`, {
    method: "PATCH",
    body: { role },
  });
