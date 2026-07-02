import { createAuditLog, findAuditLogsByClient } from "../repositories/audit.repository.js";
import { getClientOrThrow } from "./client.service.js";

export const logEvent = async (params: {
  clientId: string | null;
  userId: string;
  action: string;
  details: Record<string, any>;
}) => {
  if (params.clientId) {
    await getClientOrThrow(params.clientId);
  }
  return createAuditLog({
    clientId: params.clientId,
    userId: params.userId,
    action: params.action,
    details: JSON.stringify(params.details),
  });
};

export const getAuditLogs = async (clientId: string) => {
  await getClientOrThrow(clientId);
  return findAuditLogsByClient(clientId);
};
