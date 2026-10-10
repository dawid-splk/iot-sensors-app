CREATE TABLE app_user (
  id            BIGSERIAL PRIMARY KEY,
  username      VARCHAR(50)  NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE auth_token (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT      NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  token_hash  CHAR(64)    NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE series (
  id         BIGSERIAL PRIMARY KEY,
  name       VARCHAR(100)     NOT NULL,
  min_value  DOUBLE PRECISION NOT NULL,
  max_value  DOUBLE PRECISION NOT NULL,
  color      CHAR(7)          NOT NULL CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
  icon       VARCHAR(30),
  unit       VARCHAR(20),
  created_at TIMESTAMPTZ      NOT NULL DEFAULT now(),
  CONSTRAINT series_range_chk CHECK (min_value < max_value)
);

CREATE TABLE sensor (
  id                  BIGSERIAL PRIMARY KEY,
  name                VARCHAR(100) NOT NULL,
  series_id           BIGINT       NOT NULL REFERENCES series(id) ON DELETE CASCADE,
  api_key_hash        CHAR(64)     NOT NULL UNIQUE,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
  last_measurement_at TIMESTAMPTZ
);

CREATE TABLE measurement (
  id         BIGSERIAL PRIMARY KEY,
  series_id  BIGINT           NOT NULL REFERENCES series(id) ON DELETE CASCADE,
  sensor_id  BIGINT           REFERENCES sensor(id) ON DELETE SET NULL,  -- measurements aren't deleted
  value      DOUBLE PRECISION NOT NULL,
  ts         TIMESTAMPTZ      NOT NULL,
  created_at TIMESTAMPTZ      NOT NULL DEFAULT now()
);

CREATE INDEX measurement_series_ts_idx ON measurement (series_id, ts);
CREATE INDEX measurement_ts_idx        ON measurement (ts);
CREATE INDEX sensor_series_idx         ON sensor (series_id);
CREATE INDEX auth_token_expires_idx    ON auth_token (expires_at);
