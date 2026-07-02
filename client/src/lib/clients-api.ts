import { apiRequest } from "@/lib/api";
import type { Client, ClientInput, EvaluationCategory } from "@/types/client";

export const listClients = (search?: string) =>
  apiRequest<{ clients: Client[] }>(`/clients${search ? `?search=${encodeURIComponent(search)}` : ""}`);

export const getClient = (id: string) => apiRequest<{ client: Client }>(`/clients/${id}`);

export const createClient = (input: ClientInput) =>
  apiRequest<{ client: Client }>("/clients", { method: "POST", body: input });

export const updateClient = (id: string, input: Partial<ClientInput>) =>
  apiRequest<{ client: Client }>(`/clients/${id}`, { method: "PATCH", body: input });

export const deleteClient = (id: string) => apiRequest<void>(`/clients/${id}`, { method: "DELETE" });

export const listEvaluationCategories = () =>
  apiRequest<{ categories: EvaluationCategory[] }>("/evaluation-categories");
