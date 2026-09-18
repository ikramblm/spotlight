CREATE TABLE audit_logs (
  id             BIGSERIAL PRIMARY KEY,
  user_id        UUID REFERENCES users(id),
  action         VARCHAR(80) NOT NULL,
  entity_type    VARCHAR(40),
  entity_id      UUID,
  ip_address     INET,
  metadata       JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
