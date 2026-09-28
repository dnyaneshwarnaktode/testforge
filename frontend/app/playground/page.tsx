"use client";

import { useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

interface HeaderRow {
  key: string;
  value: string;
}

interface AssertionRow {
  type: "status" | "response_time" | "body_contains";
  expected: string;
}

interface AssertionResult {
  type: string;
  passed: boolean;
  expected: unknown;
  actual: unknown;
  message: string;
}

interface ExecuteResponse {
  status: number | null;
  responseTime: number;
  body: string;
  assertions?: AssertionResult[];
  passed?: boolean | null;
  error?: string | null;
}

export default function PlaygroundPage() {
  const [method, setMethod] = useState("GET");
  const [url, setUrl] = useState("https://jsonplaceholder.typicode.com/users/1");
  const [headers, setHeaders] = useState<HeaderRow[]>([
    { key: "Content-Type", value: "application/json" },
  ]);
  const [body, setBody] = useState("");
  const [assertions, setAssertions] = useState<AssertionRow[]>([
    { type: "status", expected: "200" },
    { type: "response_time", expected: "1000" },
  ]);

  const [activeTab, setActiveTab] = useState<"headers" | "body" | "assertions">(
    "assertions"
  );
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ExecuteResponse | null>(null);
  const [error, setError] = useState("");

  function addHeader() {
    setHeaders([...headers, { key: "", value: "" }]);
  }

  function updateHeader(index: number, field: "key" | "value", val: string) {
    const next = [...headers];
    next[index]![field] = val;
    setHeaders(next);
  }

  function removeHeader(index: number) {
    setHeaders(headers.filter((_, i) => i !== index));
  }

  function addAssertion() {
    setAssertions([...assertions, { type: "status", expected: "200" }]);
  }

  function updateAssertion(
    index: number,
    field: "type" | "expected",
    val: string
  ) {
    const next = [...assertions];
    if (field === "type") {
      next[index]!.type = val as AssertionRow["type"];
    } else {
      next[index]!.expected = val;
    }
    setAssertions(next);
  }

  function removeAssertion(index: number) {
    setAssertions(assertions.filter((_, i) => i !== index));
  }

  async function handleExecute(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) {
      setError("Please enter a URL to execute");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const headersObj: Record<string, string> = {};
      for (const h of headers) {
        if (h.key.trim()) {
          headersObj[h.key.trim()] = h.value;
        }
      }

      let parsedBody: unknown = undefined;
      if (body.trim() && method !== "GET" && method !== "HEAD") {
        try {
          parsedBody = JSON.parse(body);
        } catch {
          parsedBody = body;
        }
      }

      const formattedAssertions = assertions
        .filter((a) => a.expected.trim())
        .map((a) => ({
          type: a.type,
          expected:
            a.type === "status" || a.type === "response_time"
              ? Number(a.expected)
              : a.expected,
        }));

      const res = await apiFetch<ExecuteResponse>("/api/execute", {
        method: "POST",
        body: JSON.stringify({
          method,
          url: url.trim(),
          headers: Object.keys(headersObj).length > 0 ? headersObj : undefined,
          body: parsedBody,
          assertions:
            formattedAssertions.length > 0 ? formattedAssertions : undefined,
        }),
      });

      setResponse(res);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to execute request"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-5xl px-8 py-12">
        <Link
          href="/"
          className="text-sm text-zinc-500 hover:text-white"
        >
          ← Back to projects
        </Link>

        <div className="mt-6 flex flex-col gap-2">
          <p className="text-xs uppercase tracking-wide text-zinc-500 font-medium">
            TestForge Playground
          </p>
          <h1 className="text-3xl font-bold tracking-tight">API Playground</h1>
          <p className="text-sm text-zinc-400">
            Execute ad-hoc HTTP requests, test headers and payloads, and evaluate
            assertions in real-time.
          </p>
        </div>

        {error && (
          <div className="mt-6 rounded-lg border border-red-900 bg-red-950/40 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleExecute} className="mt-8 space-y-6">
          {/* Method and URL Input */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 font-mono text-sm font-semibold outline-none focus:border-zinc-600"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>

            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://api.example.com/endpoint"
              className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 font-mono text-sm outline-none focus:border-zinc-600"
            />

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-white px-6 py-3 font-semibold text-black hover:bg-zinc-200 transition-colors disabled:opacity-50"
            >
              {loading ? "Executing..." : "Execute"}
            </button>
          </div>

          {/* Request Configuration Tabs */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
            <div className="flex items-center gap-4 border-b border-zinc-800 pb-3">
              <button
                type="button"
                onClick={() => setActiveTab("assertions")}
                className={`text-sm font-medium pb-1 transition-colors ${
                  activeTab === "assertions"
                    ? "text-white border-b-2 border-white"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Assertions ({assertions.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("headers")}
                className={`text-sm font-medium pb-1 transition-colors ${
                  activeTab === "headers"
                    ? "text-white border-b-2 border-white"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Headers ({headers.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("body")}
                className={`text-sm font-medium pb-1 transition-colors ${
                  activeTab === "body"
                    ? "text-white border-b-2 border-white"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Body {body ? "•" : ""}
              </button>
            </div>

            <div className="mt-4">
              {/* Assertions Tab */}
              {activeTab === "assertions" && (
                <div className="space-y-3">
                  {assertions.map((a, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <select
                        value={a.type}
                        onChange={(e) =>
                          updateAssertion(idx, "type", e.target.value)
                        }
                        className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-mono outline-none"
                      >
                        <option value="status">HTTP Status</option>
                        <option value="response_time">Response Time (&lt; ms)</option>
                        <option value="body_contains">Body Contains</option>
                      </select>

                      <input
                        type="text"
                        value={a.expected}
                        onChange={(e) =>
                          updateAssertion(idx, "expected", e.target.value)
                        }
                        placeholder={
                          a.type === "status"
                            ? "200"
                            : a.type === "response_time"
                            ? "500"
                            : "substring"
                        }
                        className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-mono outline-none"
                      />

                      <button
                        type="button"
                        onClick={() => removeAssertion(idx)}
                        className="text-xs text-zinc-500 hover:text-red-400"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addAssertion}
                    className="mt-2 text-xs text-zinc-400 hover:text-white"
                  >
                    + Add Assertion
                  </button>
                </div>
              )}

              {/* Headers Tab */}
              {activeTab === "headers" && (
                <div className="space-y-3">
                  {headers.map((h, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <input
                        type="text"
                        value={h.key}
                        onChange={(e) =>
                          updateHeader(idx, "key", e.target.value)
                        }
                        placeholder="Header Key"
                        className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-mono outline-none"
                      />
                      <input
                        type="text"
                        value={h.value}
                        onChange={(e) =>
                          updateHeader(idx, "value", e.target.value)
                        }
                        placeholder="Value"
                        className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-mono outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => removeHeader(idx)}
                        className="text-xs text-zinc-500 hover:text-red-400"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addHeader}
                    className="mt-2 text-xs text-zinc-400 hover:text-white"
                  >
                    + Add Header
                  </button>
                </div>
              )}

              {/* Body Tab */}
              {activeTab === "body" && (
                <div>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder='{"key": "value"}'
                    className="min-h-[140px] w-full rounded-lg border border-zinc-800 bg-zinc-950 p-3 font-mono text-xs outline-none focus:border-zinc-700"
                  />
                  <p className="mt-1 text-xs text-zinc-500">
                    JSON payload sent with POST, PUT, PATCH requests.
                  </p>
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Execution Response Result */}
        {response && (
          <section className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    response.status && response.status < 400
                      ? "bg-green-500/10 text-green-400 border border-green-500/20"
                      : "bg-red-500/10 text-red-400 border border-red-500/20"
                  }`}
                >
                  {response.status ? `${response.status}` : "Unreachable"}
                </span>

                <span className="text-xs text-zinc-400 font-mono">
                  {response.responseTime}ms
                </span>
              </div>

              {response.passed !== null && response.passed !== undefined && (
                <span
                  className={`text-xs font-semibold ${
                    response.passed ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {response.passed ? "✓ All Assertions Passed" : "✕ Assertions Failed"}
                </span>
              )}
            </div>

            {/* Assertions Evaluation */}
            {response.assertions && response.assertions.length > 0 && (
              <div className="mt-4 space-y-2 border-b border-zinc-800 pb-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500 font-medium">
                  Assertions
                </p>
                {response.assertions.map((a, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg bg-zinc-950/80 px-3 py-2 text-xs"
                  >
                    <span className="text-zinc-300 font-mono">{a.message}</span>
                    <span
                      className={
                        a.passed ? "text-green-400 font-bold" : "text-red-400 font-bold"
                      }
                    >
                      {a.passed ? "✓ PASS" : "✕ FAIL"}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Response Body */}
            <div className="mt-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500 font-medium">
                Response Payload
              </p>
              <pre className="mt-2 max-h-[360px] overflow-auto rounded-lg bg-zinc-950 p-4 font-mono text-xs text-zinc-300">
                {(() => {
                  try {
                    return JSON.stringify(JSON.parse(response.body), null, 2);
                  } catch {
                    return response.body;
                  }
                })()}
              </pre>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
