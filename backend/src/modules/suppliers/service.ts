import { AppError } from "../../lib/AppError";
import { recordArchive } from "../../lib/archive";
import { recordAudit } from "../../lib/audit";
import * as suppliersRepo from "./repository";
import type { CreateSupplierInput, ListSuppliersQuery, UpdateSupplierInput } from "./schema";

export async function createSupplier(input: CreateSupplierInput, actorId: string) {
  const supplier = await suppliersRepo.insertSupplier(input);
  await recordAudit({ userId: actorId, action: "supplier.create", entityType: "supplier", entityId: supplier.id });
  return supplier;
}

export async function listSuppliers(filters: ListSuppliersQuery) {
  return suppliersRepo.listSuppliers(filters);
}

export async function getSupplier(id: string) {
  const supplier = await suppliersRepo.getSupplierById(id);
  if (!supplier) {
    throw AppError.notFound("Supplier not found");
  }
  return supplier;
}

export async function getSupplierDetail(id: string) {
  const supplier = await getSupplier(id);
  const [purchaseHistory, equipment] = await Promise.all([
    suppliersRepo.getPurchaseHistory(id),
    suppliersRepo.getSuppliedEquipment(id),
  ]);
  return { supplier, purchaseHistory, equipment };
}

export async function updateSupplier(id: string, input: UpdateSupplierInput, actorId: string) {
  await getSupplier(id);
  const updated = await suppliersRepo.updateSupplier(id, input);
  await recordAudit({ userId: actorId, action: "supplier.update", entityType: "supplier", entityId: id });
  return updated;
}

export async function archiveSupplier(id: string, actorId: string, reason?: string) {
  await getSupplier(id);
  const archived = await suppliersRepo.archiveSupplier(id);
  await recordAudit({ userId: actorId, action: "supplier.archive", entityType: "supplier", entityId: id });
  await recordArchive({ entityType: "supplier", entityId: id, reason, archivedBy: actorId });
  return archived;
}
