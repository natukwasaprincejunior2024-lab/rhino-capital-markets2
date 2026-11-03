/*
# Enforce price alert limits on the server

1. What changes
- Adds a database check that runs before every new price alert is saved.
- It counts the user's active alerts (not yet triggered) and compares them to their plan limit.
- Limits match the app's plan rules: Daily = 5, Weekly = 20, Monthly and Yearly = unlimited, Free (outside the trial) = 0.
- Pro and trial status use the same rules as the billing status check.

2. Security
- The check runs as a privileged function so it can read the billing record and the signup date.
- Only the database itself can run it; no public or anonymous role may call it directly.
- Anonymous visitors lose their unused table privileges on price alerts. Signed-in users keep their existing per-user access.

3. Notes
- A transaction-level lock per user prevents two simultaneous inserts from both slipping past the limit.
- When the limit is reached the insert fails with a clear message that the app already shows to the user.
*/

CREATE OR REPLACE FUNCTION public.enforce_price_alert_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  v_signup timestamptz;
  v_acc public.billing_accounts%ROWTYPE;
  v_limit integer;
  v_active integer;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.user_id::text, 0));

  SELECT u.created_at INTO v_signup FROM auth.users u WHERE u.id = NEW.user_id;
  SELECT * INTO v_acc FROM public.billing_accounts WHERE user_id = NEW.user_id;

  IF COALESCE(v_signup + interval '7 days' > now(), false) OR public.billing_plan_active(v_acc) THEN
    v_limit := CASE
      WHEN v_acc.plan = 'daily' THEN 5
      WHEN v_acc.plan = 'weekly' THEN 20
      ELSE NULL
    END;
  ELSE
    v_limit := 0;
  END IF;

  IF v_limit IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT count(*) INTO v_active
  FROM public.price_alerts
  WHERE user_id = NEW.user_id AND triggered_at IS NULL;

  IF v_active >= v_limit THEN
    RAISE EXCEPTION 'Your plan allows % active price alerts. Upgrade to add more.', v_limit
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.enforce_price_alert_limit() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS enforce_price_alert_limit_before_insert ON public.price_alerts;
CREATE TRIGGER enforce_price_alert_limit_before_insert
  BEFORE INSERT ON public.price_alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_price_alert_limit();

REVOKE ALL ON public.price_alerts FROM anon;
