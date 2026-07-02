import { notFound } from "../types/http-error.js";
import {
  createClient,
  deleteClient,
  findClientById,
  listClients,
  updateClient,
} from "../repositories/client.repository.js";

export interface ClientInput {
  name: string;
  status?: "ACTIVE" | "INACTIVE";
  contactEmail?: string | null;
  accountManager?: string | null;
  onboardedAt?: string | null;
}

export const getClients = (search?: string) => listClients(search);

export const getClientOrThrow = async (id: string) => {
  const client = await findClientById(id);
  if (!client) {
    throw notFound("Client not found");
  }
  return client;
};

export const addClient = (input: ClientInput) =>
  createClient({
    name: input.name,
    status: input.status,
    contactEmail: input.contactEmail,
    accountManager: input.accountManager,
    onboardedAt: input.onboardedAt ? new Date(input.onboardedAt) : null,
  });

export const editClient = async (id: string, input: Partial<ClientInput>) => {
  await getClientOrThrow(id);
  return updateClient(id, {
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.contactEmail !== undefined ? { contactEmail: input.contactEmail } : {}),
    ...(input.accountManager !== undefined ? { accountManager: input.accountManager } : {}),
    ...(input.onboardedAt !== undefined
      ? { onboardedAt: input.onboardedAt ? new Date(input.onboardedAt) : null }
      : {}),
  });
};

export const removeClient = async (id: string) => {
  await getClientOrThrow(id);
  await deleteClient(id);
};
