-- ============================================================
-- GA Portal — Initial Schema
-- Migration: 001_initial_schema.sql
-- Description: Full data model for a 41-floor game company
--              General Affairs portal
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 0. Extensions
-- ────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ────────────────────────────────────────────────────────────
-- 1. Helper: updated_at auto-stamp trigger function
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ────────────────────────────────────────────────────────────
-- 2. Helper: RLS role check
-- ────────────────────────────────────────────────────────────
-- Returns true if the currently authenticated Supabase user
-- is an operator or admin. Used in RLS policies below.
CREATE OR REPLACE FUNCTION check_is_operator()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM users
    WHERE id = auth.uid()
      AND role IN ('operator', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ────────────────────────────────────────────────────────────
-- 3. Tables
-- ────────────────────────────────────────────────────────────

-- 3.1 users
CREATE TABLE users (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email        text        UNIQUE NOT NULL,
  name         text        NOT NULL,
  employee_id  text        UNIQUE,
  department   text,
  floor        integer,
  role         text        NOT NULL DEFAULT 'employee'
                           CHECK (role IN ('employee', 'operator', 'admin')),
  avatar_url   text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- 3.2 announcements
CREATE TABLE announcements (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text        NOT NULL,
  content      text        NOT NULL,
  author_id    uuid        NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  is_pinned    boolean     NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);


-- 3.3 complaints
CREATE TABLE complaints (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id   uuid        NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  is_anonymous  boolean     NOT NULL DEFAULT false,
  category      text        NOT NULL
                            CHECK (category IN ('facility', 'living_environment', 'welfare', 'it', 'other')),
  title         text        NOT NULL,
  description   text        NOT NULL,
  attachments   jsonb       NOT NULL DEFAULT '[]',
  status        text        NOT NULL DEFAULT 'submitted'
                            CHECK (status IN ('submitted', 'reviewing', 'in_progress', 'completed', 'rejected')),
  assigned_to   uuid        REFERENCES users(id) ON DELETE SET NULL,
  response      text,
  responded_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_complaints_updated_at
  BEFORE UPDATE ON complaints
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- 3.4 assets
CREATE TABLE assets (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_number   text        UNIQUE NOT NULL,
  type           text        NOT NULL
                             CHECK (type IN ('pc', 'monitor', 'laptop', 'keyboard', 'mouse', 'headset', 'other')),
  model          text,
  spec           jsonb,
  assigned_to    uuid        REFERENCES users(id) ON DELETE SET NULL,
  status         text        NOT NULL DEFAULT 'in_stock'
                             CHECK (status IN ('in_use', 'in_stock', 'under_repair', 'disposed')),
  purchased_at   date,
  warranty_until date,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_assets_updated_at
  BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- 3.5 equipment_requests
CREATE TABLE equipment_requests (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid        NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  request_type text        NOT NULL
                           CHECK (request_type IN ('inspection', 'replacement', 'purchase', 'software_purchase', 'network_inspection')),
  asset_id     uuid        REFERENCES assets(id) ON DELETE SET NULL,
  title        text        NOT NULL,
  description  text        NOT NULL,
  urgency      text        NOT NULL DEFAULT 'normal'
                           CHECK (urgency IN ('normal', 'urgent')),
  status       text        NOT NULL DEFAULT 'submitted'
                           CHECK (status IN ('submitted', 'reviewing', 'scheduled', 'in_progress', 'completed')),
  assigned_to  uuid        REFERENCES users(id) ON DELETE SET NULL,
  floor        integer,
  attachments  jsonb       NOT NULL DEFAULT '[]',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_equipment_requests_updated_at
  BEFORE UPDATE ON equipment_requests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- 3.6 temperature_readings
CREATE TABLE temperature_readings (
  id           uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  floor        integer        NOT NULL,
  zone         text,
  current_temp decimal(4, 1),
  target_temp  decimal(4, 1),
  recorded_at  timestamptz    NOT NULL DEFAULT now()
);


-- 3.7 temperature_complaints
CREATE TABLE temperature_complaints (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid        NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  floor       integer     NOT NULL,
  feeling     text        NOT NULL
                          CHECK (feeling IN ('hot', 'cold')),
  memo        text,
  status      text        NOT NULL DEFAULT 'submitted'
                          CHECK (status IN ('submitted', 'acknowledged', 'resolved')),
  created_at  timestamptz NOT NULL DEFAULT now()
);


-- 3.8 found_items  (declared before lost_items for FK reference)
CREATE TABLE found_items (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id      uuid        NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  item_name        text        NOT NULL,
  category         text        NOT NULL
                               CHECK (category IN ('electronics', 'clothing', 'wallet_card', 'other')),
  found_floor      integer     NOT NULL,
  found_location   text,
  description      text,
  photo_url        text,
  storage_location text,
  storage_deadline date,
  status           text        NOT NULL DEFAULT 'registered'
                               CHECK (status IN ('registered', 'matched', 'claimed', 'disposed')),
  claimed_by       uuid        REFERENCES users(id) ON DELETE SET NULL,
  claimed_at       timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_found_items_updated_at
  BEFORE UPDATE ON found_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- 3.9 lost_items
CREATE TABLE lost_items (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id      uuid        NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  item_name        text        NOT NULL,
  category         text        NOT NULL
                               CHECK (category IN ('electronics', 'clothing', 'wallet_card', 'other')),
  lost_floor       integer,
  lost_location    text,
  lost_time        timestamptz,
  description      text,
  photo_url        text,
  status           text        NOT NULL DEFAULT 'reported'
                               CHECK (status IN ('reported', 'matched', 'claimed', 'closed')),
  matched_found_id uuid        REFERENCES found_items(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_lost_items_updated_at
  BEFORE UPDATE ON lost_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- 3.10 parcels
CREATE TABLE parcels (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id     uuid        REFERENCES users(id) ON DELETE SET NULL,
  recipient_name   text        NOT NULL,
  carrier          text,
  tracking_number  text,
  storage_location text        NOT NULL,
  registered_by    uuid        NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status           text        NOT NULL DEFAULT 'stored'
                               CHECK (status IN ('stored', 'notified', 'claimed')),
  claimed_at       timestamptz,
  reminder_count   integer     NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_parcels_updated_at
  BEFORE UPDATE ON parcels
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- 3.11 facility_requests
CREATE TABLE facility_requests (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id    uuid        NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  category        text        NOT NULL
                              CHECK (category IN ('lighting', 'furniture', 'door', 'plumbing', 'electrical', 'cleaning', 'other')),
  floor           integer     NOT NULL,
  location_detail text        NOT NULL,
  description     text        NOT NULL,
  photo_url       text,
  urgency         text        NOT NULL DEFAULT 'normal'
                              CHECK (urgency IN ('normal', 'urgent')),
  status          text        NOT NULL DEFAULT 'submitted'
                              CHECK (status IN ('submitted', 'vendor_assigned', 'in_repair', 'completed')),
  vendor          text,
  assigned_to     uuid        REFERENCES users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_facility_requests_updated_at
  BEFORE UPDATE ON facility_requests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- 3.12 notifications
CREATE TABLE notifications (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       text        NOT NULL
                         CHECK (type IN ('request_status', 'parcel_arrival', 'parcel_reminder', 'temperature', 'complaint_response', 'system')),
  title      text        NOT NULL,
  message    text        NOT NULL,
  link       text,
  is_read    boolean     NOT NULL DEFAULT false,
  channel    text        NOT NULL DEFAULT 'in_app'
                         CHECK (channel IN ('in_app', 'email', 'slack')),
  created_at timestamptz NOT NULL DEFAULT now()
);


-- ────────────────────────────────────────────────────────────
-- 4. Indexes
-- ────────────────────────────────────────────────────────────

-- users
CREATE INDEX idx_users_role           ON users(role);
CREATE INDEX idx_users_floor          ON users(floor);
CREATE INDEX idx_users_department     ON users(department);

-- complaints
CREATE INDEX idx_complaints_reporter  ON complaints(reporter_id);
CREATE INDEX idx_complaints_status    ON complaints(status);
CREATE INDEX idx_complaints_assigned  ON complaints(assigned_to);

-- equipment_requests
CREATE INDEX idx_equip_req_requester  ON equipment_requests(requester_id);
CREATE INDEX idx_equip_req_status     ON equipment_requests(status);
CREATE INDEX idx_equip_req_type       ON equipment_requests(request_type);

-- lost_items
CREATE INDEX idx_lost_reporter        ON lost_items(reporter_id);
CREATE INDEX idx_lost_status          ON lost_items(status);
CREATE INDEX idx_lost_floor           ON lost_items(lost_floor);

-- found_items
CREATE INDEX idx_found_floor          ON found_items(found_floor);
CREATE INDEX idx_found_status         ON found_items(status);

-- parcels
CREATE INDEX idx_parcels_recipient    ON parcels(recipient_id);
CREATE INDEX idx_parcels_status       ON parcels(status);

-- facility_requests
CREATE INDEX idx_facility_requester   ON facility_requests(requester_id);
CREATE INDEX idx_facility_status      ON facility_requests(status);
CREATE INDEX idx_facility_floor       ON facility_requests(floor);

-- temperature_complaints
CREATE INDEX idx_temp_comp_floor      ON temperature_complaints(floor);
CREATE INDEX idx_temp_comp_created    ON temperature_complaints(created_at);

-- notifications
CREATE INDEX idx_notif_user           ON notifications(user_id);
CREATE INDEX idx_notif_is_read        ON notifications(is_read);


-- ────────────────────────────────────────────────────────────
-- 5. Row Level Security
-- ────────────────────────────────────────────────────────────
-- Strategy:
--   • Operators and admins  → unrestricted via check_is_operator()
--   • Employees             → access to their own rows only
--   • All policies are PERMISSIVE (OR logic within the same command)

-- 5.1 users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_select_own ON users
  FOR SELECT USING (
    id = auth.uid()
    OR check_is_operator()
  );

CREATE POLICY users_insert_own ON users
  FOR INSERT WITH CHECK (
    id = auth.uid()
    OR check_is_operator()
  );

CREATE POLICY users_update_own ON users
  FOR UPDATE USING (
    id = auth.uid()
    OR check_is_operator()
  );

CREATE POLICY users_delete_operator ON users
  FOR DELETE USING (check_is_operator());


-- 5.2 announcements
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY announcements_select_all ON announcements
  FOR SELECT USING (true);

CREATE POLICY announcements_insert_operator ON announcements
  FOR INSERT WITH CHECK (check_is_operator());

CREATE POLICY announcements_update_operator ON announcements
  FOR UPDATE USING (check_is_operator());

CREATE POLICY announcements_delete_operator ON announcements
  FOR DELETE USING (check_is_operator());


-- 5.3 complaints
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

CREATE POLICY complaints_select ON complaints
  FOR SELECT USING (
    reporter_id = auth.uid()
    OR check_is_operator()
  );

CREATE POLICY complaints_insert_own ON complaints
  FOR INSERT WITH CHECK (
    reporter_id = auth.uid()
    OR check_is_operator()
  );

CREATE POLICY complaints_update ON complaints
  FOR UPDATE USING (
    reporter_id = auth.uid()
    OR check_is_operator()
  );

CREATE POLICY complaints_delete_operator ON complaints
  FOR DELETE USING (check_is_operator());


-- 5.4 assets
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY assets_select ON assets
  FOR SELECT USING (
    assigned_to = auth.uid()
    OR check_is_operator()
  );

CREATE POLICY assets_insert_operator ON assets
  FOR INSERT WITH CHECK (check_is_operator());

CREATE POLICY assets_update_operator ON assets
  FOR UPDATE USING (check_is_operator());

CREATE POLICY assets_delete_operator ON assets
  FOR DELETE USING (check_is_operator());


-- 5.5 equipment_requests
ALTER TABLE equipment_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY equip_req_select ON equipment_requests
  FOR SELECT USING (
    requester_id = auth.uid()
    OR check_is_operator()
  );

CREATE POLICY equip_req_insert_own ON equipment_requests
  FOR INSERT WITH CHECK (
    requester_id = auth.uid()
    OR check_is_operator()
  );

CREATE POLICY equip_req_update ON equipment_requests
  FOR UPDATE USING (
    requester_id = auth.uid()
    OR check_is_operator()
  );

CREATE POLICY equip_req_delete_operator ON equipment_requests
  FOR DELETE USING (check_is_operator());


-- 5.6 temperature_readings
ALTER TABLE temperature_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY temp_readings_select_all ON temperature_readings
  FOR SELECT USING (true);

CREATE POLICY temp_readings_insert_operator ON temperature_readings
  FOR INSERT WITH CHECK (check_is_operator());

CREATE POLICY temp_readings_update_operator ON temperature_readings
  FOR UPDATE USING (check_is_operator());

CREATE POLICY temp_readings_delete_operator ON temperature_readings
  FOR DELETE USING (check_is_operator());


-- 5.7 temperature_complaints
ALTER TABLE temperature_complaints ENABLE ROW LEVEL SECURITY;

CREATE POLICY temp_comp_select ON temperature_complaints
  FOR SELECT USING (
    reporter_id = auth.uid()
    OR check_is_operator()
  );

CREATE POLICY temp_comp_insert_own ON temperature_complaints
  FOR INSERT WITH CHECK (
    reporter_id = auth.uid()
    OR check_is_operator()
  );

CREATE POLICY temp_comp_update_operator ON temperature_complaints
  FOR UPDATE USING (check_is_operator());

CREATE POLICY temp_comp_delete_operator ON temperature_complaints
  FOR DELETE USING (check_is_operator());


-- 5.8 found_items
ALTER TABLE found_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY found_items_select_all ON found_items
  FOR SELECT USING (true);

CREATE POLICY found_items_insert_own ON found_items
  FOR INSERT WITH CHECK (
    reporter_id = auth.uid()
    OR check_is_operator()
  );

CREATE POLICY found_items_update ON found_items
  FOR UPDATE USING (
    reporter_id = auth.uid()
    OR check_is_operator()
  );

CREATE POLICY found_items_delete_operator ON found_items
  FOR DELETE USING (check_is_operator());


-- 5.9 lost_items
ALTER TABLE lost_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY lost_items_select ON lost_items
  FOR SELECT USING (
    reporter_id = auth.uid()
    OR check_is_operator()
  );

CREATE POLICY lost_items_insert_own ON lost_items
  FOR INSERT WITH CHECK (
    reporter_id = auth.uid()
    OR check_is_operator()
  );

CREATE POLICY lost_items_update ON lost_items
  FOR UPDATE USING (
    reporter_id = auth.uid()
    OR check_is_operator()
  );

CREATE POLICY lost_items_delete_operator ON lost_items
  FOR DELETE USING (check_is_operator());


-- 5.10 parcels
ALTER TABLE parcels ENABLE ROW LEVEL SECURITY;

CREATE POLICY parcels_select ON parcels
  FOR SELECT USING (
    recipient_id = auth.uid()
    OR check_is_operator()
  );

CREATE POLICY parcels_insert_operator ON parcels
  FOR INSERT WITH CHECK (check_is_operator());

CREATE POLICY parcels_update_operator ON parcels
  FOR UPDATE USING (check_is_operator());

CREATE POLICY parcels_delete_operator ON parcels
  FOR DELETE USING (check_is_operator());


-- 5.11 facility_requests
ALTER TABLE facility_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY facility_req_select ON facility_requests
  FOR SELECT USING (
    requester_id = auth.uid()
    OR check_is_operator()
  );

CREATE POLICY facility_req_insert_own ON facility_requests
  FOR INSERT WITH CHECK (
    requester_id = auth.uid()
    OR check_is_operator()
  );

CREATE POLICY facility_req_update ON facility_requests
  FOR UPDATE USING (
    requester_id = auth.uid()
    OR check_is_operator()
  );

CREATE POLICY facility_req_delete_operator ON facility_requests
  FOR DELETE USING (check_is_operator());


-- 5.12 notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_select_own ON notifications
  FOR SELECT USING (
    user_id = auth.uid()
    OR check_is_operator()
  );

CREATE POLICY notifications_insert_operator ON notifications
  FOR INSERT WITH CHECK (check_is_operator());

CREATE POLICY notifications_update_own ON notifications
  FOR UPDATE USING (
    user_id = auth.uid()
    OR check_is_operator()
  );

CREATE POLICY notifications_delete_operator ON notifications
  FOR DELETE USING (check_is_operator());
