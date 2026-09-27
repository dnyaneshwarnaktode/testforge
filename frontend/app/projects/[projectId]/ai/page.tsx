"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

interface GeneratedAssertion {
  type: string;
  expected: string | number;
}

interface GeneratedTest {
  name: string;
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
  assertions: GeneratedAssertion[];
}

export default function AITestPage() {
  const params = useParams();

  const projectId =
    params.projectId as string;

  const [description, setDescription] =
    useState("");

  const [tests, setTests] =
    useState<GeneratedTest[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function generateTests() {
    if (!description.trim()) {
      setError(
        "Describe the API you want to test."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      const result =
        await apiFetch<{
          tests: GeneratedTest[];
        }>(
          "/api/ai/generate-tests",
          {
            method: "POST",
            body: JSON.stringify({
              description:
                description.trim(),
            }),
          }
        );

      setTests(result.tests);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to generate tests"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">

      <div className="mx-auto max-w-5xl px-8 py-12">

        <Link
          href={`/projects/${projectId}`}
          className="text-sm text-zinc-500 hover:text-white"
        >
          ← Back to project
        </Link>

        <p className="mt-8 text-sm text-zinc-500">
          AI Test Generator
        </p>

        <h1 className="mt-2 text-3xl font-bold">
          Generate API Tests with AI
        </h1>

        <p className="mt-2 max-w-2xl text-zinc-500">
          Describe your API and let AI generate
          structured test cases and assertions.
        </p>

        <div className="mt-8">

          <textarea
            value={description}
            onChange={(event) =>
              setDescription(
                event.target.value
              )
            }
            placeholder="Example: Create tests for POST /users. A valid request should return 201. Also test invalid email, missing name, and duplicate email."
            className="min-h-[180px] w-full rounded-xl border border-zinc-800 bg-zinc-900 p-5 outline-none focus:border-zinc-600"
          />

          {error && (
            <p className="mt-3 text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={generateTests}
            disabled={loading}
            className="mt-4 rounded-lg bg-white px-6 py-3 font-medium text-black disabled:opacity-50"
          >
            {loading
              ? "Generating..."
              : "Generate Tests"}
          </button>

        </div>

        {tests.length > 0 && (
          <section className="mt-10">

            <h2 className="text-xl font-semibold">
              Generated Tests
            </h2>

            <div className="mt-4 space-y-4">

              {tests.map(
                (test, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5"
                  >

                    <div className="flex items-center gap-3">

                      <span className="rounded-md bg-zinc-800 px-2 py-1 text-xs">
                        {test.method}
                      </span>

                      <h3 className="font-medium">
                        {test.name}
                      </h3>

                    </div>

                    <p className="mt-3 text-sm text-zinc-500">
                      {test.url}
                    </p>

                    <div className="mt-4">

                      <p className="text-sm font-medium">
                        Assertions
                      </p>

                      <div className="mt-2 space-y-2">

                        {test.assertions.map(
                          (
                            assertion,
                            assertionIndex
                          ) => (
                            <div
                              key={
                                assertionIndex
                              }
                              className="rounded-lg bg-zinc-950 p-3 text-sm"
                            >
                              <span className="text-zinc-400">
                                {assertion.type}
                              </span>

                              <span className="mx-2">
                                →
                              </span>

                              <span>
                                {String(
                                  assertion.expected
                                )}
                              </span>
                            </div>
                          )
                        )}

                      </div>

                    </div>

                  </div>
                )
              )}

            </div>

          </section>
        )}

      </div>

    </main>
  );
}
