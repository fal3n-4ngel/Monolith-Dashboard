-- Deduplicate continuum_home_expenses
CREATE OR REPLACE TABLE `portfolio-api-505006.events.continuum_home_expenses` AS
SELECT * EXCEPT(rn)
FROM (
  SELECT *,
    ROW_NUMBER() OVER (
      PARTITION BY COALESCE(entity_id, event_id), event_type 
      ORDER BY 
        CASE WHEN JSON_VALUE(payload.title) NOT LIKE '%:%' AND JSON_VALUE(payload.title) IS NOT NULL THEN 1 ELSE 2 END,
        occurred_at DESC
    ) as rn
  FROM `portfolio-api-505006.events.continuum_home_expenses`
)
WHERE rn = 1;

-- Deduplicate continuum_home_subscriptions
CREATE OR REPLACE TABLE `portfolio-api-505006.events.continuum_home_subscriptions` AS
SELECT * EXCEPT(rn)
FROM (
  SELECT *,
    ROW_NUMBER() OVER (
      PARTITION BY COALESCE(entity_id, event_id), event_type 
      ORDER BY 
        CASE WHEN JSON_VALUE(payload.name) NOT LIKE '%:%' AND JSON_VALUE(payload.name) IS NOT NULL THEN 1 ELSE 2 END,
        occurred_at DESC
    ) as rn
  FROM `portfolio-api-505006.events.continuum_home_subscriptions`
)
WHERE rn = 1;

-- Deduplicate continuum_home_watchlist
CREATE OR REPLACE TABLE `portfolio-api-505006.events.continuum_home_watchlist` AS
SELECT * EXCEPT(rn)
FROM (
  SELECT *,
    ROW_NUMBER() OVER (
      PARTITION BY COALESCE(entity_id, event_id), event_type 
      ORDER BY 
        CASE WHEN JSON_VALUE(payload.title) NOT LIKE '%:%' AND JSON_VALUE(payload.title) IS NOT NULL THEN 1 ELSE 2 END,
        occurred_at DESC
    ) as rn
  FROM `portfolio-api-505006.events.continuum_home_watchlist`
)
WHERE rn = 1;

-- Deduplicate continuum_home_investments
CREATE OR REPLACE TABLE `portfolio-api-505006.events.continuum_home_investments` AS
SELECT * EXCEPT(rn)
FROM (
  SELECT *,
    ROW_NUMBER() OVER (
      PARTITION BY COALESCE(entity_id, event_id), event_type 
      ORDER BY 
        CASE WHEN JSON_VALUE(payload.name) NOT LIKE '%:%' AND JSON_VALUE(payload.name) IS NOT NULL THEN 1 ELSE 2 END,
        occurred_at DESC
    ) as rn
  FROM `portfolio-api-505006.events.continuum_home_investments`
)
WHERE rn = 1;
