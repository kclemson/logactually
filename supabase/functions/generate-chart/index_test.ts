import "https://deno.land/std@0.224.0/dotenv/load.ts";
import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/generate-chart`;

// Sign in as demo user to get a valid token
async function getAuthToken(): Promise<string> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data, error } = await supabase.auth.signInWithPassword({
    email: "demo@logactually.com",
    password: "demo1234",
  });
  if (error || !data.session) {
    throw new Error(`Auth failed: ${error?.message ?? "no session"}`);
  }
  return data.session.access_token;
}

async function callGenerateChart(
  token: string,
  body: Record<string, unknown>,
): Promise<{ status: number; data: Record<string, unknown> }> {
  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { status: res.status, data };
}

interface ChartSpec {
  chartType: string;
  title: string;
  xAxis: { field: string; label: string };
  yAxis: { label: string };
  dataKey: string;
  color: string;
  data: Record<string, unknown>[];
  [key: string]: unknown;
}

function assertValidChartSpec(spec: unknown): ChartSpec {
  assertExists(spec, "chartSpec should exist");
  const cs = spec as ChartSpec;

  // chartType
  if (cs.chartType !== "bar" && cs.chartType !== "line") {
    throw new Error(`chartType must be "bar" or "line", got "${cs.chartType}"`);
  }

  // title
  assertEquals(typeof cs.title, "string");
  if (cs.title.length === 0) throw new Error("title must be non-empty");

  // xAxis
  assertExists(cs.xAxis, "xAxis must exist");
  assertEquals(typeof cs.xAxis.field, "string");
  if (cs.xAxis.field.length === 0) throw new Error("xAxis.field must be non-empty");

  // dataKey
  assertEquals(typeof cs.dataKey, "string");
  if (cs.dataKey.length === 0) throw new Error("dataKey must be non-empty");

  // color - valid hex
  if (!/^#[0-9a-fA-F]{6}$/.test(cs.color)) {
    throw new Error(`color must be a valid hex code, got "${cs.color}"`);
  }

  // data array
  if (!Array.isArray(cs.data)) throw new Error("data must be an array");
  if (cs.data.length === 0) throw new Error("data must be non-empty");

  // Every data item must have the xAxis field and dataKey field
  for (let i = 0; i < cs.data.length; i++) {
    const item = cs.data[i];
    if (item[cs.xAxis.field] === undefined) {
      throw new Error(
        `data[${i}] missing xAxis field "${cs.xAxis.field}": ${JSON.stringify(item)}`,
      );
    }
    if (item[cs.dataKey] === undefined) {
      throw new Error(
        `data[${i}] missing dataKey "${cs.dataKey}": ${JSON.stringify(item)}`,
      );
    }
  }

  return cs;
}

// ---- Tests ----

let token: string;

// Get auth token once before all tests
Deno.test({
  name: "setup: authenticate",
  fn: async () => {
    token = await getAuthToken();
    assertExists(token);
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "valid chart response structure",
  fn: async () => {
    const { status, data } = await callGenerateChart(token, {
      messages: [{ role: "user", content: "daily calories last 7 days" }],
      period: 7,
    });
    assertEquals(status, 200);
    if (data.error) throw new Error(`Unexpected error: ${data.error}`);
    assertValidChartSpec(data.chartSpec);
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "data values are numeric",
  fn: async () => {
    const { status, data } = await callGenerateChart(token, {
      messages: [{ role: "user", content: "total protein per day last 7 days" }],
      period: 7,
    });
    assertEquals(status, 200);
    if (data.error) throw new Error(`Unexpected error: ${data.error}`);
    const cs = assertValidChartSpec(data.chartSpec);
    for (let i = 0; i < cs.data.length; i++) {
      const val = cs.data[i][cs.dataKey];
      if (typeof val !== "number") {
        throw new Error(
          `data[${i}].${cs.dataKey} should be a number, got ${typeof val}: ${JSON.stringify(val)}`,
        );
      }
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "rejects empty messages",
  fn: async () => {
    const { status, data } = await callGenerateChart(token, {
      messages: [],
      period: 7,
    });
    assertExists(data.error, "should return an error for empty messages");
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "handles unknown request gracefully (no 500)",
  fn: async () => {
    const { status, data } = await callGenerateChart(token, {
      messages: [{ role: "user", content: "xyzzy flurble grommet" }],
      period: 7,
    });
    if (status === 500) {
      throw new Error(`Got 500 for nonsensical prompt: ${JSON.stringify(data)}`);
    }
    // Either a valid chart or a meaningful error — both are fine
    if (data.chartSpec) {
      assertValidChartSpec(data.chartSpec);
    } else {
      assertExists(data.error, "should have either chartSpec or error");
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});
