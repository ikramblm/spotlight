import type { Request, Response } from "express";
import { AppError } from "../../lib/AppError";
import * as servicesService from "./service";
import type { ArchiveServiceInput, CreateServiceInput, ListServicesQuery, UpdateServiceInput } from "./schema";

function requireActor(req: Request): string {
  if (!req.user) throw AppError.unauthorized();
  return req.user.id;
}

export async function createService(req: Request, res: Response) {
  const service = await servicesService.createService(req.body as CreateServiceInput, requireActor(req));
  res.status(201).json({ data: service });
}

export async function listServices(req: Request, res: Response) {
  const filters = req.query as unknown as ListServicesQuery;
  const { rows, total } = await servicesService.listServices(filters);
  res.status(200).json({ data: rows, meta: { page: filters.page, pageSize: filters.pageSize, total } });
}

export async function getService(req: Request, res: Response) {
  const service = await servicesService.getService(req.params.id as string);
  res.status(200).json({ data: service });
}

export async function updateService(req: Request, res: Response) {
  const service = await servicesService.updateService(
    req.params.id as string,
    req.body as UpdateServiceInput,
    requireActor(req)
  );
  res.status(200).json({ data: service });
}

export async function archiveService(req: Request, res: Response) {
  const { reason } = req.body as ArchiveServiceInput;
  const service = await servicesService.archiveService(req.params.id as string, requireActor(req), reason);
  res.status(200).json({ data: service });
}
