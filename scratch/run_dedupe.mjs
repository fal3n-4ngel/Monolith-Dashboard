import { execSync } from "child_process";

console.log("🧹 DEDUPLICATING BIGQUERY DOMAIN TABLES WITH PARTITIONS & CLUSTERING...");

const queries = [
  {
    name: "continuum_home_expenses",
    sql: `CREATE OR REPLACE TABLE \`portfolio-api-505006.events.continuum_home_expenses\` PARTITION BY DATE(occurred_at) CLUSTER BY local_user_id, event_type AS SELECT * EXCEPT(rn) FROM (SELECT *, ROW_NUMBER() OVER (PARTITION BY COALESCE(entity_id, event_id), event_type ORDER BY CASE WHEN JSON_VALUE(payload.title) NOT LIKE '%:%' AND JSON_VALUE(payload.title) IS NOT NULL THEN 1 ELSE 2 END, occurred_at DESC) as rn FROM \`portfolio-api-505006.events.continuum_home_expenses\`) WHERE rn = 1;`
  },
  {
    name: "continuum_home_subscriptions",
    sql: `CREATE OR REPLACE TABLE \`portfolio-api-505006.events.continuum_home_subscriptions\` PARTITION BY DATE(occurred_at) CLUSTER BY local_user_id, event_type AS SELECT * EXCEPT(rn) FROM (SELECT *, ROW_NUMBER() OVER (PARTITION BY COALESCE(entity_id, event_id), event_type ORDER BY CASE WHEN JSON_VALUE(payload.name) NOT LIKE '%:%' AND JSON_VALUE(payload.name) IS NOT NULL THEN 1 ELSE 2 END, occurred_at DESC) as rn FROM \`portfolio-api-505006.events.continuum_home_subscriptions\`) WHERE rn = 1;`
  },
  {
    name: "continuum_home_watchlist",
    sql: `CREATE OR REPLACE TABLE \`portfolio-api-505006.events.continuum_home_watchlist\` PARTITION BY DATE(occurred_at) CLUSTER BY local_user_id, event_type AS SELECT * EXCEPT(rn) FROM (SELECT *, ROW_NUMBER() OVER (PARTITION BY COALESCE(entity_id, event_id), event_type ORDER BY CASE WHEN JSON_VALUE(payload.title) NOT LIKE '%:%' AND JSON_VALUE(payload.title) IS NOT NULL THEN 1 ELSE 2 END, occurred_at DESC) as rn FROM \`portfolio-api-505006.events.continuum_home_watchlist\`) WHERE rn = 1;`
  },
  {
    name: "continuum_home_investments",
    sql: `CREATE OR REPLACE TABLE \`portfolio-api-505006.events.continuum_home_investments\` PARTITION BY DATE(occurred_at) CLUSTER BY local_user_id, event_type AS SELECT * EXCEPT(rn) FROM (SELECT *, ROW_NUMBER() OVER (PARTITION BY COALESCE(entity_id, event_id), event_type ORDER BY CASE WHEN JSON_VALUE(payload.name) NOT LIKE '%:%' AND JSON_VALUE(payload.name) IS NOT NULL THEN 1 ELSE 2 END, occurred_at DESC) as rn FROM \`portfolio-api-505006.events.continuum_home_investments\`) WHERE rn = 1;`
  }
];

for (const q of queries) {
  console.log(`Deduplicating ${q.name}...`);
  try {
    const cmd = `bq query --use_legacy_sql=false ${JSON.stringify(q.sql)}`;
    execSync(cmd, { stdio: "inherit" });
    console.log(`✅ Deduplicated ${q.name} successfully.`);
  } catch (err) {
    console.error(`❌ Failed to deduplicate ${q.name}:`, err.message);
  }
}
