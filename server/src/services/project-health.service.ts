import { getClientOrThrow } from "./client.service.js";
import { cpi, progressScorecard, spi } from "./health.service.js";
import { logEvent } from "./audit.service.js";
import {
  createProjectMetricSnapshot,
  findSnapshotsForClient,
} from "../repositories/project-metric-snapshot.repository.js";

export const submitHealthSnapshot = async (params: {
  clientId: string;
  pv: number;
  ac: number;
  ev: number;
  clientSignoff: boolean;
  resourceUtilization: number;
  enteredById: string;
}) => {
  await getClientOrThrow(params.clientId);

  const spiValue = spi(params.ev, params.pv);
  const cpiValue = cpi(params.ev, params.ac);
  const scorecardPoints = progressScorecard({
    spiValue,
    cpiValue,
    signoff: params.clientSignoff,
    resourceUtilization: params.resourceUtilization,
  });

  const snapshot = await createProjectMetricSnapshot({
    clientId: params.clientId,
    pv: params.pv,
    ac: params.ac,
    ev: params.ev,
    clientSignoff: params.clientSignoff,
    resourceUtilization: params.resourceUtilization,
    spi: spiValue,
    cpi: cpiValue,
    scorecardPoints,
    enteredById: params.enteredById,
  });

  await logEvent({
    clientId: params.clientId,
    userId: params.enteredById,
    action: "HEALTH_SNAPSHOT_SUBMIT",
    details: {
      pv: params.pv,
      ac: params.ac,
      ev: params.ev,
      clientSignoff: params.clientSignoff,
      resourceUtilization: params.resourceUtilization,
      spi: spiValue,
      cpi: cpiValue,
      scorecardPoints,
    },
  });

  return snapshot;
};

export const getHealthHistory = async (clientId: string) => {
  await getClientOrThrow(clientId);
  return findSnapshotsForClient(clientId);
};
