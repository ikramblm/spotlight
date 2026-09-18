CREATE TYPE restitution_status AS ENUM ('holding', 'returned');

CREATE TABLE confiscations (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guest_id           UUID NOT NULL REFERENCES guests(id),
  event_id           UUID NOT NULL REFERENCES events(id),
  item_type          VARCHAR(60) NOT NULL,
  item_description   TEXT,
  photo_key          VARCHAR(255),
  storage_reference  VARCHAR(60) NOT NULL,
  deposited_by       UUID NOT NULL REFERENCES users(id),
  deposited_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  status             restitution_status NOT NULL DEFAULT 'holding'
);
CREATE INDEX idx_confiscations_event ON confiscations(event_id);
CREATE INDEX idx_confiscations_guest ON confiscations(guest_id);

-- A physical locker/tag number identifies one held item at a time - once that item is
-- returned (status <> 'holding'), the same tag can be reused for a new one. This is on top
-- of, not instead of, the restitution-record uniqueness below.
CREATE UNIQUE INDEX idx_confiscations_active_storage_ref
  ON confiscations(event_id, storage_reference) WHERE status = 'holding';

CREATE TABLE restitution_records (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  confiscation_id    UUID NOT NULL UNIQUE REFERENCES confiscations(id),
  returned_by        UUID NOT NULL REFERENCES users(id),
  returned_to_note   VARCHAR(255),
  returned_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
