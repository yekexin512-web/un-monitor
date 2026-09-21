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
            records.set('old-job', { ...row, job_id: 'old-job' });
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
    for (const width of [1440, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 } });
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.route("https://cdn.jsdelivr.net/**", (route) => route.fulfill({ contentType: "text/javascript", body: mockAuth }));
      await page.route("https://*.supabase.co/**", () => { throw new Error("Test must not contact Supabase"); });
      await page.goto(`http://127.0.0.1:${server.address().port}/`);
      await page.waitForFunction(() => document.getElementById("sync-status").textContent === "Loaded 2 saved records.");
      assert.equal(await page.locator("#auth-status").innerText(), "test@example.test");
      assert.equal(await page.locator("#metric-applied-total").innerText(), "2");
      assert.equal(await page.evaluate(() => window.testWrites.length), 0);
      await page.locator('[data-view="dashboard"]').click();
      await page.screenshot({ path: path.resolve(__dirname, `../logs/records-${width}.png`) });
      const accountBox = await page.locator("#auth-card").boundingBox();
      assert.ok(accountBox.x >= 0 && accountBox.x + accountBox.width <= width);
      await page.evaluate(() => { window.testFailReads = true; });
      await page.locator("#reload-records").click();
      await page.waitForFunction(() => document.getElementById("sync-status").textContent.includes("Test offline"));
      assert.equal(await page.locator("#metric-applied-total").innerText(), "2");
      await page.evaluate(() => { window.testFailReads = false; });
      await page.locator("#reload-records").click();
      await page.waitForFunction(() => document.getElementById("sync-status").textContent === "Loaded 2 saved records.");
      await page.locator('[data-view="opportunities"]').click();
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
    console.log("PASS: desktop/mobile login, archived records, read-only restore, save, retry, sign-out and account isolation.");
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
