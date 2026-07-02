import { Router } from "express";
import { z } from "zod";
import { validateBody } from "../middleware/validate.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  addClient,
  editClient,
  getClientOrThrow,
  getClients,
  removeClient,
} from "../services/client.service.js";
import { logEvent } from "../services/audit.service.js";

export const clientRouter = Router();

const clientStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);

const createClientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  status: clientStatusSchema.optional(),
  contactEmail: z.union([z.string().email("Enter a valid email"), z.literal("")]).optional(),
  accountManager: z.string().optional(),
  onboardedAt: z.union([z.string().min(1), z.literal("")]).optional(),
});

const updateClientSchema = createClientSchema.partial();

clientRouter.use(requireAuth);

clientRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const clients = await getClients(search);
    res.json({ clients });
  }),
);

clientRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const client = await getClientOrThrow(req.params.id);
    res.json({ client });
  }),
);

clientRouter.post(
  "/",
  requireRole("SCORER", "ADMIN"),
  validateBody(createClientSchema),
  asyncHandler(async (req, res) => {
    const client = await addClient(req.body);
    await logEvent({
      clientId: client.id,
      userId: req.user!.id,
      action: "CLIENT_CREATE",
      details: { name: client.name, status: client.status },
    });
    res.status(201).json({ client });
  }),
);

clientRouter.patch(
  "/:id",
  requireRole("SCORER", "ADMIN"),
  validateBody(updateClientSchema),
  asyncHandler(async (req, res) => {
    const client = await editClient(req.params.id, req.body);
    await logEvent({
      clientId: client.id,
      userId: req.user!.id,
      action: "CLIENT_UPDATE",
      details: req.body,
    });
    res.json({ client });
  }),
);

clientRouter.delete(
  "/:id",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    await logEvent({
      clientId: req.params.id,
      userId: req.user!.id,
      action: "CLIENT_DELETE",
      details: { id: req.params.id },
    });
    await removeClient(req.params.id);
    res.status(204).send();
  }),
);
