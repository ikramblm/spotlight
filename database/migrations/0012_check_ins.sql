CREATE TABLE check_ins (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invitation_id  UUID NOT NULL REFERENCES invitations(id),
  guest_id       UUID NOT NULL REFERENCES guests(id),
  event_id       UUID NOT NULL REFERENCES events(id),
  checked_in_by  UUID NOT NULL REFERENCES users(id),
  checked_in_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  access_result  VARCHAR(30) NOT NULL DEFAULT 'granted'
);
CREATE INDEX idx_checkins_event ON check_ins(event_id);
CREATE INDEX idx_checkins_guest ON check_ins(guest_id);

-- Spec §30 rule #5: a guest cannot be checked in twice unless an explicit override workflow.
-- The constraint only counts 'granted' rows (at most one real check-in per invitation) - a
-- 'denied_*' row is just a logged attempt and must never block the legitimate check-in that
-- follows it, and an 'override' row is deliberately outside the constraint so it can always
-- add one more entry beyond an existing granted one.
CREATE UNIQUE INDEX idx_checkins_one_granted_per_invite ON check_ins(invitation_id) WHERE access_result = 'granted';
