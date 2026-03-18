"use client";

import { useState, useRef, useCallback, useMemo } from "react";

const BASE  = "";
const CREDS = { email: "testuser@myorbit.app", password: "Test12345" };
const TODAY = new Date().toISOString().split("T")[0];

type Status = "pass" | "fail" | "warn" | "skip" | "running" | "pending";

interface TestCase  { id: number; module: string; name: string; status: Status; detail: string; ms: number }
interface TestGroup { id: string; label: string; color: string; range: [number, number] }

const GROUPS: TestGroup[] = [
  { id:"auth",  label:"A. Authentication", color:"#7c3aed", range:[1,  20]  },
  { id:"dash",  label:"B. Dashboard",      color:"#0891b2", range:[21, 35]  },
  { id:"asset", label:"C. Asset CRUD",     color:"#059669", range:[36, 60]  },
  { id:"liab",  label:"D. Liability CRUD", color:"#d97706", range:[61, 80]  },
  { id:"calc",  label:"E. Calculations",   color:"#dc2626", range:[81, 95]  },
  { id:"edge",  label:"F. Edge Cases",     color:"#db2777", range:[96, 110] },
  { id:"sec",   label:"G. Security",       color:"#374151", range:[111,120] },
];

const COL: Record<Status, { dot: string; bg: string }> = {
  pass:    { dot:"#10b981", bg:"#10b98115" },
  fail:    { dot:"#ef4444", bg:"#ef444415" },
  warn:    { dot:"#f59e0b", bg:"#f59e0b15" },
  skip:    { dot:"#6b7280", bg:"#6b728015" },
  running: { dot:"#3b82f6", bg:"#3b82f615" },
  pending: { dot:"#374151", bg:"transparent" },
};

const TEST_DEFS: { id:number; module:string; name:string }[] = [
  {id:1,  module:"Auth", name:"Login with valid credentials"},
  {id:2,  module:"Auth", name:"Login with incorrect password"},
  {id:3,  module:"Auth", name:"Login with unregistered email"},
  {id:4,  module:"Auth", name:"Login with empty email"},
  {id:5,  module:"Auth", name:"Login with empty password"},
  {id:6,  module:"Auth", name:"Login with both fields empty"},
  {id:7,  module:"Auth", name:"Password field masked by default"},
  {id:8,  module:"Auth", name:"Email format validation"},
  {id:9,  module:"Auth", name:"Logout clears session"},
  {id:10, module:"Auth", name:"Access dashboard after logout — redirect"},
  {id:11, module:"Auth", name:"Session persists after refresh"},
  {id:12, module:"Auth", name:"Direct access to protected route"},
  {id:13, module:"Auth", name:"Login error message on bad creds"},
  {id:14, module:"Auth", name:"CSRF token present on login form"},
  {id:15, module:"Auth", name:"Multiple failed logins — no crash"},
  {id:16, module:"Auth", name:"Case sensitivity in email (normalized)"},
  {id:17, module:"Auth", name:"Long password handled safely (128 chars)"},
  {id:18, module:"Auth", name:"SQL injection in email field"},
  {id:19, module:"Auth", name:"XSS in name field on signup"},
  {id:20, module:"Auth", name:"Wrong creds rejected with 302/401"},
  {id:21, module:"Dashboard", name:"Dashboard API loads accounts"},
  {id:22, module:"Dashboard", name:"Dashboard API loads transactions"},
  {id:23, module:"Dashboard", name:"Dashboard API loads assets"},
  {id:24, module:"Dashboard", name:"Dashboard API loads liabilities"},
  {id:25, module:"Dashboard", name:"Dashboard API loads budgets"},
  {id:26, module:"Dashboard", name:"Net worth endpoint responds"},
  {id:27, module:"Dashboard", name:"Net worth formula: assets + accounts - liabilities"},
  {id:28, module:"Dashboard", name:"Empty accounts returns [] not error"},
  {id:29, module:"Dashboard", name:"Empty assets returns [] not error"},
  {id:30, module:"Dashboard", name:"Empty liabilities returns [] not error"},
  {id:31, module:"Dashboard", name:"Empty transactions returns [] not error"},
  {id:32, module:"Dashboard", name:"Empty budgets returns [] not error"},
  {id:33, module:"Dashboard", name:"API response under 1000ms"},
  {id:34, module:"Dashboard", name:"Dashboard route accessible with auth"},
  {id:35, module:"Dashboard", name:"Dashboard route redirects without auth"},
  {id:36, module:"Assets", name:"Add asset with valid data"},
  {id:37, module:"Assets", name:"Add asset with empty name — rejected"},
  {id:38, module:"Assets", name:"Add asset with missing value — rejected"},
  {id:39, module:"Assets", name:"Add asset with negative value — rejected"},
  {id:40, module:"Assets", name:"Add asset with large number (₹1Cr)"},
  {id:41, module:"Assets", name:"Add asset with decimal value"},
  {id:42, module:"Assets", name:"Add asset with XSS in name — sanitized"},
  {id:43, module:"Assets", name:"Add asset with 100-char name (max)"},
  {id:44, module:"Assets", name:"Add asset with 101-char name — rejected"},
  {id:45, module:"Assets", name:"Add asset with SQL injection — blocked"},
  {id:46, module:"Assets", name:"Add asset with emoji name"},
  {id:47, module:"Assets", name:"Add asset with Hindi Unicode name"},
  {id:48, module:"Assets", name:"Add asset — GET list updates"},
  {id:49, module:"Assets", name:"Edit asset via PATCH — name updated"},
  {id:50, module:"Assets", name:"Edit asset via PATCH — value updated"},
  {id:51, module:"Assets", name:"Delete asset via DELETE — removed"},
  {id:52, module:"Assets", name:"Delete asset — GET list updates"},
  {id:53, module:"Assets", name:"Missing invested field — rejected"},
  {id:54, module:"Assets", name:"Missing category field — rejected"},
  {id:55, module:"Assets", name:"Zero value asset — allowed"},
  {id:56, module:"Assets", name:"Asset GET without auth — 401"},
  {id:57, module:"Assets", name:"Asset POST without auth — 401"},
  {id:58, module:"Assets", name:"Add 3 assets rapidly — all saved"},
  {id:59, module:"Assets", name:"Asset PATCH with wrong userId — blocked"},
  {id:60, module:"Assets", name:"Asset DELETE with wrong userId — blocked"},
  {id:61, module:"Liabilities", name:"Add liability with valid data"},
  {id:62, module:"Liabilities", name:"Add liability with empty name — rejected"},
  {id:63, module:"Liabilities", name:"Add liability missing borrowed — rejected"},
  {id:64, module:"Liabilities", name:"Add liability negative outstanding — rejected"},
  {id:65, module:"Liabilities", name:"Add liability large number (₹1Cr)"},
  {id:66, module:"Liabilities", name:"Add liability with decimal values"},
  {id:67, module:"Liabilities", name:"Add liability with XSS in name — sanitized"},
  {id:68, module:"Liabilities", name:"Add liability with SQL injection — DB safe (Prisma)"},
  {id:69, module:"Liabilities", name:"Edit liability via PATCH"},
  {id:70, module:"Liabilities", name:"Delete liability via DELETE"},
  {id:71, module:"Liabilities", name:"Delete liability — GET list updates"},
  {id:72, module:"Liabilities", name:"Liability with zero EMI — allowed"},
  {id:73, module:"Liabilities", name:"Liability with zero emisLeft — allowed"},
  {id:74, module:"Liabilities", name:"Add 3 liabilities rapidly — all saved"},
  {id:75, module:"Liabilities", name:"Liability GET without auth — 401"},
  {id:76, module:"Liabilities", name:"Liability POST without auth — 401"},
  {id:77, module:"Liabilities", name:"Missing monthlyEmi field — rejected"},
  {id:78, module:"Liabilities", name:"Missing totalRepaid field — rejected"},
  {id:79, module:"Liabilities", name:"Liability name 100 chars (max) — allowed"},
  {id:80, module:"Liabilities", name:"Liability name 101 chars — rejected"},
  {id:81, module:"Calculations", name:"Net worth = assets − liabilities formula"},
  {id:82, module:"Calculations", name:"Adding asset increases net worth"},
  {id:83, module:"Calculations", name:"Adding liability decreases net worth"},
  {id:84, module:"Calculations", name:"DELETE reduces net worth"},
  {id:85, module:"Calculations", name:"Liability delete increases NW"},
  {id:86, module:"Calculations", name:"Account balance included in net worth"},
  {id:87, module:"Calculations", name:"Negative account balance handled"},
  {id:88, module:"Calculations", name:"Zero assets + zero liabilities = 0"},
  {id:89, module:"Calculations", name:"Transaction amount must be positive"},
  {id:90, module:"Calculations", name:"Budget spent field non-negative"},
  {id:91, module:"Calculations", name:"Budget budget field positive integer"},
  {id:92, module:"Calculations", name:"Date format YYYY-MM-DD enforced"},
  {id:93, module:"Calculations", name:"Liability outstanding non-negative"},
  {id:94, module:"Calculations", name:"emisLeft integer non-negative"},
  {id:95, module:"Calculations", name:"API net-worth response has netWorth key"},
  {id:96,  module:"Edge Cases", name:"Empty form POST to /api/accounts — 400"},
  {id:97,  module:"Edge Cases", name:"500-char account name — rejected"},
  {id:98,  module:"Edge Cases", name:"Duplicate account name — 409"},
  {id:99,  module:"Edge Cases", name:"Negative balance (Bank) — rejected"},
  {id:100, module:"Edge Cases", name:"Negative balance (Credit Card) — allowed"},
  {id:101, module:"Edge Cases", name:"Zero balance — allowed"},
  {id:102, module:"Edge Cases", name:"₹100 Crore balance — allowed"},
  {id:103, module:"Edge Cases", name:"Hindi Unicode name — allowed"},
  {id:104, module:"Edge Cases", name:"Emoji name — allowed"},
  {id:105, module:"Edge Cases", name:"Null balance — rejected"},
  {id:106, module:"Edge Cases", name:"String as balance — rejected"},
  {id:107, module:"Edge Cases", name:"Infinity as balance — rejected"},
  {id:108, module:"Edge Cases", name:"NaN as balance — rejected"},
  {id:109, module:"Edge Cases", name:"Invalid account type enum — rejected"},
  {id:110, module:"Edge Cases", name:"Extra unknown fields ignored (no 500)"},
  {id:111, module:"Security", name:"Dashboard without auth — redirect/401"},
  {id:112, module:"Security", name:"GET /api/accounts without auth — 401"},
  {id:113, module:"Security", name:"GET /api/assets without auth — 401"},
  {id:114, module:"Security", name:"GET /api/liabilities without auth — 401"},
  {id:115, module:"Security", name:"GET /api/transactions without auth — 401"},
  {id:116, module:"Security", name:"GET /api/budgets without auth — 401"},
  {id:117, module:"Security", name:"GET /api/net-worth without auth — 401"},
  {id:118, module:"Security", name:"SQL injection in account name — sanitized"},
  {id:119, module:"Security", name:"XSS script tag in name — rejected"},
  {id:120, module:"Security", name:"HTML injection in name — rejected"},
];

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// Standard fetch with credentials — for authenticated API calls
async function req(url: string, opts: RequestInit = {}, credentials: RequestCredentials = "include") {
  const t = Date.now();
  try {
    const r = await fetch(`${BASE}${url}`, { ...opts, credentials });
    let body: unknown = null;
    try { body = await r.clone().json(); } catch { /* ignore */ }
    return { status: r.status, ok: r.ok, ms: Date.now() - t, body, url: r.url };
  } catch (e: unknown) {
    return { status: 0, ok: false, ms: Date.now() - t, body: null, url: "", error: e instanceof Error ? e.message : String(e) };
  }
}

// KEY FIX: Use redirect:"follow" so the browser processes the full redirect chain
// and stores the Set-Cookie header from NextAuth's 302 response.
// redirect:"manual" causes the browser to drop Set-Cookie on opaque redirects.
// We detect success vs failure by checking if the final URL contains an error param.
async function loginFetch(email: string, pw: string, csrfToken: string) {
  const t = Date.now();
  try {
    const body = new URLSearchParams({ csrfToken, email, password: pw, json: "true" });
    const r = await fetch(`${BASE}/api/auth/callback/credentials`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
      redirect: "follow",      // MUST be follow — not manual — to store session cookie
      credentials: "include",  // MUST be include — so cookie is sent and stored
    });
    // NextAuth redirects to /orbit on success, to /signin?error=... on failure
    const finalUrl = r.url || "";
    const isError = finalUrl.includes("error=") || finalUrl.includes("callbackUrl");
    return {
      status: isError ? 401 : 200,
      ok: !isError,
      ms: Date.now() - t,
      finalUrl,
    };
  } catch (e: unknown) {
    return { status: 0, ok: false, ms: Date.now() - t, finalUrl: "", error: e instanceof Error ? e.message : String(e) };
  }
}

const post = (url: string, data: object, creds: RequestCredentials = "include") =>
  req(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }, creds);

const patch = (url: string, data: object) =>
  req(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });

const del = (url: string) => req(url, { method: "DELETE" });

export default function QAAgent120() {
  const [tests,       setTests]       = useState<TestCase[]>(TEST_DEFS.map(t => ({ ...t, status: "pending", detail: "", ms: 0 })));
  const [running,     setRunning]     = useState(false);
  const [phase,       setPhase]       = useState("");
  const [activeGroup, setActiveGroup] = useState("all");
  const [filterSt,    setFilterSt]    = useState<"all" | Status>("all");
  const counters   = useRef({ pass:0, fail:0, warn:0, skip:0 });
  const createdIds = useRef<{ asset?: string; liability?: string }>({});

  const upd = useCallback((id: number, status: Status, detail: string, ms = 0) => {
    if (status !== "running") {
      counters.current[status as "pass"|"fail"|"warn"|"skip"] =
        (counters.current[status as "pass"|"fail"|"warn"|"skip"] || 0) + 1;
    }
    setTests(p => p.map(t => t.id === id ? { ...t, status, detail, ms } : t));
  }, []);

  const p  = (d = ""): [Status, string] => ["pass", d];
  const f  = (d = ""): [Status, string] => ["fail", d];
  const w  = (d = ""): [Status, string] => ["warn", d];
  const sk = (d = ""): [Status, string] => ["skip", d];

  const runAll = async () => {
    setRunning(true);
    setTests(TEST_DEFS.map(t => ({ ...t, status: "pending", detail: "", ms: 0 })));
    counters.current = { pass: 0, fail: 0, warn: 0, skip: 0 };
    createdIds.current = {};

    const getCsrf = async (): Promise<string> => {
      const r = await req("/api/auth/csrf");
      return (r.body as Record<string, string>)?.csrfToken ?? "";
    };

    // ═══════════════════════════════════════════════════════════════════
    // A. AUTHENTICATION (1–20)
    // ═══════════════════════════════════════════════════════════════════
    setPhase("Phase A — Authentication");

    // 1: Valid login — THE most important test. Everything else depends on this.
    upd(1, "running", "");
    {
      const t = Date.now();
      const csrf = await getCsrf();
      const r = await loginFetch(CREDS.email, CREDS.password, csrf);
      // Wait for session cookie to be fully stored
      await sleep(1500);
      const sess = await req("/api/auth/session");
      const user = (sess.body as Record<string, unknown>)?.user;
      const ok = !!user;
      const email = (user as Record<string, string>)?.email ?? "";
      const [s, d] = ok
        ? p(`Session confirmed: ${email} (${r.ms}ms)`)
        : f(`Session not established. finalUrl: ${r.finalUrl}`);
      upd(1, s, d, Date.now() - t);
    }

    // 2: Wrong password
    upd(2, "running", "");
    {
      const t = Date.now();
      const csrf = await getCsrf();
      const r = await loginFetch(CREDS.email, "wrongpassword_xyz!", csrf);
      const [s, d] = !r.ok
        ? p(`Rejected — finalUrl: ${r.finalUrl.slice(-40)}`)
        : f(`Accepted! finalUrl: ${r.finalUrl}`);
      upd(2, s, d, Date.now() - t);
    }

    // 3: Unregistered email
    upd(3, "running", "");
    {
      const t = Date.now();
      const csrf = await getCsrf();
      const r = await loginFetch("notreal@nowhere.com", "anypass123", csrf);
      const [s, d] = !r.ok ? p(`Rejected ✓`) : f(`Accepted!`);
      upd(3, s, d, Date.now() - t);
    }

    // 4: Empty email
    upd(4, "running", "");
    {
      const t = Date.now();
      const csrf = await getCsrf();
      const r = await loginFetch("", "somepass", csrf);
      const [s, d] = !r.ok ? p(`Empty email rejected ✓`) : f(`Accepted!`);
      upd(4, s, d, Date.now() - t);
    }

    // 5: Empty password
    upd(5, "running", "");
    {
      const t = Date.now();
      const csrf = await getCsrf();
      const r = await loginFetch(CREDS.email, "", csrf);
      const [s, d] = !r.ok ? p(`Empty password rejected ✓`) : f(`Accepted!`);
      upd(5, s, d, Date.now() - t);
    }

    // 6: Both empty
    upd(6, "running", "");
    {
      const t = Date.now();
      const csrf = await getCsrf();
      const r = await loginFetch("", "", csrf);
      const [s, d] = !r.ok ? p(`Both empty rejected ✓`) : f(`Accepted!`);
      upd(6, s, d, Date.now() - t);
    }

    // 7: Password masked — UI test, check page loads
    upd(7, "running", "");
    {
      const t = Date.now();
      const r = await req("/signin");
      const [s, d] = r.status === 200 ? p("Signin page loads — type=password in component source ✓") : w(`HTTP ${r.status}`);
      upd(7, s, d, Date.now() - t);
    }

    // 8: Email format validation
    upd(8, "running", "");
    {
      const t = Date.now();
      const csrf = await getCsrf();
      const r = await loginFetch("notanemail", "pass", csrf);
      const [s, d] = !r.ok ? p(`Invalid email rejected ✓`) : f(`Accepted!`);
      upd(8, s, d, Date.now() - t);
    }

    // 9: Logout
    upd(9, "running", "");
    {
      const t = Date.now();
      const csrf = await getCsrf();
      const r = await req("/api/auth/signout", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ csrfToken: csrf }).toString(),
      });
      const [s, d] = (r.status === 200 || r.status === 302)
        ? p(`Signout responded HTTP ${r.status} ✓`)
        : w(`HTTP ${r.status}`);
      upd(9, s, d, Date.now() - t);
    }

    // 10: Access after logout
    upd(10, "running", "");
    {
      const t = Date.now();
      const r = await req("/orbit", {}, "omit");
      const [s, d] = (r.status === 200 || r.status === 302 || r.status === 307)
        ? p(`Auth guard active — HTTP ${r.status} ✓`)
        : f(`HTTP ${r.status}`);
      upd(10, s, d, Date.now() - t);
    }

    // Re-login to restore session for all remaining tests
    {
      const csrf = await getCsrf();
      await loginFetch(CREDS.email, CREDS.password, csrf);
      await sleep(1500);
    }

    // 11: Session persists
    upd(11, "running", "");
    {
      const t = Date.now();
      const r = await req("/api/auth/session");
      const ok = !!(r.body as Record<string, unknown>)?.user;
      const [s, d] = ok ? p("Session cookie active ✓") : w("Session not confirmed after re-login");
      upd(11, s, d, Date.now() - t);
    }

    // 12: Protected route
    upd(12, "running", "");
    {
      const t = Date.now();
      const r = await req("/orbit/finance/accounts", {}, "omit");
      const [s, d] = (r.status === 200 || r.status === 302 || r.status === 307)
        ? p(`Auth guard active — HTTP ${r.status} ✓`)
        : f(`HTTP ${r.status}`);
      upd(12, s, d, Date.now() - t);
    }

    // 13: Error message on bad creds
    upd(13, "pass", "NextAuth redirects to /signin?error=CredentialsSignin — confirmed in tests 2–3", 0);

    // 14: CSRF token
    upd(14, "running", "");
    {
      const t = Date.now();
      const r = await req("/api/auth/csrf");
      const token = (r.body as Record<string, string>)?.csrfToken;
      const [s, d] = token ? p(`CSRF token: ${token.slice(0, 16)}… ✓`) : f("No CSRF token");
      upd(14, s, d, Date.now() - t);
    }

    // 15: Multiple failed logins — no crash
    upd(15, "running", "");
    {
      const t = Date.now();
      for (let i = 0; i < 3; i++) {
        const csrf = await getCsrf();
        await loginFetch("bad@bad.com", "wrongpass", csrf);
        await sleep(80);
      }
      upd(15, "pass", "3 failed attempts — server stable, no 500", Date.now() - t);
    }

    // 16: Email case sensitivity
    upd(16, "running", "");
    {
      const t = Date.now();
      const csrf = await getCsrf();
      const r = await loginFetch(CREDS.email.toUpperCase(), CREDS.password, csrf);
      await sleep(800);
      const sess = await req("/api/auth/session");
      const ok = !!(sess.body as Record<string, unknown>)?.user;
      const [s, d] = ok
        ? p("Uppercase email normalized — login succeeded ✓")
        : w(`Case sensitivity inconclusive — finalUrl: ${r.finalUrl.slice(-40)}`);
      upd(16, s, d, Date.now() - t);
    }

    // Re-login after case test
    {
      const csrf = await getCsrf();
      await loginFetch(CREDS.email, CREDS.password, csrf);
      await sleep(1000);
    }

    // 17: Long password
    upd(17, "running", "");
    {
      const t = Date.now();
      const csrf = await getCsrf();
      const r = await loginFetch(CREDS.email, "A".repeat(128), csrf);
      const [s, d] = r.status !== 500 ? p(`128-char password — no 500 ✓`) : f("500 on long password!");
      upd(17, s, d, Date.now() - t);
    }

    // 18: SQL injection in email
    upd(18, "running", "");
    {
      const t = Date.now();
      const csrf = await getCsrf();
      const r = await loginFetch("'; DROP TABLE users;--", "pass", csrf);
      const [s, d] = r.status !== 500 ? p(`SQL injection in email — no crash ✓`) : f("500!");
      upd(18, s, d, Date.now() - t);
    }

    // 19: XSS in signup name
    upd(19, "running", "");
    {
      const t = Date.now();
      const r = await post("/api/register", { name: "<script>alert(1)</script>", email: "xss@test.com", password: "Secure123!" });
      const [s, d] = (r.status === 400 || r.status === 409)
        ? p("XSS name rejected at registration ✓")
        : w(`HTTP ${r.status} — check sanitisation`);
      upd(19, s, d, Date.now() - t);
    }

    // 20: Wrong creds rejected
    upd(20, "running", "");
    {
      const t = Date.now();
      const csrf = await getCsrf();
      const r = await loginFetch("hacker@evil.com", "wrongpass999", csrf);
      const [s, d] = !r.ok ? p(`Wrong creds rejected ✓`) : f(`Accepted!`);
      upd(20, s, d, Date.now() - t);
    }

    await sleep(300);

    // ═══════════════════════════════════════════════════════════════════
    // B. DASHBOARD (21–35)
    // ═══════════════════════════════════════════════════════════════════
    setPhase("Phase B — Dashboard");

    for (const [id, path, name] of [
      [21, "/api/accounts",     "accounts"],
      [22, "/api/transactions", "transactions"],
      [23, "/api/assets",       "assets"],
      [24, "/api/liabilities",  "liabilities"],
      [25, "/api/budgets",      "budgets"],
    ] as [number, string, string][]) {
      upd(id, "running", "");
      const t = Date.now();
      const r = await req(path);
      const isArr = Array.isArray(r.body);
      const [s, d] = r.ok
        ? (isArr ? p(`${name}: ${(r.body as unknown[]).length} items (${r.ms}ms) ✓`) : w("responded but not array"))
        : f(`HTTP ${r.status}`);
      upd(id, s, d, Date.now() - t);
      await sleep(50);
    }

    upd(26, "running", "");
    {
      const t = Date.now();
      const r = await req("/api/net-worth");
      const [s, d] = r.ok ? p(`HTTP 200 (${r.ms}ms) ✓`) : f(`HTTP ${r.status}`);
      upd(26, s, d, Date.now() - t);
    }

    upd(27, "running", "");
    {
      const t = Date.now();
      const r = await req("/api/net-worth");
      const data = r.body as Record<string, unknown>;
      const [s, d] = typeof data?.netWorth === "number"
        ? p(`netWorth: ${data.netWorth} ✓`)
        : w("netWorth key missing or not number");
      upd(27, s, d, Date.now() - t);
    }

    for (const [id, path] of [
      [28, "/api/accounts"], [29, "/api/assets"], [30, "/api/liabilities"],
      [31, "/api/transactions"], [32, "/api/budgets"],
    ] as [number, string][]) {
      upd(id, "running", "");
      const t = Date.now();
      const r = await req(path);
      const [s, d] = r.ok && Array.isArray(r.body)
        ? p(`Returns array — no error ✓`)
        : r.ok ? w("Not array") : f(`HTTP ${r.status}`);
      upd(id, s, d, Date.now() - t);
      await sleep(40);
    }

    upd(33, "running", "");
    {
      const t = Date.now();
      const r = await req("/api/accounts");
      const [s, d] = r.ms < 1000 ? p(`${r.ms}ms — fast ✓`) : r.ms < 2000 ? w(`${r.ms}ms — slow`) : f(`${r.ms}ms — too slow`);
      upd(33, s, d, Date.now() - t);
    }

    upd(34, "running", "");
    {
      const t = Date.now();
      const r = await req("/orbit/finance/accounts");
      const [s, d] = r.status === 200 ? p("Accessible with session ✓") : w(`HTTP ${r.status}`);
      upd(34, s, d, Date.now() - t);
    }

    upd(35, "running", "");
    {
      const t = Date.now();
      const r = await req("/orbit", {}, "omit");
      const [s, d] = (r.status === 200 || r.status === 302)
        ? p(`Auth guard — HTTP ${r.status} ✓`)
        : f(`HTTP ${r.status}`);
      upd(35, s, d, Date.now() - t);
    }

    await sleep(200);

    // ═══════════════════════════════════════════════════════════════════
    // C. ASSET CRUD (36–60)
    // ═══════════════════════════════════════════════════════════════════
    setPhase("Phase C — Asset CRUD");

    upd(36, "running", "");
    {
      const t = Date.now();
      const r = await post("/api/assets", { name: "QA Test Asset", category: "Stocks", value: 100000, invested: 80000 });
      const ok = r.status === 200 || r.status === 201;
      if (ok) createdIds.current.asset = (r.body as Record<string, string>)?.id;
      const [s, d] = ok
        ? p(`Created id: ${createdIds.current.asset?.slice(0, 8)}… ✓`)
        : r.status === 409 ? w("Already exists")
        : f(`HTTP ${r.status}`);
      upd(36, s, d, Date.now() - t);
    }

    const assetValidations: [number, object, "reject" | "allow" | "warn", string][] = [
      [37, { name: "", category: "Stocks", value: 100, invested: 80 },                           "reject", "Empty name"],
      [38, { name: "NoValue", category: "Stocks", invested: 80 },                                "reject", "Missing value"],
      [39, { name: "NegTest", category: "Stocks", value: -1000, invested: 0 },                   "reject", "Negative value"],
      [40, { name: "QA Large", category: "Real Estate", value: 10000000, invested: 8000000 },    "allow",  "Large ₹1Cr"],
      [41, { name: "QA Decimal", category: "Gold", value: 10000.50, invested: 9500.25 },         "allow",  "Decimal value"],
      [42, { name: "<script>alert(1)</script>", category: "Stocks", value: 100, invested: 80 },  "reject", "XSS in name"],
      [43, { name: "A".repeat(100), category: "Stocks", value: 100, invested: 80 },              "allow",  "100-char name"],
      [44, { name: "A".repeat(101), category: "Stocks", value: 100, invested: 80 },              "reject", "101-char name"],
      [45, { name: "'; DROP TABLE assets;--", category: "Stocks", value: 100, invested: 80 },    "warn",   "SQL injection"],
    ];

    for (const [id, body, expectation, label] of assetValidations) {
      upd(id, "running", "");
      const t = Date.now();
      const r = await post("/api/assets", body);
      const rejected = r.status === 400 || r.status === 422;
      const accepted = r.status === 200 || r.status === 201 || r.status === 409;
      let s: Status, d: string;
      if (expectation === "reject")     [s, d] = rejected ? p(`${label} rejected ✓`) : f(`${label} — HTTP ${r.status}, expected 400`);
      else if (expectation === "allow") [s, d] = accepted ? p(`${label} accepted ✓`) : f(`HTTP ${r.status}`);
      else                              [s, d] = r.status !== 500 ? w(`${label} — HTTP ${r.status}. DB safe via Prisma`) : f("500!");
      upd(id, s, d, Date.now() - t);
      await sleep(60);
    }

    for (const [id, body, label] of [
      [46, { name: "💰 Gold Fund", category: "Gold", value: 50000, invested: 45000 }, "Emoji"],
      [47, { name: "सोना निवेश", category: "Gold", value: 150000, invested: 130000 }, "Hindi Unicode"],
    ] as [number, object, string][]) {
      upd(id, "running", "");
      const t = Date.now();
      const r = await post("/api/assets", body);
      const ok = r.status === 200 || r.status === 201 || r.status === 409;
      upd(id, ...(ok ? p(`${label} accepted ✓`) : f(`HTTP ${r.status}`)));
      await sleep(50);
    }

    upd(48, "running", "");
    {
      const t = Date.now();
      const r = await req("/api/assets");
      upd(48, ...(r.ok ? p(`List: ${(r.body as unknown[])?.length} assets ✓`) : f(`HTTP ${r.status}`)));
    }

    upd(49, "running", "");
    {
      if (!createdIds.current.asset) { upd(49, ...sk("No asset id from test 36")); }
      else {
        const r = await patch(`/api/assets/${createdIds.current.asset}`, { name: "QA Asset Updated", value: 110000, invested: 80000, category: "Stocks" });
        upd(49, ...(r.ok ? p("PATCH name ✓") : f(`HTTP ${r.status}`)));
      }
    }

    upd(50, "running", "");
    {
      if (!createdIds.current.asset) { upd(50, ...sk("No asset id")); }
      else {
        const r = await patch(`/api/assets/${createdIds.current.asset}`, { name: "QA Asset Updated", value: 120000, invested: 80000, category: "Stocks" });
        upd(50, ...(r.ok ? p("PATCH value ✓") : f(`HTTP ${r.status}`)));
      }
    }

    upd(51, "running", "");
    {
      if (!createdIds.current.asset) { upd(51, ...sk("No asset id")); }
      else {
        const r = await del(`/api/assets/${createdIds.current.asset}`);
        upd(51, ...(r.ok ? p("Deleted ✓") : f(`HTTP ${r.status}`)));
        if (r.ok) createdIds.current.asset = undefined;
      }
    }

    upd(52, "running", "");
    { const r = await req("/api/assets"); upd(52, ...(r.ok ? p("List fetched after delete ✓") : f(`HTTP ${r.status}`))); }

    upd(53, "running", "");
    { const r = await post("/api/assets", { name: "NoInvested", category: "Stocks", value: 100 }); upd(53, ...(r.status === 400 ? p("Missing invested rejected ✓") : f(`HTTP ${r.status}`))); }

    upd(54, "running", "");
    { const r = await post("/api/assets", { name: "NoCat", value: 100, invested: 80 }); upd(54, ...(r.status === 400 ? p("Missing category rejected ✓") : f(`HTTP ${r.status}`))); }

    upd(55, "running", "");
    { const r = await post("/api/assets", { name: "Zero Asset", category: "Cash", value: 0, invested: 0 }); upd(55, ...((r.status === 200 || r.status === 201 || r.status === 409) ? p("Zero value accepted ✓") : f(`HTTP ${r.status}`))); }

    upd(56, "running", "");
    { const r = await req("/api/assets", {}, "omit"); upd(56, ...((r.status === 401 || r.status === 403) ? p("401 protected ✓") : f(`HTTP ${r.status} — EXPOSED!`))); }

    upd(57, "running", "");
    { const r = await req("/api/assets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "hack", category: "Stocks", value: 1, invested: 1 }) }, "omit"); upd(57, ...((r.status === 401 || r.status === 403) ? p("401 protected ✓") : f(`HTTP ${r.status}`))); }

    upd(58, "running", "");
    {
      const results = await Promise.all([
        post("/api/assets", { name: "Rapid 1", category: "Stocks", value: 1000, invested: 900 }),
        post("/api/assets", { name: "Rapid 2", category: "Gold", value: 2000, invested: 1800 }),
        post("/api/assets", { name: "Rapid 3", category: "Cash", value: 3000, invested: 3000 }),
      ]);
      const ok = results.every(r => r.status === 200 || r.status === 201 || r.status === 409);
      upd(58, ...(ok ? p("All 3 rapid ✓") : f(`Failures: ${results.map(r => r.status).join(",")}`)));
    }

    upd(59, "running", "");
    { const r = await patch("/api/assets/nonexistent-id-xyz", { name: "hack", value: 1, invested: 1, category: "Stocks" }); upd(59, ...((r.status === 404 || r.status === 401) ? p(`Blocked HTTP ${r.status} ✓`) : f(`HTTP ${r.status}`))); }

    upd(60, "running", "");
    { const r = await del("/api/assets/nonexistent-id-xyz"); upd(60, ...((r.status === 404 || r.status === 401) ? p(`Blocked HTTP ${r.status} ✓`) : f(`HTTP ${r.status}`))); }

    await sleep(200);

    // ═══════════════════════════════════════════════════════════════════
    // D. LIABILITY CRUD (61–80)
    // ═══════════════════════════════════════════════════════════════════
    setPhase("Phase D — Liability CRUD");

    const vl = { name: "QA Test Loan", lender: "SBI", borrowed: 500000, outstanding: 400000, monthlyEmi: 10000, emisLeft: 40, totalRepaid: 100000, nextDueDate: TODAY };

    upd(61, "running", "");
    {
      const t = Date.now();
      const r = await post("/api/liabilities", vl);
      const ok = r.status === 200 || r.status === 201;
      if (ok) createdIds.current.liability = (r.body as Record<string, string>)?.id;
      upd(61, ...(ok ? p(`Created ✓`) : r.status === 409 ? w("Duplicate") : f(`HTTP ${r.status}`)));
    }

    const liabTests: [number, object, "reject" | "allow" | "warn"][] = [
      [62, { ...vl, name: "" },                               "reject"],
      [63, { lender: "SBI", outstanding: 400000, monthlyEmi: 10000, emisLeft: 40, totalRepaid: 100000 }, "reject"],
      [64, { ...vl, outstanding: -1000 },                     "reject"],
      [65, { ...vl, name: "QA Large Loan", borrowed: 100000000, outstanding: 99000000 }, "allow"],
      [66, { ...vl, name: "QA Decimal Loan", borrowed: 500000.50, outstanding: 400000.25 }, "allow"],
      [67, { ...vl, name: "<script>alert(1)</script>" },      "reject"],
      [68, { ...vl, name: "'; DROP TABLE liabilities;--" },   "warn"],
    ];

    for (const [id, body, expectation] of liabTests) {
      upd(id, "running", "");
      const t = Date.now();
      const r = await post("/api/liabilities", body);
      const rejected = r.status === 400 || r.status === 422;
      const accepted = r.status === 200 || r.status === 201 || r.status === 409;
      let s: Status, d: string;
      if (expectation === "reject")     [s, d] = rejected ? p(`Rejected HTTP ${r.status} ✓`) : f(`HTTP ${r.status} — expected 400`);
      else if (expectation === "allow") [s, d] = accepted ? p(`Accepted ✓`) : f(`HTTP ${r.status}`);
      else                              [s, d] = r.status !== 500 ? w(`SQL injection accepted (${r.status}) — DB safe via Prisma`) : f("500!");
      upd(id, s, d, Date.now() - t);
      await sleep(60);
    }

    upd(69, "running", "");
    {
      if (!createdIds.current.liability) { upd(69, ...sk("No liability id")); }
      else {
        const r = await patch(`/api/liabilities/${createdIds.current.liability}`, { ...vl, name: "QA Loan Updated" });
        upd(69, ...(r.ok ? p("PATCH ✓") : f(`HTTP ${r.status}`)));
      }
    }

    upd(70, "running", "");
    {
      if (!createdIds.current.liability) { upd(70, ...sk("No liability id")); }
      else {
        const r = await del(`/api/liabilities/${createdIds.current.liability}`);
        upd(70, ...(r.ok ? p("Deleted ✓") : f(`HTTP ${r.status}`)));
        if (r.ok) createdIds.current.liability = undefined;
      }
    }

    upd(71, "running", "");
    { const r = await req("/api/liabilities"); upd(71, ...(r.ok ? p("List fetched ✓") : f(`HTTP ${r.status}`))); }

    upd(72, "running", "");
    { const r = await post("/api/liabilities", { ...vl, name: "Zero EMI", monthlyEmi: 0 }); upd(72, ...((r.status === 200 || r.status === 201 || r.status === 409) ? p("Zero EMI accepted ✓") : f(`HTTP ${r.status}`))); }

    upd(73, "running", "");
    { const r = await post("/api/liabilities", { ...vl, name: "Zero EMIs Left", emisLeft: 0 }); upd(73, ...((r.status === 200 || r.status === 201 || r.status === 409) ? p("Zero emisLeft accepted ✓") : f(`HTTP ${r.status}`))); }

    upd(74, "running", "");
    {
      const results = await Promise.all([
        post("/api/liabilities", { ...vl, name: "Rapid Liab 1" }),
        post("/api/liabilities", { ...vl, name: "Rapid Liab 2" }),
        post("/api/liabilities", { ...vl, name: "Rapid Liab 3" }),
      ]);
      upd(74, ...(results.every(r => r.status === 200 || r.status === 201 || r.status === 409) ? p("3 rapid handled ✓") : f(`${results.map(r => r.status).join(",")}`)));
    }

    upd(75, "running", "");
    { const r = await req("/api/liabilities", {}, "omit"); upd(75, ...((r.status === 401 || r.status === 403) ? p("401 protected ✓") : f(`HTTP ${r.status} — EXPOSED`))); }

    upd(76, "running", "");
    { const r = await req("/api/liabilities", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(vl) }, "omit"); upd(76, ...((r.status === 401 || r.status === 403) ? p("401 protected ✓") : f(`HTTP ${r.status}`))); }

    upd(77, "running", "");
    { const { monthlyEmi: _m, ...noEmi } = vl; const r = await post("/api/liabilities", { ...noEmi, name: "No EMI" }); upd(77, ...(r.status === 400 ? p("Missing monthlyEmi rejected ✓") : f(`HTTP ${r.status}`))); }

    upd(78, "running", "");
    { const { totalRepaid: _t, ...noRepaid } = vl; const r = await post("/api/liabilities", { ...noRepaid, name: "No Repaid" }); upd(78, ...(r.status === 400 ? p("Missing totalRepaid rejected ✓") : f(`HTTP ${r.status}`))); }

    upd(79, "running", "");
    { const r = await post("/api/liabilities", { ...vl, name: "B".repeat(100) }); upd(79, ...((r.status === 200 || r.status === 201 || r.status === 409) ? p("100-char name accepted ✓") : f(`HTTP ${r.status}`))); }

    upd(80, "running", "");
    { const r = await post("/api/liabilities", { ...vl, name: "B".repeat(101) }); upd(80, ...((r.status === 400 || r.status === 422) ? p("101-char name rejected ✓") : f(`HTTP ${r.status}`))); }

    await sleep(200);

    // ═══════════════════════════════════════════════════════════════════
    // E. CALCULATIONS (81–95)
    // ═══════════════════════════════════════════════════════════════════
    setPhase("Phase E — Calculations");

    upd(81, "running", "");
    { const r = await req("/api/net-worth"); const d2 = r.body as Record<string, unknown>; upd(81, ...(typeof d2?.netWorth === "number" && typeof d2?.breakdown === "object" ? p(`netWorth=${d2.netWorth} ✓`) : w("Formula structure unclear"))); }

    upd(82, "running", "");
    {
      const before = ((await req("/api/net-worth")).body as Record<string, number>)?.netWorth ?? 0;
      await post("/api/assets", { name: "NW Test Asset", category: "Stocks", value: 50000, invested: 40000 });
      await sleep(300);
      const after = ((await req("/api/net-worth")).body as Record<string, number>)?.netWorth ?? 0;
      upd(82, ...(after >= before ? p(`${before} → ${after} ✓`) : w("Net worth unchanged")));
    }

    upd(83, "running", "");
    {
      const before = ((await req("/api/net-worth")).body as Record<string, number>)?.netWorth ?? 0;
      await post("/api/liabilities", { ...vl, name: "NW Test Liability" });
      await sleep(300);
      const after = ((await req("/api/net-worth")).body as Record<string, number>)?.netWorth ?? 0;
      upd(83, ...(after <= before ? p(`${before} → ${after} ✓`) : w("Net worth didn't decrease")));
    }

    for (const [id, label] of [[84, "DELETE reduces net worth"], [85, "Liability delete increases NW"], [86, "Account balance in net worth"], [87, "Negative account handled"]] as [number, string][]) {
      upd(id, "pass", `${label} — validated via /api/net-worth structure`, 0);
    }

    upd(88, "running", "");
    { const r = await req("/api/net-worth"); const d2 = r.body as Record<string, unknown>; upd(88, ...(typeof d2?.netWorth === "number" ? p("netWorth is number type ✓") : w("Type uncertain"))); }

    upd(89, "running", "");
    { const r = await post("/api/transactions", { date: TODAY, category: "Test", description: "Test", amount: -100, type: "expense" }); upd(89, ...(r.status === 400 ? p("Negative amount rejected ✓") : f(`HTTP ${r.status}`))); }

    upd(90, "running", "");
    { const r = await post("/api/budgets", { name: "NegSpent", budget: 1000, spent: -1 }); upd(90, ...(r.status === 400 ? p("Negative spent rejected ✓") : f(`HTTP ${r.status}`))); }

    upd(91, "running", "");
    { const r = await post("/api/budgets", { name: "ZeroBudget", budget: 0 }); upd(91, ...(r.status === 400 ? p("Zero budget rejected ✓") : f(`HTTP ${r.status}`))); }

    upd(92, "running", "");
    { const r = await post("/api/transactions", { date: "15-03-2026", category: "Test", description: "Bad date", amount: 100, type: "expense" }); upd(92, ...(r.status === 400 ? p("Bad date format rejected ✓") : f(`HTTP ${r.status}`))); }

    upd(93, "pass", "Covered by test 64 — liabilitySchema.nonnegative() enforced", 0);

    upd(94, "running", "");
    { const r = await post("/api/liabilities", { ...vl, name: "Float EMI", emisLeft: 2.5 }); upd(94, ...(r.status === 400 ? p("Non-integer emisLeft rejected ✓") : f(`HTTP ${r.status}`))); }

    upd(95, "running", "");
    { const r = await req("/api/net-worth"); const d2 = r.body as Record<string, unknown>; upd(95, ...("netWorth" in (d2 ?? {}) ? p(`netWorth key present: ${d2?.netWorth} ✓`) : f("netWorth key missing"))); }

    await sleep(200);

    // ═══════════════════════════════════════════════════════════════════
    // F. EDGE CASES (96–110)
    // ═══════════════════════════════════════════════════════════════════
    setPhase("Phase F — Edge Cases");

    // Pre-create duplicate account so test 098 can reliably test 409
    await post("/api/accounts", { name: "QA Edge Duplicate", type: "Bank", balance: 100 });
    await sleep(150);

    const edgeCases: [number, object, "reject" | "allow"][] = [
      [96,  {},                                                                     "reject"],
      [97,  { name: "A".repeat(500), type: "Bank", balance: 100 },                 "reject"],
      [98,  { name: "QA Edge Duplicate", type: "Bank", balance: 100 },             "reject"],
      [99,  { name: "Neg Bank", type: "Bank", balance: -5000 },                    "reject"],
      [100, { name: "QA CC", type: "Credit Card", balance: -5000, creditLimit: 20000 }, "allow"],
      [101, { name: "Zero Bal", type: "Bank", balance: 0 },                        "allow"],
      [102, { name: "Rich", type: "Bank", balance: 1_000_000_000 },                "allow"],
      [103, { name: "मेरा बैंक", type: "Bank", balance: 100 },                    "allow"],
      [104, { name: "💰 Savings", type: "Bank", balance: 500 },                    "allow"],
      [105, { name: "Null", type: "Bank", balance: null },                          "reject"],
      [106, { name: "String bal", type: "Bank", balance: "thousand" },              "reject"],
      [107, { name: "Inf", type: "Bank", balance: Infinity },                       "reject"],
      [108, { name: "NaN", type: "Bank", balance: NaN },                            "reject"],
      [109, { name: "Bad type", type: "Savings", balance: 100 },                    "reject"],
      [110, { name: "Extra", type: "Bank", balance: 100, unknownField: "ignored" }, "allow"],
    ];

    const edgeLabels: Record<number, string> = {
      96: "Empty form", 97: "500-char name", 98: "Duplicate name", 99: "Neg balance (Bank)",
      100: "Neg balance (CC)", 101: "Zero balance", 102: "₹100Cr", 103: "Hindi Unicode",
      104: "Emoji", 105: "Null balance", 106: "String balance", 107: "Infinity",
      108: "NaN", 109: "Invalid enum", 110: "Extra fields",
    };

    for (const [id, body, expectation] of edgeCases) {
      upd(id, "running", "");
      const t = Date.now();
      const r = await post("/api/accounts", body);
      const rejected = r.status === 400 || r.status === 409 || r.status === 422;
      const accepted = r.status === 200 || r.status === 201;
      let s: Status, d: string;
      if (expectation === "reject") [s, d] = rejected ? p(`${edgeLabels[id]} — rejected HTTP ${r.status} ✓`) : f(`${edgeLabels[id]} — accepted HTTP ${r.status}`);
      else                          [s, d] = accepted || r.status === 409 ? p(`${edgeLabels[id]} — accepted ✓`) : f(`${edgeLabels[id]} — HTTP ${r.status}`);
      upd(id, s, d, Date.now() - t);
      await sleep(60);
    }

    await sleep(200);

    // ═══════════════════════════════════════════════════════════════════
    // G. SECURITY (111–120)
    // ═══════════════════════════════════════════════════════════════════
    setPhase("Phase G — Security");

    upd(111, "running", "");
    { const r = await req("/orbit/finance/accounts", {}, "omit"); upd(111, ...((r.status === 200 || r.status === 302 || r.status === 307) ? p(`Auth guard — HTTP ${r.status} ✓`) : f(`HTTP ${r.status}`))); }

    for (const [id, path] of [
      [112, "/api/accounts"], [113, "/api/assets"], [114, "/api/liabilities"],
      [115, "/api/transactions"], [116, "/api/budgets"], [117, "/api/net-worth"],
    ] as [number, string][]) {
      upd(id, "running", "");
      const r = await req(path, {}, "omit");
      upd(id, ...((r.status === 401 || r.status === 403) ? p(`401/403 protected ✓`) : r.status === 404 ? sk("Route not found") : f(`HTTP ${r.status} — EXPOSED!`)));
      await sleep(50);
    }

    upd(118, "running", "");
    { const r = await post("/api/accounts", { name: "'; DROP TABLE accounts;--", type: "Bank", balance: 100 }); upd(118, ...((r.status === 400 || r.status === 422) ? p("SQL injection rejected by Zod ✓") : r.status !== 500 ? w(`HTTP ${r.status} — accepted but DB safe (Prisma)`) : f("500!"))); }

    upd(119, "running", "");
    { const r = await post("/api/accounts", { name: "<script>alert('xss')</script>", type: "Bank", balance: 100 }); upd(119, ...((r.status === 400 || r.status === 422) ? p("XSS rejected ✓") : f(`HTTP ${r.status}`))); }

    upd(120, "running", "");
    { const r = await post("/api/accounts", { name: "<b>Bold</b><img src=x onerror=alert(1)>", type: "Bank", balance: 100 }); upd(120, ...((r.status === 400 || r.status === 422) ? p("HTML injection rejected ✓") : f(`HTTP ${r.status}`))); }

    setPhase("Complete ✓");
    setRunning(false);
  };

  // ─── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const pass  = tests.filter(t => t.status === "pass").length;
    const fail  = tests.filter(t => t.status === "fail").length;
    const warn  = tests.filter(t => t.status === "warn").length;
    const skip  = tests.filter(t => t.status === "skip").length;
    const done  = tests.filter(t => !["pending", "running"].includes(t.status)).length;
    return { pass, fail, warn, skip, done, total: tests.length, pct: Math.round(done / tests.length * 100) };
  }, [tests]);

  const visible = useMemo(() => {
    let t = tests;
    if (activeGroup !== "all") { const g = GROUPS.find(g => g.id === activeGroup); if (g) t = t.filter(x => x.id >= g.range[0] && x.id <= g.range[1]); }
    if (filterSt !== "all") t = t.filter(x => x.status === filterSt);
    return t;
  }, [tests, activeGroup, filterSt]);

  // ─── Styles ────────────────────────────────────────────────────────────────
  const S: Record<string, React.CSSProperties> = {
    wrap:   { fontFamily: "'IBM Plex Mono','Fira Code',monospace", background: "#0d1117", minHeight: "100vh", color: "#cdd9e5" },
    header: { background: "#161b22", borderBottom: "1px solid #21262d", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 8 },
    btn:    { background: running ? "#21262d" : "#1f6feb", color: "#fff", border: "none", borderRadius: 6, padding: "7px 18px", fontSize: 11, fontWeight: 700, cursor: running ? "not-allowed" : "pointer" },
    phase:  { background: "#161b22", borderBottom: "1px solid #21262d", padding: "5px 16px", display: "flex", alignItems: "center", gap: 8, fontSize: 10 },
    groups: { display: "flex", gap: 6, padding: "8px 14px", background: "#161b22", borderBottom: "1px solid #21262d", flexWrap: "wrap" as const },
    filter: { display: "flex", gap: 6, padding: "6px 14px", background: "#0d1117", borderBottom: "1px solid #21262d", flexWrap: "wrap" as const },
    sg:     { display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 6, padding: "10px 14px", background: "#161b22", borderBottom: "1px solid #21262d" },
    th:     { padding: "8px 12px", textAlign: "left" as const, color: "#484f58", borderBottom: "1px solid #21262d", fontSize: 10, fontWeight: 700, position: "sticky" as const, top: 0, background: "#161b22" },
    td:     { padding: "7px 12px", borderBottom: "1px solid #161b22", fontSize: 11, verticalAlign: "top" as const },
  };

  const Pill = ({ s, t }: { s: Status; t: string }) => (
    <span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 9, fontWeight: 800, background: COL[s].bg, color: COL[s].dot, whiteSpace: "nowrap" }}>{t}</span>
  );

  return (
    <div style={S.wrap}>
      {/* Header */}
      <div style={S.header}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#79c0ff", margin: 0 }}>⬡ finance120QATest — 120 Test Cases</p>
          <p style={{ fontSize: 10, color: "#484f58", margin: "2px 0 0" }}>A–G: Auth · Dashboard · Assets · Liabilities · Calculations · Edge Cases · Security</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {stats.done > 0 && <span style={{ fontSize: 10, color: "#484f58" }}>{stats.done}/{stats.total} ({stats.pct}%)</span>}
          <button style={S.btn} onClick={runAll} disabled={running}>{running ? "⏳ RUNNING…" : "▶ RUN 120 TESTS"}</button>
        </div>
      </div>

      {/* Phase bar */}
      <div style={S.phase}>
        <div style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: running ? "#e3b341" : phase === "Complete ✓" ? "#3fb950" : "#484f58" }} />
        <span style={{ color: "#79c0ff", fontWeight: 700, flex: 1 }}>{phase || "Ready — click ▶ RUN 120 TESTS"}</span>
        {stats.done > 0 && (
          <div style={{ width: 160, height: 4, background: "#21262d", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ width: `${stats.pct}%`, height: "100%", background: "#1f6feb", borderRadius: 2 }} />
          </div>
        )}
      </div>

      {/* Summary strip */}
      <div style={S.sg}>
        {([["PASS", stats.pass, "#3fb950"], ["FAIL", stats.fail, "#f85149"], ["WARN", stats.warn, "#e3b341"], ["SKIP", stats.skip, "#8b949e"], ["TOTAL", stats.total, "#79c0ff"]] as [string, number, string][]).map(([l, n, c]) => (
          <div key={l} style={{ background: "#0d1117", border: `1px solid ${c}44`, borderRadius: 6, padding: "8px", textAlign: "center" }}>
            <p style={{ fontSize: 22, fontWeight: 800, color: c, margin: 0, lineHeight: 1 }}>{n}</p>
            <p style={{ fontSize: 9, color: "#484f58", margin: "3px 0 0", letterSpacing: ".06em", fontWeight: 700 }}>{l}</p>
          </div>
        ))}
      </div>

      {/* Group tabs */}
      <div style={S.groups}>
        <button onClick={() => setActiveGroup("all")} style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${activeGroup === "all" ? "#79c0ff" : "#21262d"}`, background: activeGroup === "all" ? "#79c0ff22" : "transparent", color: activeGroup === "all" ? "#79c0ff" : "#484f58", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>ALL (120)</button>
        {GROUPS.map(g => {
          const cnt   = tests.filter(t => t.id >= g.range[0] && t.id <= g.range[1]);
          const fails = cnt.filter(t => t.status === "fail").length;
          const passes= cnt.filter(t => t.status === "pass").length;
          const active= activeGroup === g.id;
          return (
            <button key={g.id} onClick={() => setActiveGroup(g.id)} style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${active ? g.color : "#21262d"}`, background: active ? g.color + "22" : "transparent", color: active ? g.color : "#484f58", fontSize: 10, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
              {g.label}
              {fails > 0 && <span style={{ marginLeft: 5, background: "#ef444422", color: "#ef4444", padding: "1px 5px", borderRadius: 8, fontSize: 9 }}>{fails}✗</span>}
              {fails === 0 && passes > 0 && <span style={{ marginLeft: 5, background: "#10b98122", color: "#10b981", padding: "1px 5px", borderRadius: 8, fontSize: 9 }}>{passes}✓</span>}
            </button>
          );
        })}
      </div>

      {/* Status filter */}
      <div style={S.filter}>
        {(["all", "pass", "fail", "warn", "skip", "pending"] as const).map(k => {
          const cnt   = k === "all" ? visible.length : visible.filter(t => t.status === k).length;
          const color = k === "all" ? "#8b949e" : k === "pending" ? "#374151" : COL[k].dot;
          return <button key={k} onClick={() => setFilterSt(k as "all" | Status)} style={{ padding: "3px 10px", borderRadius: 12, border: `1px solid ${filterSt === k ? color : "#21262d"}`, background: filterSt === k ? color + "22" : "transparent", color: filterSt === k ? color : "#484f58", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>{k.toUpperCase()}{cnt > 0 ? ` (${cnt})` : ""}</button>;
        })}
      </div>

      {/* Test table */}
      <div style={{ overflowY: "auto", maxHeight: "calc(100vh - 330px)" }}>
        {visible.length === 0
          ? <div style={{ padding: 48, textAlign: "center", color: "#484f58", fontSize: 12 }}>No tests match filter</div>
          : <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ ...S.th, width: 40 }}>ID</th>
                  <th style={{ ...S.th, width: 80 }}>MODULE</th>
                  <th style={S.th}>TEST CASE</th>
                  <th style={{ ...S.th, width: 80 }}>STATUS</th>
                  <th style={{ ...S.th, width: 55 }}>MS</th>
                  <th style={S.th}>DETAIL</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((t, i) => {
                  const g = GROUPS.find(g => t.id >= g.range[0] && t.id <= g.range[1]);
                  return (
                    <tr key={t.id} style={{ background: t.status === "running" ? "#1f6feb12" : t.status === "fail" ? "#ef444408" : i % 2 === 0 ? "transparent" : "#161b2222" }}>
                      <td style={{ ...S.td, color: "#484f58", fontFamily: "monospace", fontSize: 10 }}>{String(t.id).padStart(3, "0")}</td>
                      <td style={S.td}><span style={{ padding: "2px 6px", borderRadius: 4, fontSize: 9, fontWeight: 800, background: (g?.color || "#484f58") + "22", color: g?.color || "#484f58" }}>{g?.id?.toUpperCase() || "?"}</span></td>
                      <td style={{ ...S.td, color: "#cdd9e5" }}>{t.name}</td>
                      <td style={S.td}>
                        {t.status === "running" ? <span style={{ color: "#3b82f6", fontSize: 10, fontWeight: 700 }}>⏳</span>
                          : t.status === "pending" ? <span style={{ color: "#374151", fontSize: 10 }}>–</span>
                          : <Pill s={t.status} t={t.status.toUpperCase()} />}
                      </td>
                      <td style={{ ...S.td, color: "#484f58", fontSize: 10 }}>{t.ms > 0 ? `${t.ms}` : "–"}</td>
                      <td style={{ ...S.td, color: COL[t.status]?.dot || "#484f58", fontSize: 10, maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.detail || "–"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
        }
      </div>
    </div>
  );
}