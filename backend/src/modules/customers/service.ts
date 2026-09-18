import { AppError } from "../../lib/AppError";
import { recordArchive } from "../../lib/archive";
import { recordAudit } from "../../lib/audit";
import * as customersRepo from "./repository";
import type { CreateCustomerInput, ListCustomersQuery, UpdateCustomerInput } from "./schema";

export async function createCustomer(input: CreateCustomerInput, actorId: string) {
  if (await customersRepo.phoneExists(input.phone)) {
    throw AppError.badRequest("A customer with this phone number already exists", {
      phone: "already in use",
    });
  }

  const customer = await customersRepo.insertCustomer({ ...input, createdBy: actorId });
  await recordAudit({
    userId: actorId,
    action: "customer.create",
    entityType: "customer",
    entityId: customer.id,
  });
  return customer;
}

export async function listCustomers(filters: ListCustomersQuery) {
  return customersRepo.listCustomers(filters);
}

export async function getCustomer(id: string) {
  const customer = await customersRepo.getCustomerById(id);
  if (!customer) {
    throw AppError.notFound("Customer not found");
  }
  return customer;
}

export async function getCustomerDetail(id: string) {
  const customer = await getCustomer(id);
  const [summary, bookings] = await Promise.all([
    customersRepo.getFinancialSummary(id),
    customersRepo.getCustomerBookings(id),
  ]);
  return { customer, summary, bookings };
}

export async function updateCustomer(id: string, input: UpdateCustomerInput, actorId: string) {
  await getCustomer(id);

  if (input.phone && (await customersRepo.phoneExists(input.phone, id))) {
    throw AppError.badRequest("A customer with this phone number already exists", {
      phone: "already in use",
    });
  }

  const updated = await customersRepo.updateCustomer(id, input);
  await recordAudit({ userId: actorId, action: "customer.update", entityType: "customer", entityId: id });
  return updated;
}

export async function archiveCustomer(id: string, actorId: string, reason?: string) {
  await getCustomer(id);
  const archived = await customersRepo.archiveCustomer(id);
  await recordAudit({ userId: actorId, action: "customer.archive", entityType: "customer", entityId: id });
  await recordArchive({ entityType: "customer", entityId: id, reason, archivedBy: actorId });
  return archived;
}
