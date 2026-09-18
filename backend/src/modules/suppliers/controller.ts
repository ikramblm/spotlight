import type { Request, Response } from "express";
import { AppError } from "../../lib/AppError";
import * as suppliersService from "./service";
import type { ArchiveSupplierInput, CreateSupplierInput, ListSuppliersQuery, UpdateSupplierInput } from "./schema";

function requireActor(req: Request): string {
  if (!req.user) throw AppError.unauthorized();
  return req.user.id;
}

export async function createSupplier(req: Request, res: Response) {
  const supplier = await suppliersService.createSupplier(req.body as CreateSupplierInput, requireActor(req));
  res.status(201).json({ data: supplier });
}

export async function listSuppliers(req: Request, res: Response) {
  const filters = req.query as unknown as ListSuppliersQuery;
  const { rows, total } = await suppliersService.listSuppliers(filters);
  res.status(200).json({ data: rows, meta: { page: filters.page, pageSize: filters.pageSize, total } });
}

export async function getSupplier(req: Request, res: Response) {
  const { supplier, purchaseHistory, equipment } = await suppliersService.getSupplierDetail(
    req.params.id as string
  );
  res.status(200).json({ data: { ...supplier, purchaseHistory, equipment } });
}

export async function updateSupplier(req: Request, res: Response) {
  const supplier = await suppliersService.updateSupplier(
    req.params.id as string,
    req.body as UpdateSupplierInput,
    requireActor(req)
  );
  res.status(200).json({ data: supplier });
}

export async function archiveSupplier(req: Request, res: Response) {
  const { reason } = req.body as ArchiveSupplierInput;
  const supplier = await suppliersService.archiveSupplier(req.params.id as string, requireActor(req), reason);
  res.status(200).json({ data: supplier });
}
