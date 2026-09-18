-- Generic archive pointer: what + when + why, not a data copy. The entity itself stays in its
-- own table with status='archived' (architecture doc §6/§20/§30 rule #8) - this table is the
-- append-only "why was it archived" trail layered on top of every module's own archive action.
CREATE TABLE archives (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type    VARCHAR(40) NOT NULL,
  entity_id      UUID NOT NULL,
  reason         TEXT,
  archived_by    UUID NOT NULL REFERENCES users(id),
  archived_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_archives_entity ON archives(entity_type, entity_id);
CREATE INDEX idx_archives_archived_at ON archives(archived_at);
