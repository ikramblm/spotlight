import type { Request, Response } from "express";
import * as archivesService from "./service";
import type { ListArchivesQuery } from "./schema";

export async function listArchives(req: Request, res: Response) {
  const filters = req.query as unknown as ListArchivesQuery;
  const { rows, total } = await archivesService.listArchives(filters);
  res.status(200).json({ data: rows, meta: { page: filters.page, pageSize: filters.pageSize, total } });
}
