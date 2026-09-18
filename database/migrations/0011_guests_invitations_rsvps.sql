CREATE TABLE guests (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id       UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  full_name      VARCHAR(150) NOT NULL,
  phone          VARCHAR(30),
  email          VARCHAR(255),
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_guests_event ON guests(event_id);
CREATE INDEX idx_guests_name_trgm ON guests USING gin (full_name gin_trgm_ops);

CREATE TYPE rsvp_status AS ENUM ('pending', 'accepted', 'declined');

CREATE TABLE invitations (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guest_id       UUID NOT NULL UNIQUE REFERENCES guests(id) ON DELETE CASCADE,
  event_id       UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  public_token   VARCHAR(64) NOT NULL UNIQUE,
  -- Reserved for a future pre-rendered/cached QR image in object storage; Phase 4 renders the
  -- QR on demand from public_token instead, so this stays nullable and unused for now.
  qr_code_key    VARCHAR(255) UNIQUE,
  sent_at        TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_invitations_event ON invitations(event_id);

CREATE TABLE rsvps (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invitation_id  UUID NOT NULL UNIQUE REFERENCES invitations(id) ON DELETE CASCADE,
  status         rsvp_status NOT NULL DEFAULT 'pending',
  responded_at   TIMESTAMPTZ,
  party_size     INTEGER CHECK (party_size >= 0),
  message        TEXT
);
