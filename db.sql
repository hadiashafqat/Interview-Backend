-- Schema for Sales Order Management

CREATE TABLE IF NOT EXISTS sol (
  id SERIAL PRIMARY KEY,
  gtn_no INTEGER,
  customer_code VARCHAR(35) NOT NULL,
  user_id INTEGER NOT NULL,
  e_date TIMESTAMPTZ DEFAULT now(),
  status CHAR(1) CHECK (status IN ('R','P','D')),
  remarks VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS so2 (
  id SERIAL PRIMARY KEY,
  so_id INTEGER NOT NULL REFERENCES sol(id) ON DELETE CASCADE,
  gtn_no INTEGER,
  item_code VARCHAR(100) NOT NULL,
  item_name VARCHAR(100),
  pol_code VARCHAR(100),
  policy2 VARCHAR(100),
  so_qty NUMERIC(19,4) NOT NULL,
  pol_rate NUMERIC(19,6),
  so_rate NUMERIC(19,6) NOT NULL,
  approved_qty NUMERIC(19,4),
  approved_rate NUMERIC(19,6),
  so_val NUMERIC(19,6) NOT NULL,
  approved_val NUMERIC(19,6)
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_so2_so_id ON so2(so_id);
CREATE INDEX IF NOT EXISTS idx_sol_status ON sol(status);



