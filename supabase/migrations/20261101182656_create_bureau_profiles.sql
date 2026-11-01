/*
# Create bureau profiles

Adds a table that stores each user's bureau details: the bureau name, street address and phone number. These appear on receipts, the daily rate report and the display board.

1. New Tables
- `bureau_profiles`: exactly one row per user.
  - `user_id` (uuid, primary key, defaults to the signed-in user)
  - `name` (text, bureau name, up to 120 characters)
  - `address` (text, up to 250 characters)
  - `phone` (text, up to 40 characters)
  - `updated_at` (timestamp of the last save)

2. Security
- Row level security is enabled.
- Each user can only read, create and update their own profile. Profiles cannot be deleted from the app.
- Access is granted to the `authenticated` role only.

3. Important notes
- Saving uses an insert-or-update on the owner's row, so the first save creates the profile and later saves update it.
*/

CREATE TABLE IF NOT EXISTS bureau_profiles (
  user_id uuid PRIMARY KEY DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '' CHECK (char_length(name) <= 120),
  address text NOT NULL DEFAULT '' CHECK (char_length(address) <= 250),
  phone text NOT NULL DEFAULT '' CHECK (char_length(phone) <= 40),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE bureau_profiles ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON bureau_profiles TO authenticated;

DROP POLICY IF EXISTS "select_own_bureau_profile" ON bureau_profiles;
CREATE POLICY "select_own_bureau_profile" ON bureau_profiles FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_bureau_profile" ON bureau_profiles;
CREATE POLICY "insert_own_bureau_profile" ON bureau_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_bureau_profile" ON bureau_profiles;
CREATE POLICY "update_own_bureau_profile" ON bureau_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
