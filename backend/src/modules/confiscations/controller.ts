import type { Request, Response } from "express";
import { AppError } from "../../lib/AppError";
import * as confiscationsService from "./service";
import type { CreateConfiscationInput, ListConfiscationsQuery, ReturnConfiscationInput } from "./schema";

function requireActor(req: Request): string {
  if (!req.user) throw AppError.unauthorized();
  return req.user.id;
}

export async function createConfiscation(req: Request, res: Response) {
  const confiscation = await confiscationsService.createConfiscation(
    req.body as CreateConfiscationInput,
    requireActor(req),
    req.file?.buffer
  );
  res.status(201).json({ data: confiscation });
}

export async function listConfiscations(req: Request, res: Response) {
  const filters = req.query as unknown as ListConfiscationsQuery;
  const { rows, total } = await confiscationsService.listConfiscations(filters);
  res.status(200).json({ data: rows, meta: { page: filters.page, pageSize: filters.pageSize, total } });
}

export async function getConfiscation(req: Request, res: Response) {
  const { confiscation, restitution } = await confiscationsService.getConfiscationDetail(req.params.id as string);
  res.status(200).json({ data: { ...confiscation, restitution } });
}

export async function getPhoto(req: Request, res: Response) {
  const photo = await confiscationsService.getPhoto(req.params.id as string);
  res.status(200).set("Content-Type", "image/jpeg").send(photo);
}

export async function returnConfiscation(req: Request, res: Response) {
  const result = await confiscationsService.returnConfiscation(
    req.params.id as string,
    req.body as ReturnConfiscationInput,
    requireActor(req)
  );
  res.status(200).json({ data: { ...result.confiscation, restitution: result.restitution } });
}
