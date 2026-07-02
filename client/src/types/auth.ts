export type Role = "VIEWER" | "SCORER" | "ADMIN";

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface AuthResponse {
  user: PublicUser;
  token: string;
}
