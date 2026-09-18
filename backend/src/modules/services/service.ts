import { AppError } from "../../lib/AppError";
import { recordArchive } from "../../lib/archive";
import { recordAudit } from "../../lib/audit";
import * as servicesRepo from "./repository";
import type { CreateServiceInput, ListServicesQuery, UpdateServiceInput } from "./schema";

export async function createService(input: CreateServiceInput, actorId: string) {
  const service = await servicesRepo.insertService(input);
  await recordAudit({ userId: actorId, action: "service.create", entityType: "service", entityId: service.id });
  return service;
}

export async function listServices(filters: ListServicesQuery) {
  return servicesRepo.listServices(filters);
}

export async function getService(id: string) {
  const service = await servicesRepo.getServiceById(id);
  if (!service) {
    throw AppError.notFound("Service not found");
  }
  return service;
}

export async function updateService(id: string, input: UpdateServiceInput, actorId: string) {
  await getService(id);
  const updated = await servicesRepo.updateService(id, input);
  await recordAudit({ userId: actorId, action: "service.update", entityType: "service", entityId: id });
  return updated;
}

export async function archiveService(id: string, actorId: string, reason?: string) {
  await getService(id);
  const archived = await servicesRepo.archiveService(id);
  await recordAudit({ userId: actorId, action: "service.archive", entityType: "service", entityId: id });
  await recordArchive({ entityType: "service", entityId: id, reason, archivedBy: actorId });
  return archived;
}
