import * as archivesRepo from "./repository";
import type { ListArchivesQuery } from "./schema";

export async function listArchives(filters: ListArchivesQuery) {
  return archivesRepo.listArchives(filters);
}
