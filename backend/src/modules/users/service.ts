import { AppError } from "../../lib/AppError";
import { recordAudit } from "../../lib/audit";
import { hashPassword } from "../../lib/password";
import * as usersRepo from "./repository";
import type { CreateUserInput, ListUsersQuery, UpdateUserInput } from "./schema";

export async function createUser(input: CreateUserInput, actorId: string) {
  if (await usersRepo.emailExists(input.email)) {
    throw AppError.badRequest("A user with this email already exists", { email: "already in use" });
  }

  const roleId = await usersRepo.getRoleIdByName(input.role);
  const passwordHash = await hashPassword(input.password);
  const user = await usersRepo.insertUser({ ...input, passwordHash, roleId });

  await recordAudit({
    userId: actorId,
    action: "user.create",
    entityType: "user",
    entityId: user.id,
    metadata: { role: input.role },
  });

  return user;
}

export async function listUsers(filters: ListUsersQuery) {
  return usersRepo.listUsers(filters);
}

export async function getUser(id: string) {
  const user = await usersRepo.getUserById(id);
  if (!user) {
    throw AppError.notFound("User not found");
  }
  return user;
}

export async function updateUser(id: string, input: UpdateUserInput, actorId: string) {
  await getUser(id); // 404s if missing

  const roleId = input.role ? await usersRepo.getRoleIdByName(input.role) : undefined;
  const updated = await usersRepo.updateUser(id, { ...input, roleId });

  await recordAudit({
    userId: actorId,
    action: "user.update",
    entityType: "user",
    entityId: id,
    metadata: input,
  });

  return updated;
}

export async function setUserActive(id: string, isActive: boolean, actorId: string) {
  const target = await getUser(id);

  if (target.id === actorId && !isActive) {
    throw AppError.badRequest("You cannot deactivate your own account");
  }

  const updated = await usersRepo.setUserActive(id, isActive);

  await recordAudit({
    userId: actorId,
    action: isActive ? "user.activate" : "user.deactivate",
    entityType: "user",
    entityId: id,
  });

  return updated;
}
