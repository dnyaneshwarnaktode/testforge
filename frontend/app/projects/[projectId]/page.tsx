"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import TestResult from "@/components/TestResult";
import ExecutionHistory from "@/components/ExecutionHistory";

interface TestCase {
  id: string;
  name: string;
  method: string;
  url: string;
  createdAt: string;
}

interface AssertionResult {
  id: string;
  type: string;
  passed: boolean;
  expected: unknown;
  actual: unknown;
  message: string;
}

interface TestRun {
  id: string;
  testCaseId: string;
  status: string;
  responseStatus: number | null;
  responseTime: number | null;
  responseBody: unknown;
  startedAt: string;
  completedAt: string | null;
  assertionResults: AssertionResult[];
}

interface ProjectStats {
  totalTests: number;
  totalRuns: number;
  passed: number;
  failed: number;
  passRate: number;
}

interface RecurringIssue {
  title: string;
  description: string;
  count: string | number;
}

interface ProjectInsights {
  summary: string;
  recurringIssues: RecurringIssue[];
  systemicSuggestions: string[];
}

export default function ProjectPage({
  params,
}: {
  params: Promise<{
    projectId: string;
  }>;
}) {
  const [projectId, setProjectId] = useState("");
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [stats, setStats] = useState<ProjectStats | null>(null);

  const [loading, setLoading] = useState(true);
  const [runningTestId, setRunningTestId] = useState<string | null>(null);
  const [latestRun, setLatestRun] = useState<TestRun | null>(null);
  const [runs, setRuns] = useState<TestRun[]>([]);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);

  // AI Insights State
  const [showInsights, setShowInsights] = useState(false);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insights, setInsights] = useState<ProjectInsights | null>(null);
  const [insightsError, setInsightsError] = useState("");

  async function fetchStats(id: string) {
    try {
      const data = await apiFetch<ProjectStats>(`/api/projects/${id}/stats`);
      setStats(data);
    } catch (err) {
      console.error("Failed to load stats", err);
    }
  }

  async function loadInsights() {
    if (insights) {
      setShowInsights((prev) => !prev);
      return;
    }

    try {
      setShowInsights(true);
      setInsightsLoading(true);
      setInsightsError("");

      const result = await apiFetch<{ insights: ProjectInsights }>(
        `/api/projects/${projectId}/insights`,
        {
          method: "POST",
        }
      );
      setInsights(result.insights);
    } catch (err) {
      setInsightsError(
        err instanceof Error ? err.message : "Failed to load insights"
      );
    } finally {
      setInsightsLoading(false);
    }
  }

  async function runTest(testCaseId: string) {
    try {
      setRunningTestId(testCaseId);
      setSelectedTestId(testCaseId);

      const result = await apiFetch<TestRun>(
        `/api/test-cases/${testCaseId}/run`,
        {
          method: "POST",
        }
      );

      setLatestRun(result);

      const history = await apiFetch<TestRun[]>(
        `/api/test-cases/${testCaseId}/runs`
      );

      setRuns(history);

      if (projectId) {
        fetchStats(projectId);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setRunningTestId(null);
    }
  }

  useEffect(() => {
    async function load() {
      const resolvedParams = await params;
      const pid = resolvedParams.projectId;
      setProjectId(pid);

      try {
        const data = await apiFetch<TestCase[]>(
          `/api/projects/${pid}/test-cases`
        );
        setTestCases(data);
        await fetchStats(pid);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [params]);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-6xl px-8 py-12">
        <Link
          href="/"
          className="text-sm text-zinc-500 hover:text-white"
        >
          ← Back to projects
        </Link>

        {/* Header */}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-zinc-500 font-medium">API Test Suite</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              TestForge Dashboard
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={loadInsights}
              className="rounded-lg border border-indigo-500/40 bg-indigo-950/30 px-4 py-2.5 text-sm font-medium text-indigo-300 transition hover:bg-indigo-900/40 flex items-center gap-2"
            >
              <span>🧠</span> AI Insights
            </button>

            <Link
              href={`/projects/${projectId}/ai`}
              className="rounded-lg border border-purple-500/40 bg-purple-950/30 px-4 py-2.5 text-sm font-medium text-purple-200 transition hover:bg-purple-900/40 flex items-center gap-2"
            >
              <span>✨</span> AI Generator
            </Link>

            <Link
              href={`/projects/${projectId}/new`}
              className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-zinc-200 transition-colors"
            >
              + Create Test
            </Link>
          </div>
        </div>

        {/* Dashboard Metrics */}
        {stats && (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
              <p className="text-xs uppercase tracking-wide text-zinc-500 font-medium">
                Total Tests
              </p>
              <p className="mt-2 text-2xl font-bold">{stats.totalTests}</p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
              <p className="text-xs uppercase tracking-wide text-zinc-500 font-medium">
                Total Runs
              </p>
              <p className="mt-2 text-2xl font-bold">{stats.totalRuns}</p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
              <p className="text-xs uppercase tracking-wide text-zinc-500 font-medium">
                Pass Rate
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <p className="text-2xl font-bold">{stats.passRate}%</p>
                <span
                  className={`text-xs font-medium ${
                    stats.passRate >= 80
                      ? "text-green-400"
                      : stats.passRate >= 50
                      ? "text-yellow-400"
                      : "text-red-400"
                  }`}
                >
                  {stats.passed} passed
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
              <p className="text-xs uppercase tracking-wide text-zinc-500 font-medium">
                Failures
              </p>
              <p
                className={`mt-2 text-2xl font-bold ${
                  stats.failed > 0 ? "text-red-400" : "text-zinc-400"
                }`}
              >
                {stats.failed}
              </p>
            </div>
          </div>
        )}

        {/* AI Insights Modal/Panel */}
        {showInsights && (
          <div className="mt-8 rounded-xl border border-indigo-900/40 bg-indigo-950/20 p-6">
            <div className="flex items-center justify-between border-b border-indigo-900/30 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">🧠</span>
                <h2 className="font-semibold text-indigo-100">
                  Recurring Failure Insights & Root Causes
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowInsights(false)}
                className="text-xs text-zinc-400 hover:text-white"
              >
                ✕ Close
              </button>
            </div>

            {insightsLoading && (
              <p className="mt-4 text-sm text-indigo-300">
                Analyzing test history across all executions...
              </p>
            )}

            {insightsError && (
              <p className="mt-4 text-sm text-red-400">{insightsError}</p>
            )}

            {insights && (
              <div className="mt-5 space-y-6">
                <div>
                  <p className="text-xs uppercase tracking-wide text-indigo-400 font-medium">
                    Diagnostic Summary
                  </p>
                  <p className="mt-2 text-sm text-zinc-200 leading-relaxed">
                    {insights.summary}
                  </p>
                </div>

                {insights.recurringIssues.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-indigo-400 font-medium">
                      Recurring Issue Patterns
                    </p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {insights.recurringIssues.map((issue, idx) => (
                        <div
                          key={idx}
                          className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm text-white">
                              {issue.title}
                            </h4>
                            <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-semibold text-red-400 border border-red-500/20">
                              {issue.count}
                            </span>
                          </div>
                          <p className="mt-2 text-xs text-zinc-400 leading-normal">
                            {issue.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {insights.systemicSuggestions.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-indigo-400 font-medium">
                      Systemic Recommendations
                    </p>
                    <ul className="mt-2 space-y-1.5">
                      {insights.systemicSuggestions.map((sugg, idx) => (
                        <li
                          key={idx}
                          className="text-sm text-zinc-300 flex items-start gap-2"
                        >
                          <span className="text-indigo-400">•</span>
                          <span>{sugg}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Test Cases Section */}
        <div className="mt-10">
          <h2 className="text-xl font-semibold">Test Cases</h2>
          <p className="text-sm text-zinc-500 mt-1">
            Execute saved test cases with deterministic assertion checks.
          </p>
        </div>

        {loading ? (
          <p className="mt-8 text-zinc-500">Loading test cases...</p>
        ) : testCases.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-zinc-800 p-10 text-center">
            <p className="text-zinc-400">No test cases yet.</p>
            <p className="mt-2 text-sm text-zinc-600">
              Your saved API tests will appear here. Try generating tests with AI
              or create one manually.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {testCases.map((testCase) => (
              <div
                key={testCase.id}
                className="rounded-xl border border-zinc-800 p-5 bg-zinc-900/20"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-md bg-zinc-800 px-2 py-1 text-xs font-mono font-medium">
                        {testCase.method}
                      </span>
                      <h3 className="font-medium">{testCase.name}</h3>
                    </div>
                    <p className="mt-2 break-all text-sm font-mono text-zinc-500">
                      {testCase.url}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => runTest(testCase.id)}
                    disabled={runningTestId === testCase.id}
                    className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200 transition-colors disabled:opacity-50"
                  >
                    {runningTestId === testCase.id ? "Running..." : "Run Test"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {latestRun && <TestResult run={latestRun} />}

        {selectedTestId && <ExecutionHistory runs={runs} />}
      </div>
    </main>
  );
}
