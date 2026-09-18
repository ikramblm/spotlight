import type { Request, Response } from "express";
import { AppError } from "../../lib/AppError";
import * as equipmentService from "./service";
import type {
  ArchiveEquipmentInput,
  AssignEquipmentInput,
  CreateEquipmentInput,
  ListEquipmentQuery,
  UpdateEquipmentInput,
} from "./schema";

function requireActor(req: Request): string {
  if (!req.user) throw AppError.unauthorized();
  return req.user.id;
}

export async function createEquipment(req: Request, res: Response) {
  const equipment = await equipmentService.createEquipment(req.body as CreateEquipmentInput, requireActor(req));
  res.status(201).json({ data: equipment });
}

export async function listEquipment(req: Request, res: Response) {
  const filters = req.query as unknown as ListEquipmentQuery;
  const { rows, total } = await equipmentService.listEquipment(filters);
  res.status(200).json({ data: rows, meta: { page: filters.page, pageSize: filters.pageSize, total } });
}

export async function getEquipment(req: Request, res: Response) {
  const { equipment, assignments } = await equipmentService.getEquipmentDetail(req.params.id as string);
  res.status(200).json({ data: { ...equipment, assignments } });
}

export async function updateEquipment(req: Request, res: Response) {
  const equipment = await equipmentService.updateEquipment(
    req.params.id as string,
    req.body as UpdateEquipmentInput,
    requireActor(req)
  );
  res.status(200).json({ data: equipment });
}

export async function archiveEquipment(req: Request, res: Response) {
  const { reason } = req.body as ArchiveEquipmentInput;
  const equipment = await equipmentService.archiveEquipment(req.params.id as string, requireActor(req), reason);
  res.status(200).json({ data: equipment });
}

export async function assignEquipment(req: Request, res: Response) {
  const input = req.body as AssignEquipmentInput;
  const assignment = await equipmentService.assignEquipment(req.params.id as string, input, requireActor(req));
  res.status(201).json({ data: assignment });
}

export async function returnAssignment(req: Request, res: Response) {
  const assignment = await equipmentService.returnAssignment(req.params.assignmentId as string, requireActor(req));
  res.status(200).json({ data: assignment });
}
