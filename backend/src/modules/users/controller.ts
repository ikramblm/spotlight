import type { Request, Response } from "express";
import { AppError } from "../../lib/AppError";
import * as usersService from "./service";
import type { CreateUserInput, ListUsersQuery, UpdateUserInput } from "./schema";

function requireActor(req: Request): string {
  if (!req.user) {
    throw AppError.unauthorized();
  }
  return req.user.id;
}

export async function createUser(req: Request, res: Response) {
  const user = await usersService.createUser(req.body as CreateUserInput, requireActor(req));
  res.status(201).json({ data: user });
}

export async function listUsers(req: Request, res: Response) {
  const filters = req.query as unknown as ListUsersQuery;
  const { rows, total } = await usersService.listUsers(filters);
  res.status(200).json({
    data: rows,
    meta: { page: filters.page, pageSize: filters.pageSize, total },
  });
}

export async function getUser(req: Request, res: Response) {
  const user = await usersService.getUser(req.params.id as string);
  res.status(200).json({ data: user });
}

export async function updateUser(req: Request, res: Response) {
  const user = await usersService.updateUser(
    req.params.id as string,
    req.body as UpdateUserInput,
    requireActor(req)
  );
  res.status(200).json({ data: user });
}

export async function activateUser(req: Request, res: Response) {
  const user = await usersService.setUserActive(req.params.id as string, true, requireActor(req));
  res.status(200).json({ data: user });
}

export async function deactivateUser(req: Request, res: Response) {
  const user = await usersService.setUserActive(req.params.id as string, false, requireActor(req));
  res.status(200).json({ data: user });
}
