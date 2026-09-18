import { query } from "../config/db";

export interface ArchiveEntry {
  entityType: string;
  entityId: string;
  reason?: string | null;
  archivedBy: string;
}

/** Appends the "why" behind an archive action. Never throws into the caller's flow. */
export async function recordArchive(entry: ArchiveEntry): Promise<void> {
  try {
    await query(
      `INSERT INTO archives (entity_type, entity_id, reason, archived_by)
       VALUES ($1, $2, $3, $4)`,
      [entry.entityType, entry.entityId, entry.reason ?? null, entry.archivedBy]
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to write archive record", entry.entityType, entry.entityId, err);
  }
}
