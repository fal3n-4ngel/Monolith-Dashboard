import { CronExpressionParser } from "cron-parser";
import { load as loadYaml } from "js-yaml";
import { githubAuthHeaders, getRecentRepos } from "@/lib/github";

export interface ScheduledWorkflow {
  repo: string;
  workflowId: number;
  workflowName: string;
  path: string;
  htmlUrl: string;
  cronExpressions: string[];
  lastRun: {
    status: string;
    conclusion: string | null;
    ranAt: string;
    url: string;
  } | null;
  nextExpectedRun: string | null;
  isLate: boolean;
}

// GitHub's own `schedule` trigger is documented as best-effort and can run
// noticeably late (or get silently skipped) during periods of high platform
// load, especially on quiet repos. This grace window absorbs normal jitter
// so a workflow that's a few minutes behind isn't flagged as "late" —
// only ones GitHub visibly missed.
const LATE_GRACE_MS = 15 * 60 * 1000;

interface GithubWorkflowMeta {
  id: number;
  name: string;
  path: string;
  state: string;
  html_url: string;
}

async function listWorkflows(repo: string): Promise<GithubWorkflowMeta[]> {
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/actions/workflows?per_page=100`, {
      headers: githubAuthHeaders(),
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    const workflows = Array.isArray(data?.workflows) ? data.workflows : [];
    return workflows.filter((w: GithubWorkflowMeta) => w.state === "active");
  } catch {
    return [];
  }
}

// Extracts `on.schedule[].cron` from a workflow file's raw YAML. GitHub
// itself never exposes the parsed schedule via the REST API — only the
// workflow's metadata (id/name/path) — so the cron expression has to be
// read directly out of the file content.
async function getScheduleCrons(repo: string, path: string): Promise<string[]> {
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
      headers: githubAuthHeaders(),
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (typeof data?.content !== "string") return [];

    const decoded = Buffer.from(data.content, "base64").toString("utf-8");
    const parsed = loadYaml(decoded) as Record<string, unknown> | undefined;

    // YAML 1.1's core schema treats an unquoted `on` key as the boolean
    // `true` (a well-known GitHub Actions YAML gotcha) — defensive lookup
    // covers both, regardless of which schema the parser used.
    const onSection = (parsed?.on ?? parsed?.true) as { schedule?: Array<{ cron?: string }> } | undefined;
    const scheduleEntries = onSection?.schedule;
    if (!Array.isArray(scheduleEntries)) return [];

    return scheduleEntries.map((e) => e?.cron).filter((c): c is string => typeof c === "string");
  } catch {
    return [];
  }
}

async function getLastRun(repo: string, workflowId: number): Promise<ScheduledWorkflow["lastRun"]> {
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/actions/workflows/${workflowId}/runs?per_page=1`, {
      headers: githubAuthHeaders(),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    const run = data?.workflow_runs?.[0];
    if (!run) return null;
    return {
      status: run.status,
      conclusion: run.conclusion ?? null,
      ranAt: run.run_started_at || run.created_at,
      url: run.html_url,
    };
  } catch {
    return null;
  }
}

// Computes the most recent time the cron expression should have fired
// on/before `now`, and the next time it's due after `now`.
function computeExpectedRuns(cronExpr: string, now: Date): { prev: Date; next: Date } | null {
  try {
    const prevInterval = CronExpressionParser.parse(cronExpr, { currentDate: now });
    const prev = prevInterval.prev().toDate();
    const nextInterval = CronExpressionParser.parse(cronExpr, { currentDate: now });
    const next = nextInterval.next().toDate();
    return { prev, next };
  } catch {
    return null;
  }
}

export async function discoverScheduledWorkflows(repoCount = 5): Promise<ScheduledWorkflow[]> {
  const repos = await getRecentRepos(repoCount);
  const now = new Date();
  const results: ScheduledWorkflow[] = [];

  await Promise.all(
    repos.map(async (r) => {
      const repo = r.full_name;
      if (!repo) return;

      const workflows = await listWorkflows(repo);

      await Promise.all(
        workflows.map(async (wf) => {
          const crons = await getScheduleCrons(repo, wf.path);
          if (crons.length === 0) return;

          const lastRun = await getLastRun(repo, wf.id);

          // Use whichever cron entry is due soonest for the next/prev-expected
          // display when a workflow has multiple schedule entries.
          let nextExpectedRun: Date | null = null;
          let mostRecentExpected: Date | null = null;
          for (const cronExpr of crons) {
            const expected = computeExpectedRuns(cronExpr, now);
            if (!expected) continue;
            if (!nextExpectedRun || expected.next < nextExpectedRun) nextExpectedRun = expected.next;
            if (!mostRecentExpected || expected.prev > mostRecentExpected) mostRecentExpected = expected.prev;
          }

          const lastRunAt = lastRun ? new Date(lastRun.ranAt) : null;
          const isLate = Boolean(
            mostRecentExpected &&
              (!lastRunAt || lastRunAt.getTime() < mostRecentExpected.getTime() - LATE_GRACE_MS)
          );

          results.push({
            repo,
            workflowId: wf.id,
            workflowName: wf.name,
            path: wf.path,
            htmlUrl: wf.html_url,
            cronExpressions: crons,
            lastRun,
            nextExpectedRun: nextExpectedRun ? nextExpectedRun.toISOString() : null,
            isLate,
          });
        })
      );
    })
  );

  results.sort((a, b) => (a.nextExpectedRun || "").localeCompare(b.nextExpectedRun || ""));
  return results;
}
