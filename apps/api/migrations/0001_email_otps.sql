-- ============================================================================
-- Migration: 0001_email_otps.sql
-- Description: Adds email_otps, otp_rate_limits, deduplication, unique
--              constraints, and atomic RPCs for official Gmail OTP authentication.
-- ============================================================================

-- 1. ARCHIVE AND DEDUPLICATE EXISTING ACCOUNTS BEFORE UNIQUE CONSTRAINTS
CREATE TABLE IF NOT EXISTS user_accounts_duplicate_archive (
  archived_at timestamptz NOT NULL DEFAULT now(),
  id uuid,
  username text,
  internal_email text,
  password_salt text,
  password_hash text,
  password_iterations integer,
  status text,
  created_at timestamptz
);

CREATE TABLE IF NOT EXISTS approved_users_duplicate_archive (
  archived_at timestamptz NOT NULL DEFAULT now(),
  email text,
  status text,
  expires_at timestamptz,
  max_devices integer,
  daily_website_limit integer,
  approved_at timestamptz,
  created_at timestamptz
);

-- Normalize existing emails to lowercase and trimmed form
UPDATE user_accounts SET internal_email = lower(trim(internal_email)) WHERE internal_email IS NOT NULL;
UPDATE approved_users SET email = lower(trim(email)) WHERE email IS NOT NULL;

-- Archive and prune duplicates in user_accounts (keeping newest record)
INSERT INTO user_accounts_duplicate_archive (id, username, internal_email, password_salt, password_hash, password_iterations, status, created_at)
SELECT a.id, a.username, a.internal_email, a.password_salt, a.password_hash, a.password_iterations, a.status, a.created_at
FROM user_accounts a
JOIN user_accounts b ON a.internal_email = b.internal_email AND a.created_at < b.created_at;

DELETE FROM user_accounts a
USING user_accounts b
WHERE a.internal_email = b.internal_email AND a.created_at < b.created_at;

-- Archive and prune duplicates in approved_users (keeping newest record)
INSERT INTO approved_users_duplicate_archive (email, status, expires_at, max_devices, daily_website_limit, approved_at, created_at)
SELECT a.email, a.status, a.expires_at, a.max_devices, a.daily_website_limit, a.approved_at, a.created_at
FROM approved_users a
JOIN approved_users b ON a.email = b.email AND a.created_at < b.created_at;

DELETE FROM approved_users a
USING approved_users b
WHERE a.email = b.email AND a.created_at < b.created_at;

-- Enforce unique constraints safely
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_user_accounts_internal_email'
  ) THEN
    ALTER TABLE user_accounts ADD CONSTRAINT unique_user_accounts_internal_email UNIQUE (internal_email);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_approved_users_email'
  ) THEN
    ALTER TABLE approved_users ADD CONSTRAINT unique_approved_users_email UNIQUE (email);
  END IF;
END $$;

-- 2. CREATE EMAIL_OTPS TABLE
CREATE TABLE IF NOT EXISTS email_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  email_hash text NOT NULL,
  otp_hash text NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 5,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz DEFAULT NULL,
  consumed_at timestamptz DEFAULT NULL,
  ip_hash text DEFAULT NULL,
  installation_id text DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_otps_lookup ON email_otps (email, revoked_at, expires_at);
CREATE INDEX IF NOT EXISTS idx_email_otps_hash_created ON email_otps (email_hash, created_at);

-- 3. CREATE OTP_RATE_LIMITS TABLE
CREATE TABLE IF NOT EXISTS otp_rate_limits (
  key text PRIMARY KEY,
  last_sent_at timestamptz NOT NULL DEFAULT now(),
  window_start timestamptz NOT NULL DEFAULT now(),
  request_count integer NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. ENABLE RLS AND GRANT ACCESS STRICTLY TO SERVICE ROLE
ALTER TABLE email_otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_rate_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_role_all_email_otps ON email_otps;
CREATE POLICY service_role_all_email_otps ON email_otps
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_otp_rate_limits ON otp_rate_limits;
CREATE POLICY service_role_all_otp_rate_limits ON otp_rate_limits
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 5. ATOMIC OTP VERIFICATION FUNCTION (INCREMENTS ATTEMPTS ON ALL SUBMISSIONS)
CREATE OR REPLACE FUNCTION verify_and_consume_email_otp(
  p_email text,
  p_otp_hash text
) RETURNS jsonb AS $$
DECLARE
  v_otp record;
  v_is_match boolean;
  v_new_attempts int;
BEGIN
  -- 1. Select the active OTP row with row-level locking
  SELECT * INTO v_otp
  FROM email_otps
  WHERE email = lower(trim(p_email))
    AND revoked_at IS NULL
    AND expires_at > now()
    AND attempts < max_attempts
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'status', 401, 'error', 'Invalid or expired verification code.');
  END IF;

  v_is_match := (v_otp.otp_hash = p_otp_hash);
  v_new_attempts := v_otp.attempts + 1;

  IF v_is_match THEN
    -- Matched: atomically consume and revoke
    UPDATE email_otps
    SET attempts = v_new_attempts,
        consumed_at = now(),
        revoked_at = now()
    WHERE id = v_otp.id;

    RETURN jsonb_build_object('ok', true, 'otp_id', v_otp.id, 'email', v_otp.email);
  ELSE
    -- Incorrect code: increment attempt count and revoke if max reached
    UPDATE email_otps
    SET attempts = v_new_attempts,
        revoked_at = CASE WHEN v_new_attempts >= v_otp.max_attempts THEN now() ELSE NULL END
    WHERE id = v_otp.id;

    IF v_new_attempts >= v_otp.max_attempts THEN
      RETURN jsonb_build_object('ok', false, 'status', 401, 'error', 'Maximum verification attempts exceeded. Please request a new code.');
    ELSE
      RETURN jsonb_build_object('ok', false, 'status', 401, 'error', 'Incorrect verification code. Please check and try again.');
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. ATOMIC RATE LIMIT CHECK AND INCREMENT FUNCTION
CREATE OR REPLACE FUNCTION check_and_increment_otp_rate_limit(
  p_key text,
  p_cooldown_seconds int DEFAULT 30,
  p_window_seconds int DEFAULT 3600,
  p_max_requests int DEFAULT 5
) RETURNS jsonb AS $$
DECLARE
  v_record record;
  v_now timestamptz := now();
BEGIN
  SELECT * INTO v_record
  FROM otp_rate_limits
  WHERE key = p_key
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO otp_rate_limits (key, last_sent_at, window_start, request_count, updated_at)
    VALUES (p_key, v_now, v_now, 1, v_now);
    RETURN jsonb_build_object('allowed', true);
  END IF;

  -- Check cooldown
  IF v_record.last_sent_at + (p_cooldown_seconds || ' seconds')::interval > v_now THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'status', 429,
      'error', 'Please wait ' || p_cooldown_seconds || ' seconds before requesting another code.'
    );
  END IF;

  -- Check window reset
  IF v_record.window_start + (p_window_seconds || ' seconds')::interval <= v_now THEN
    UPDATE otp_rate_limits
    SET window_start = v_now,
        request_count = 1,
        last_sent_at = v_now,
        updated_at = v_now
    WHERE key = p_key;
    RETURN jsonb_build_object('allowed', true);
  END IF;

  -- Check hourly quota
  IF v_record.request_count >= p_max_requests THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'status', 429,
      'error', 'Too many verification code requests. Please try again later.'
    );
  END IF;

  UPDATE otp_rate_limits
  SET request_count = request_count + 1,
      last_sent_at = v_now,
      updated_at = v_now
  WHERE key = p_key;

  RETURN jsonb_build_object('allowed', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. ATOMIC SUBSCRIBER PROVISIONING FUNCTION (WITH 200 STARTER TOKENS & DEVICE REGISTRATION)
CREATE OR REPLACE FUNCTION provision_subscriber_session(
  p_email text,
  p_username text,
  p_token_hash text,
  p_installation_id text,
  p_device_name text DEFAULT 'Android device',
  p_android_version text DEFAULT 'Unknown',
  p_expires_at timestamptz DEFAULT now() + interval '30 days'
) RETURNS jsonb AS $$
DECLARE
  v_account_id uuid;
  v_username text;
  v_now timestamptz := now();
  v_max_devices int := 2;
  v_active_devices int := 0;
  v_existing_device record;
BEGIN
  -- Normalize email
  p_email := lower(trim(p_email));

  -- 1. Get or create user_account
  SELECT id, username INTO v_account_id, v_username
  FROM user_accounts
  WHERE internal_email = p_email
  LIMIT 1;

  IF NOT FOUND THEN
    v_username := COALESCE(NULLIF(trim(p_username), ''), 'user_' || substr(md5(random()::text), 1, 8));
    INSERT INTO user_accounts (username, internal_email, password_salt, password_hash, password_iterations, status, created_at)
    VALUES (v_username, p_email, encode(gen_random_bytes(16), 'hex'), encode(gen_random_bytes(32), 'hex'), 60000, 'active', v_now)
    RETURNING id, username INTO v_account_id, v_username;
  ELSE
    UPDATE user_accounts SET status = 'active' WHERE id = v_account_id AND status != 'active';
  END IF;

  -- 2. Upsert approved_users
  INSERT INTO approved_users (email, status, max_devices, daily_website_limit, approved_at)
  VALUES (p_email, 'active', v_max_devices, 5, v_now)
  ON CONFLICT (email) DO NOTHING;

  SELECT max_devices INTO v_max_devices FROM approved_users WHERE email = p_email;
  v_max_devices := COALESCE(v_max_devices, 2);

  -- 3. Ensure 200 starter tokens allocated in token_wallets
  BEGIN
    INSERT INTO token_wallets (account_id, topup_balance, monthly_balance, reserved_balance, lifetime_used, created_at, updated_at)
    VALUES (v_account_id, 200, 0, 0, 0, v_now, v_now)
    ON CONFLICT (account_id) DO NOTHING;
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;

  -- 4. Device verification and registration
  IF p_installation_id IS NOT NULL AND p_installation_id != '' THEN
    SELECT id, email, revoked_at INTO v_existing_device
    FROM devices
    WHERE installation_id = p_installation_id
    LIMIT 1;

    IF v_existing_device.id IS NOT NULL THEN
      IF v_existing_device.email != p_email THEN
        RETURN jsonb_build_object('ok', false, 'status', 409, 'error', 'This installation is already linked to another account.');
      END IF;
      IF v_existing_device.revoked_at IS NOT NULL THEN
        RETURN jsonb_build_object('ok', false, 'status', 403, 'error', 'This device has been revoked by the administrator.');
      END IF;
      UPDATE devices
      SET last_seen_at = v_now,
          device_name = COALESCE(NULLIF(p_device_name, ''), device_name),
          android_version = COALESCE(NULLIF(p_android_version, ''), android_version)
      WHERE id = v_existing_device.id;
    ELSE
      SELECT count(*) INTO v_active_devices FROM devices WHERE email = p_email AND revoked_at IS NULL;
      IF v_active_devices >= v_max_devices THEN
        RETURN jsonb_build_object('ok', false, 'status', 409, 'error', 'Device limit reached. This account allows ' || v_max_devices || ' active devices.');
      END IF;
      INSERT INTO devices (email, installation_id, device_name, android_version, last_seen_at)
      VALUES (p_email, p_installation_id, COALESCE(NULLIF(p_device_name, ''), 'Android device'), COALESCE(NULLIF(p_android_version, ''), 'Unknown'), v_now);
    END IF;
  END IF;

  SELECT count(*) INTO v_active_devices FROM devices WHERE email = p_email AND revoked_at IS NULL;

  -- 5. Revoke prior sessions for this installation
  IF p_installation_id IS NOT NULL AND p_installation_id != '' THEN
    UPDATE user_sessions
    SET revoked_at = v_now
    WHERE user_id = v_account_id AND installation_id = p_installation_id AND revoked_at IS NULL;
  END IF;

  -- 6. Insert new 30-day session
  INSERT INTO user_sessions (user_id, username, internal_email, token_hash, installation_id, expires_at, last_seen_at)
  VALUES (v_account_id, v_username, p_email, p_token_hash, p_installation_id, p_expires_at, v_now);

  RETURN jsonb_build_object(
    'ok', true,
    'account_id', v_account_id,
    'username', v_username,
    'email', p_email,
    'role', 'subscriber',
    'max_devices', v_max_devices,
    'active_devices', v_active_devices,
    'starter_tokens', 200
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

