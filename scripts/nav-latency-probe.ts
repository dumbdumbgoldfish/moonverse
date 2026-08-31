/**
 * Measures document + RSC prefetch latency for primary nav targets.
 * Run against dev (`:3000`) or prod (`PORT=3001 npm run start`).
 */
const BASE = process.env.NAV_PROBE_BASE ?? "http://localhost:3000";
const SAMPLES = Number(process.env.NAV_PROBE_SAMPLES ?? 5);
const TARGETS = ["/community", "/discover", "/browse", "/search?q=cultivation"];

async function timeFetch(
  path: string,
  headers: Record<string, string> = {}
): Promise<number> {
  const start = performance.now();
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      ...headers,
      cookie: process.env.NAV_PROBE_COOKIE ?? "",
    },
    redirect: "manual",
  });
  await res.text();
  return performance.now() - start;
}

async function samplePath(path: string) {
  const docTimes: number[] = [];
  const rscTimes: number[] = [];
  for (let i = 0; i < SAMPLES; i++) {
    docTimes.push(
      await timeFetch(path, {
        accept: "text/html,application/xhtml+xml",
      })
    );
    rscTimes.push(
      await timeFetch(path, {
        RSC: "1",
        "Next-Router-Prefetch": "1",
        "Next-Url": path.split("?")[0],
      })
    );
  }
  const avg = (values: number[]) =>
    values.reduce((sum, v) => sum + v, 0) / values.length;
  return {
    path,
    docMs: Math.round(avg(docTimes)),
    rscMs: Math.round(avg(rscTimes)),
  };
}

async function main() {
  const results = await Promise.all(TARGETS.map(samplePath));
  console.log(JSON.stringify({ base: BASE, samples: SAMPLES, results }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
