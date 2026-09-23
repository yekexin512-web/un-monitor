const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "../outputs/unmonitor-v2");
const mockAuth = `
  let user = { id: 'test-a', email: 'test@example.test' };
  let callback;
  let locked = false;
  window.testWrites = [];
  window.testFailReads = false;
  const records = new Map();
  window.testEmit = (next) => {
    user = next;
    locked = true;
    try {
      const result = callback(next ? 'SIGNED_IN' : 'SIGNED_OUT', next ? { user: next } : null);
      if (result && result.then) throw new Error('Async auth callback');
    } finally { locked = false; }
  };
  window.supabase = { createClient: () => ({
    auth: {
      onAuthStateChange: (fn) => { callback = fn; },
      getSession: async () => ({ data: { session: user ? { user } : null }, error: null }),
      signOut: async () => { window.testEmit(null); return { error: null }; },
    },
    from: () => {
      if (locked) throw new Error('Database request inside auth callback');
      const query = {
        select() { return this; },
        eq(key, value) { this.userId = value; return this; },
        order() { return this; }, range() { return this; }, abortSignal() { return this; },
        upsert(row) { this.row = row; return this; },
        then(resolve, reject) {
          if (this.row) {
            window.testWrites.push(this.row);
            records.set(this.row.job_id, this.row);
            return Promise.resolve({ error: null }).then(resolve, reject);
          }
          if (window.testFailReads) return Promise.resolve({ data: null, error: { message: 'Test offline' } }).then(resolve, reject);
          if (!records.size) {
            const row = { user_id: 'test-a', status: 'applied', applied_at: '2026-09-01' };
            const liveId = window.UN_MONITOR_LIVE_JOBS.jobs[0].id;
            records.set(liveId, { ...row, job_id: liveId, status: 'interview' });
            const statuses = ['applied', 'rejected', 'interview', 'ghosted', 'rejected_interview', 'offer'];
            window.UN_MONITOR_JOB_CATALOG.jobs
              .filter(job => job.id !== liveId && job.category)
              .slice(0, 25)
              .forEach((job, index) => records.set(job.id, { ...row, job_id: job.id, status: statuses[index % statuses.length] }));
          }
          return Promise.resolve({ data: [...records.values()].filter(r => r.user_id === this.userId), error: null }).then(resolve, reject);
        },
      };
      return query;
    },
  }) };
`;

const server = http.createServer((req, res) => {
  const relative = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  let file = path.resolve(root, "." + relative);
  if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
  if (!fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
  res.setHeader("Content-Type", ({ ".html": "text/html", ".js": "text/javascript", ".css": "text/css" })[path.extname(file)] || "application/octet-stream");
  res.end(fs.readFileSync(file));
});

(async () => {
  let browser;
  try {
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || "msedge", headless: true });
    fs.mkdirSync(path.resolve(__dirname, "../logs"), { recursive: true });
    for (const width of [1440, 1100, 390, 320]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 } });
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.route("https://cdn.jsdelivr.net/**", (route) => route.fulfill({ contentType: "text/javascript", body: mockAuth }));
      await page.route("https://*.supabase.co/**", () => { throw new Error("Test must not contact Supabase"); });
      await page.goto(`http://127.0.0.1:${server.address().port}/`);
      await page.waitForFunction(() => document.getElementById("sync-status").textContent === "Loaded 26 saved records.");
      assert.equal(await page.locator("#auth-status").innerText(), "test@example.test");
      assert.equal(await page.locator("#metric-applied-total").innerText(), "26");
      assert.equal(await page.locator('#status-filter option[value="saved"]').innerText(), "Saved");
      assert.equal(await page.locator('#detail-status option[value="saved"]').innerText(), "Saved");
      assert.equal(await page.evaluate(() => window.testWrites.length), 0);
      await page.locator('[data-view="dashboard"]').click();
      await page.locator('[data-range="30"]').click();
      const categories = await page.locator("#category-chart").innerText();
      assert.ok(categories.includes("Data & Analytics"));
      assert.ok(categories.includes("Economics & Development"));
      assert.ok(categories.includes("Communications & Advocacy"));
      assert.ok(!categories.includes("Unspecified"));
      const board = await page.locator("#kanban").innerText();
      assert.ok(!board.includes("Archived job"));
      assert.ok(!board.includes("Unknown organization"));
      const restoredApplications = await page.evaluate(() => state.jobs
        .filter(job => job.appliedAt || job.status !== "found")
        .map(job => ({ title: job.title, organization: job.organization, category: job.category })));
      assert.equal(restoredApplications.length, 26);
      assert.ok(restoredApplications.every(job => !job.title.startsWith("Archived job") && job.organization !== "Unknown organization" && job.category !== "Unspecified"));
      const pipeline = await page.locator("#pipeline-sankey").innerText();
      for (const label of ["Applied", "No reply", "Interview", "Ghosted", "Rejected", "Offer"]) {
        assert.ok(pipeline.includes(label), `Pipeline is missing ${label}`);
      }
      const chartBounds = await page.locator("#application-chart").evaluate((chart) => {
        const bounds = chart.getBoundingClientRect();
        return { width: chart.clientWidth, scrollWidth: chart.scrollWidth,
          overflow: [...chart.querySelectorAll(".bar-wrap, .bar-label")].flatMap((item) => {
            const box = item.getBoundingClientRect();
            return box.left < bounds.left - 1 || box.right > bounds.right + 1
              ? [{ text: item.textContent.trim(), left: box.left - bounds.left, right: box.right - bounds.left }] : [];
          }) };
      });
      assert.ok(chartBounds.scrollWidth <= chartBounds.width + 1 && !chartBounds.overflow.length,
        `30-day chart overflow at ${width}px: ${JSON.stringify(chartBounds)}`);
      const labelsOverlap = await page.locator("#application-chart").evaluate((chart) => {
        const labels = [...chart.querySelectorAll(".bar-label")]
          .filter((label) => label.textContent && getComputedStyle(label).visibility !== "hidden")
          .map((label) => {
            const range = document.createRange();
            range.selectNodeContents(label);
            return range.getBoundingClientRect();
          });
        return labels.some((label, index) => index > 0 && labels[index - 1].right + 2 > label.left);
      });
      assert.equal(labelsOverlap, false, `30-day date labels overlap at ${width}px`);
      const pipelineBounds = await page.locator("#pipeline-sankey svg").evaluate((svg) => {
        const box = svg.getBoundingClientRect();
        return [...svg.querySelectorAll("text")].every((text) => {
          const textBox = text.getBoundingClientRect();
          return textBox.left >= box.left - 1 && textBox.right <= box.right + 1 && textBox.top >= box.top - 1 && textBox.bottom <= box.bottom + 1;
        });
      });
      assert.ok(pipelineBounds, `Pipeline labels escape SVG at ${width}px`);
      await page.locator("#dashboard-view > .content-grid").screenshot({ path: path.resolve(__dirname, `../logs/history-charts-${width}.png`) });
      await page.locator("#pipeline-sankey").screenshot({ path: path.resolve(__dirname, `../logs/pipeline-${width}.png`) });
      await page.screenshot({ path: path.resolve(__dirname, `../logs/records-${width}.png`) });
      const accountBox = await page.locator("#auth-card").boundingBox();
      assert.ok(accountBox.x >= 0 && accountBox.x + accountBox.width <= width);
      await page.evaluate(() => { window.testFailReads = true; });
      await page.locator("#reload-records").click();
      await page.waitForFunction(() => document.getElementById("sync-status").textContent.includes("Test offline"));
      assert.equal(await page.locator("#metric-applied-total").innerText(), "26");
      await page.evaluate(() => { window.testFailReads = false; });
      await page.locator("#reload-records").click();
      await page.waitForFunction(() => document.getElementById("sync-status").textContent === "Loaded 26 saved records.");
      await page.locator('[data-view="opportunities"]').click();
      await page.evaluate(() => {
        const localToday = new Date();
        const year = localToday.getFullYear();
        const month = String(localToday.getMonth() + 1).padStart(2, "0");
        const day = String(localToday.getDate()).padStart(2, "0");
        state.jobs[0].deadline = `${year}-${month}-${day}`;
        renderAll();
      });
      await page.locator("#deadline-filter").selectOption("today");
      assert.ok(Number.parseInt(await page.locator("#job-count").innerText(), 10) >= 1);
      assert.ok((await page.locator("#job-list").innerText()).includes("Due today"));
      await page.locator("#deadline-filter").selectOption("all");
      await page.locator("#detail-status").selectOption("offer");
      await page.waitForFunction(() => document.getElementById("sync-status").textContent === "Saved to cloud");
      assert.equal(await page.evaluate(() => window.testWrites.length), 1);
      await page.locator("#sign-out").click();
      await page.waitForFunction(() => document.getElementById("auth-status").textContent === "Sign in for cloud dashboard");
      assert.equal(await page.locator("#metric-applied-total").innerText(), "0");
      assert.equal(await page.locator("#detail-status").isDisabled(), true);
      await page.evaluate(() => window.testEmit({ id: "test-b", email: "other@example.test" }));
      await page.waitForFunction(() => document.getElementById("sync-status").textContent === "No saved records found for this account.");
      assert.equal(await page.locator("#metric-applied-total").innerText(), "0");
      assert.deepEqual(errors, []);
      await page.close();
    }
    console.log("PASS: 25 historical applications, Due today, four viewport timelines, two-stage pipeline, login and account isolation.");
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
