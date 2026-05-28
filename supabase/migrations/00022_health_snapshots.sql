-- =============================================================================
-- KAZA — Historique des healthchecks (pour graphes /status)
-- Un snapshot par service est inséré au max toutes les 60 secondes.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.health_snapshots (
  id          BIGSERIAL PRIMARY KEY,
  service_id  TEXT NOT NULL,
  service_name TEXT NOT NULL,
  status      TEXT NOT NULL, -- OK / DEGRADED / DOWN / UNKNOWN
  latency_ms  INTEGER,
  message     TEXT,
  checked_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_health_snap_service_time
  ON public.health_snapshots (service_id, checked_at DESC);

CREATE INDEX IF NOT EXISTS idx_health_snap_checked_at
  ON public.health_snapshots (checked_at DESC);

ALTER TABLE public.health_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "health_snap_public_read" ON public.health_snapshots;
CREATE POLICY "health_snap_public_read"
  ON public.health_snapshots FOR SELECT USING (true);

-- Insert : service-role uniquement (depuis le code server avec admin client).
-- On laisse pas l'anon insérer pour éviter spam.

-- =============================================================================
-- VIEWS agrégées
-- =============================================================================

-- Uptime % par service sur 24h / 7j / 30j (compte des "OK" / total)
CREATE OR REPLACE VIEW public.health_uptime_summary AS
WITH base AS (
  SELECT
    service_id,
    service_name,
    status,
    latency_ms,
    checked_at,
    CASE WHEN status = 'OK' THEN 1 ELSE 0 END AS is_ok
  FROM public.health_snapshots
  WHERE checked_at >= NOW() - INTERVAL '30 days'
)
SELECT
  service_id,
  service_name,
  count(*) FILTER (WHERE checked_at >= NOW() - INTERVAL '24 hours')::BIGINT AS total_24h,
  sum(is_ok) FILTER (WHERE checked_at >= NOW() - INTERVAL '24 hours')::BIGINT AS ok_24h,
  count(*) FILTER (WHERE checked_at >= NOW() - INTERVAL '7 days')::BIGINT AS total_7d,
  sum(is_ok) FILTER (WHERE checked_at >= NOW() - INTERVAL '7 days')::BIGINT AS ok_7d,
  count(*)::BIGINT AS total_30d,
  sum(is_ok)::BIGINT AS ok_30d,
  avg(NULLIF(
    CASE WHEN status = 'OK' THEN latency_ms END, 0
  ))::INTEGER AS avg_latency_ms_30d
FROM base
GROUP BY service_id, service_name;

-- Latence moyenne par heure (dernières 24h)
CREATE OR REPLACE VIEW public.health_latency_hourly_24h AS
SELECT
  service_id,
  date_trunc('hour', checked_at) AS hour,
  avg(latency_ms)::INTEGER AS avg_latency_ms,
  count(*)::BIGINT AS samples,
  sum(CASE WHEN status = 'OK' THEN 1 ELSE 0 END)::BIGINT AS ok_count
FROM public.health_snapshots
WHERE checked_at >= NOW() - INTERVAL '24 hours'
  AND latency_ms IS NOT NULL
GROUP BY service_id, date_trunc('hour', checked_at)
ORDER BY hour;

-- Uptime par jour (90 derniers jours) pour calendrier
CREATE OR REPLACE VIEW public.health_daily_90d AS
SELECT
  date_trunc('day', checked_at)::DATE AS day,
  count(*)::BIGINT AS total,
  sum(CASE WHEN status = 'OK' THEN 1 ELSE 0 END)::BIGINT AS ok_count,
  sum(CASE WHEN status = 'DEGRADED' THEN 1 ELSE 0 END)::BIGINT AS degraded_count,
  sum(CASE WHEN status = 'DOWN' THEN 1 ELSE 0 END)::BIGINT AS down_count
FROM public.health_snapshots
WHERE checked_at >= NOW() - INTERVAL '90 days'
GROUP BY 1
ORDER BY 1 DESC;
