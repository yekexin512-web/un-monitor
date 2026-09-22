const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "../outputs/unmonitor-v2/app.js"), "utf8");
const definitions = source.slice(0, source.lastIndexOf("\nsetupNavigation();"));
const tick = () => new Promise((resolve) => setTimeout(resolve, 10));
const userA = { id: "user-a", email: "a@example.test" };
const userB = { id: "user-b", email: "b@example.test" };
const liveJob = { id: "live-1", title: "Live internship", source: "UN Careers", status: "found" };
const record = (jobId, status = "applied", user = userA) => ({
  user_id: user.id, job_id: jobId, status, applied_at: "2026-09-01",
  status_updated_at: "2026-09-01T12:00:00Z", first_tracked_at: "2026-09-01T12:00:00Z",
});

function storage(values = {}) {
  const items = new Map(Object.entries(values));
  return {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => items.set(key, value),
    removeItem: (key) => items.delete(key),
    key: (index) => [...items.keys()][index],
    get length() { return items.size; },
  };
}

function app(options = {}) {
  const elements = new Map();
  const reads = [];
  const writes = [];
  let callback;
  let locked = false;
  const client = {
    auth: {
      onAuthStateChange(fn) { callback = fn; },
      async getSession() { return { data: { session: options.user ? { user: options.user } : null }, error: null }; },
      async signOut() { assert.equal(locked, false, "signOut must be outside auth callback"); },
    },
    from(table) {
      assert.equal(locked, false, "database query must be outside auth callback");
      assert.equal(table, "user_applications");
      const query = {
        select() { return this; },
        eq(key, value) { assert.equal(key, "user_id"); this.userId = value; return this; },
        order(key) { assert.equal(key, "job_id"); return this; },
        range(from, to) { this.from = from; this.to = to; return this; },
        abortSignal(signal) { this.signal = signal; return this; },
        upsert(row) { this.row = row; return this; },
        then(resolve, reject) {
          if (this.row) {
            writes.push(this.row);
            return Promise.resolve({ error: options.writeError || null }).then(resolve, reject);
          }
          reads.push({ userId: this.userId, from: this.from, to: this.to });
          const response = options.read ? options.read(this) : {
            data: (options.records || []).filter((r) => r.user_id === this.userId).slice(this.from, this.to + 1),
            error: null,
          };
          return Promise.resolve(response).then(resolve, reject);
        },
      };
      return query;
    },
  };
  const localStorage = storage(options.storage);
  const context = vm.createContext({
    console, URL, URLSearchParams, AbortController, setTimeout, clearTimeout, localStorage,
    sessionStorage: storage(),
    window: {
      UN_MONITOR_SUPABASE: { url: "https://testproject.supabase.co", anonKey: "test-only" },
      UN_MONITOR_LIVE_JOBS: { jobs: [liveJob] },
      UN_MONITOR_JOB_CATALOG: { jobs: options.catalog || [] },
      supabase: options.noSdk ? undefined : { createClient: () => client },
      location: { hash: "", search: "", hostname: "localhost" },
    },
    document: {
      getElementById(id) {
        if (!elements.has(id)) elements.set(id, { textContent: "", hidden: false });
        return elements.get(id);
      },
    },
  });
  vm.runInContext(definitions, context);
  const run = (code) => vm.runInContext(code, context);
  run("renderAll = () => {}; hydrateProfile = () => {};");
  return {
    run, reads, writes, localStorage,
    status: () => elements.get("sync-status")?.textContent,
    jobs: () => JSON.parse(run("JSON.stringify(state.jobs)")),
    async start() { await run("initCloudSync()"); await tick(); },
    emit(user) {
      locked = true;
      try {
        const result = callback(user ? "SIGNED_IN" : "SIGNED_OUT", user ? { user } : null);
        assert.equal(result, undefined, "auth callback must not return a promise");
      } finally { locked = false; }
    },
  };
}

test("login reads records without uploading defaults and preserves missing jobs", async () => {
  const a = app({ user: userA, records: [record("live-1", "interview"), record("expired-1")] });
  await a.start();
  assert.equal(a.writes.length, 0);
  assert.equal(a.jobs().find((j) => j.id === "live-1").status, "interview");
  const archived = a.jobs().find((j) => j.id === "expired-1");
  assert.equal(archived.archived, true);
  assert.equal(archived.appliedAt, "2026-09-01");
  assert.equal(archived.url, "");
  assert.equal(a.status(), "Loaded 2 saved records.");
});

test("auth callback defers queries and switches users without leaking records", async () => {
  const a = app({ records: [record("live-1"), record("other-1", "offer", userB)] });
  await a.start();
  a.emit(userA);
  assert.equal(a.reads.length, 0);
  await tick();
  assert.equal(a.jobs()[0].status, "applied");
  a.emit(userB);
  assert.equal(a.jobs()[0].status, "found");
  await tick();
  assert.equal(a.jobs().filter((j) => j.status !== "found").length, 1);
  assert.equal(a.jobs().find((j) => j.id === "other-1").status, "offer");
  a.emit(null);
  assert.equal(a.jobs().length, 1);
  assert.equal(a.jobs()[0].status, "found");
  assert.equal(a.run("cloudApplicationsLoaded"), false);
});

test("legacy data stays untouched and hidden, even if the auth SDK fails", async () => {
  const legacy = JSON.stringify({ jobs: [{ ...liveJob, status: "offer" }] });
  const a = app({ noSdk: true, storage: {
    "unmonitor-v2-state": legacy,
    "unmonitor-v2-local-state": legacy,
  } });
  await a.start();
  a.run("saveState(); restoreSignedOutState();");
  assert.equal(a.jobs()[0].status, "found");
  assert.equal(a.localStorage.getItem("unmonitor-v2-state"), legacy);
  assert.equal(a.localStorage.getItem("unmonitor-v2-local-state"), legacy);
  assert.match(a.status(), /failed to load/);
});

test("failed reads do not announce success or replace the account backup", async () => {
  const key = "unmonitor-v2-account:testproject:user-a";
  const backup = JSON.stringify({ userId: userA.id, jobs: [{ ...liveJob, status: "offer" }] });
  const a = app({ user: userA, storage: { [key]: backup }, read: () => ({ data: null, error: { message: "Permission denied" } }) });
  await a.start();
  assert.match(a.status(), /Cloud load failed: Permission denied/);
  assert.equal(a.localStorage.getItem(key), backup);
  assert.equal(a.jobs()[0].status, "offer");
  assert.equal(a.run("canEditApplications()"), false);
  assert.equal(a.writes.length, 0);
});

test("delayed responses from a previous account cannot overwrite the active account", async () => {
  let resolveA;
  const pending = new Promise((resolve) => { resolveA = resolve; });
  const a = app({ user: userA, read: (q) => q.userId === userA.id ? pending : { data: [record("b-only", "offer", userB)], error: null } });
  await a.start();
  a.emit(userB);
  await tick();
  resolveA({ data: [record("a-only")], error: null });
  await tick();
  assert.equal(a.jobs().some((j) => j.id === "a-only"), false);
  assert.equal(a.jobs().find((j) => j.id === "b-only").status, "offer");
});

test("all records are loaded past Supabase's default 1000-row page", async () => {
  const a = app({ user: userA, records: Array.from({ length: 1001 }, (_, i) => record(`old-${i}`)) });
  await a.start();
  assert.equal(a.reads.length, 2);
  assert.equal(a.jobs().filter((j) => j.archived).length, 1001);
  assert.equal(a.status(), "Loaded 1001 saved records.");
});

test("cached metadata restores manual jobs while remote status remains authoritative", async () => {
  const backup = { userId: userA.id, jobs: [{ id: "manual-1", title: "My manual job", source: "Manual", status: "found" }] };
  const a = app({ user: userA, records: [record("manual-1", "interview")], storage: {
    "unmonitor-v2-account:testproject:user-a": JSON.stringify(backup),
  } });
  await a.start();
  const restored = a.jobs().find((j) => j.id === "manual-1");
  assert.equal(restored.title, "My manual job");
  assert.equal(restored.status, "interview");
  assert.equal(a.writes.length, 0);
});

test("failed saves keep the previous status and show a failure", async () => {
  const a = app({ user: userA, records: [record("live-1", "interview")], writeError: { message: "Offline" } });
  await a.start();
  await a.run('updateJobStatus("live-1", "offer")');
  assert.equal(a.jobs()[0].status, "interview");
  assert.match(a.status(), /Cloud sync failed: Offline/);
});

test("a saved session in a new tab still loads the same account", async () => {
  const a = app({ user: userA, records: [record("live-1")] });
  await a.start();
  assert.equal(a.run("currentUser.id"), userA.id);
  assert.equal(a.jobs()[0].status, "applied");
  assert.equal(a.run("cloudApplicationsLoaded"), true);
});

test("successful changes update both cloud and the account-specific backup", async () => {
  const a = app({ user: userA, records: [record("live-1", "interview")] });
  await a.start();
  await a.run('updateJobStatus("live-1", "offer")');
  assert.equal(a.writes.length, 1);
  assert.equal(a.writes[0].user_id, userA.id);
  assert.equal(a.jobs()[0].status, "offer");
  assert.equal(JSON.parse(a.localStorage.getItem("unmonitor-v2-account:testproject:user-a")).jobs[0].status, "offer");
});

test("historical metadata repairs placeholder caches and preserves cloud application fields", async () => {
  const a = app({ user: userA, records: [record("expired-1", "offer")],
    catalog: [{ id: "expired-1", title: "Historical internship", organization: "UN Careers", source: "UN Careers",
      category: "Data & Analytics", deadline: "2026-07-01", url: "https://careers.un.org/" }],
    storage: { "unmonitor-v2-account:testproject:user-a": JSON.stringify({ userId: userA.id,
      jobs: [{ id: "expired-1", title: "Archived job (expired-1)", source: "Archive", category: "Unspecified", status: "applied" }] }) },
  });
  await a.start();
  const restored = a.jobs().find((job) => job.id === "expired-1");
  assert.equal(restored.title, "Historical internship");
  assert.equal(restored.category, "Data & Analytics");
  assert.equal(restored.deadline, "2026-07-01");
  assert.equal(restored.status, "offer");
  assert.equal(restored.appliedAt, "2026-09-01");
  assert.equal(restored.archived, true);
  assert.equal(a.writes.length, 0);
});

test("history is only joined to the signed-in user's records, never added to public opportunities", async () => {
  const a = app({ catalog: [{ id: "old-job", title: "History only", source: "UN Careers" }] });
  await a.start();
  assert.equal(a.jobs().length, 1);
  assert.equal(a.jobs()[0].id, liveJob.id);
});

test("the live feed takes precedence over older catalog metadata", async () => {
  const a = app({ user: userA, records: [record("live-1")],
    catalog: [{ ...liveJob, title: "Old title" }],
  });
  await a.start();
  assert.equal(a.jobs()[0].title, liveJob.title);
  assert.equal(a.jobs()[0].archived, false);
});
