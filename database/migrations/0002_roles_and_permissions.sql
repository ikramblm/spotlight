CREATE TABLE roles (
  id            SMALLSERIAL PRIMARY KEY,
  name          user_role NOT NULL UNIQUE,
  description   TEXT
);

CREATE TABLE permissions (
  id            SMALLSERIAL PRIMARY KEY,
  code          VARCHAR(80) NOT NULL UNIQUE,
  description   TEXT
);

CREATE TABLE role_permissions (
  role_id        SMALLINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id  SMALLINT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);
