"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

interface TestCase {
  id: string;
  name: string;
  method: string;
  url: string;
  createdAt: string;
}

interface TestRunResult {
  id: string;
  status: string;
}

export default function ProjectPage({
  params,
}: {
  params: Promise<{
    projectId: string;
  }>;
}) {
  const [projectId, setProjectId] =
    useState("");

  const [testCases, setTestCases] =
    useState<TestCase[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [runningTestId, setRunningTestId] =
    useState<string | null>(null);

  async function runTest(
    testCaseId: string
  ) {
    try {
      setRunningTestId(testCaseId);

      const result =
        await apiFetch<TestRunResult>(
          `/api/test-cases/${testCaseId}/run`,
          {
            method: "POST",
          }
        );

      console.log(
        "Test result:",
        result
      );

      alert(
        result.status === "PASSED"
          ? "Test passed!"
          : "Test failed!"
      );

    } catch (error) {

      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Test execution failed"
      );

    } finally {
      setRunningTestId(null);
    }
  }

  useEffect(() => {
    async function load() {
      const resolvedParams =
        await params;

      setProjectId(
        resolvedParams.projectId
      );

      try {
        const data =
          await apiFetch<TestCase[]>(
            `/api/projects/${resolvedParams.projectId}/test-cases`
          );

        setTestCases(data);
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

        <div className="mt-8 flex items-center justify-between">

          <div>
            <p className="text-sm text-zinc-500">
              Project
            </p>

            <h1 className="mt-1 text-3xl font-bold">
              Test Cases
            </h1>
          </div>

          <Link
            href={`/projects/${projectId}/new`}
            className="rounded-lg bg-white px-5 py-3 text-sm font-medium text-black"
          >
            + Create Test
          </Link>

        </div>

        {loading ? (
          <p className="mt-8 text-zinc-500">
            Loading test cases...
          </p>
        ) : testCases.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-zinc-800 p-10 text-center">

            <p className="text-zinc-400">
              No test cases yet.
            </p>

            <p className="mt-2 text-sm text-zinc-600">
              Your saved API tests will appear here.
            </p>

          </div>
        ) : (
          <div className="mt-8 space-y-3">

            {testCases.map((testCase) => (
              <div
                key={testCase.id}
                className="rounded-xl border border-zinc-800 p-5"
              >

                <div className="flex items-center justify-between">

                  <div>

                    <div className="flex items-center gap-3">

                      <span className="rounded-md bg-zinc-800 px-2 py-1 text-xs font-medium">
                        {testCase.method}
                      </span>

                      <h2 className="font-medium">
                        {testCase.name}
                      </h2>

                    </div>

                    <p className="mt-3 break-all text-sm text-zinc-500">
                      {testCase.url}
                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      runTest(testCase.id)
                    }
                    disabled={
                      runningTestId === testCase.id
                    }
                    className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
                  >
                    {runningTestId === testCase.id
                      ? "Running..."
                      : "Run Test"}
                  </button>

                </div>

              </div>
            ))}

          </div>
        )}

      </div>

    </main>
  );
}
