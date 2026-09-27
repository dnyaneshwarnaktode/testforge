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
  const projectId = params.projectId as string;

  const [description, setDescription] = useState("");
  const [tests, setTests] = useState<GeneratedTest[]>([]);
  const [selectedTests, setSelectedTests] = useState<number[]>([]);
  const [savedIndices, setSavedIndices] = useState<number[]>([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  async function generateTests() {
    if (!description.trim()) {
      setError("Describe the API you want to test.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setFeedback("");
      setSelectedTests([]);
      setSavedIndices([]);

      const result = await apiFetch<{
        tests: GeneratedTest[];
      }>("/api/ai/generate-tests", {
        method: "POST",
        body: JSON.stringify({
          description: description.trim(),
        }),
      });

      setTests(result.tests);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate tests"
      );
    } finally {
      setLoading(false);
    }
  }

  function toggleTest(index: number) {
    setSelectedTests((current) => {
      if (current.includes(index)) {
        return current.filter((item) => item !== index);
      }
      return [...current, index];
    });
  }

  function toggleAll() {
    if (selectedTests.length === tests.length) {
      setSelectedTests([]);
    } else {
      setSelectedTests(tests.map((_, i) => i));
    }
  }

  async function saveTest(test: GeneratedTest, index: number) {
    try {
      setError("");
      await apiFetch("/api/test-cases", {
        method: "POST",
        body: JSON.stringify({
          projectId,
          name: test.name,
          method: test.method,
          url: test.url,
          headers: test.headers,
          body: test.body,
          assertions: test.assertions,
        }),
      });

      setSavedIndices((prev) => (prev.includes(index) ? prev : [...prev, index]));
      setFeedback(`"${test.name}" saved to project successfully!`);
    } catch (err) {
      console.error(err);
      setError("Failed to save test case.");
    }
  }

  async function saveSelectedTests() {
    const selected = tests
      .map((test, index) => ({ test, index }))
      .filter(({ index }) => selectedTests.includes(index));

    if (selected.length === 0) return;

    try {
      setSaving(true);
      setError("");
      setFeedback("");

      for (const item of selected) {
        await apiFetch("/api/test-cases", {
          method: "POST",
          body: JSON.stringify({
            projectId,
            name: item.test.name,
            method: item.test.method,
            url: item.test.url,
            headers: item.test.headers,
            body: item.test.body,
            assertions: item.test.assertions,
          }),
        });
        setSavedIndices((prev) =>
          prev.includes(item.index) ? prev : [...prev, item.index]
        );
      }

      setFeedback(`${selected.length} selected tests saved to project!`);
    } catch (err) {
      console.error(err);
      setError("Some tests could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function saveAllTests() {
    if (tests.length === 0) return;

    try {
      setSaving(true);
      setError("");
      setFeedback("");

      for (let i = 0; i < tests.length; i++) {
        const test = tests[i]!;
        await apiFetch("/api/test-cases", {
          method: "POST",
          body: JSON.stringify({
            projectId,
            name: test.name,
            method: test.method,
            url: test.url,
            headers: test.headers,
            body: test.body,
            assertions: test.assertions,
          }),
        });
        setSavedIndices((prev) => (prev.includes(i) ? prev : [...prev, i]));
      }

      setFeedback(`All ${tests.length} tests saved to project successfully!`);
    } catch (err) {
      console.error(err);
      setError("Failed to save all tests.");
    } finally {
      setSaving(false);
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

        <p className="mt-8 text-sm text-zinc-500">AI Test Generator</p>

        <h1 className="mt-2 text-3xl font-bold">Generate API Tests with AI</h1>

        <p className="mt-2 max-w-2xl text-zinc-500">
          Describe your API requirements in plain English. TestForge AI will
          generate structured positive, negative, and edge-case test cases.
        </p>

        <div className="mt-8">
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Example: I have an authentication API POST /login that accepts email and password. Successful login returns 200 with a token. Invalid credentials return 401. Missing fields return 400."
            className="min-h-[160px] w-full rounded-xl border border-zinc-800 bg-zinc-900 p-5 outline-none focus:border-zinc-600 font-normal"
          />

          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
          {feedback && (
            <p className="mt-3 text-sm text-emerald-400 font-medium">
              ✓ {feedback}
            </p>
          )}

          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={generateTests}
              disabled={loading || saving}
              className="rounded-lg bg-white px-6 py-3 font-medium text-black hover:bg-zinc-200 transition-colors disabled:opacity-50"
            >
              {loading ? "Generating Tests..." : "Generate Tests"}
            </button>
          </div>
        </div>

        {tests.length > 0 && (
          <section className="mt-12">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800 pb-5">
              <div>
                <h2 className="text-xl font-semibold">
                  Generated Test Cases ({tests.length})
                </h2>
                <p className="text-sm text-zinc-500 mt-1">
                  Review and select the test cases you wish to persist in your
                  project.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={toggleAll}
                  className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
                >
                  {selectedTests.length === tests.length
                    ? "Deselect All"
                    : "Select All"}
                </button>

                {selectedTests.length > 0 && (
                  <button
                    type="button"
                    onClick={saveSelectedTests}
                    disabled={saving}
                    className="rounded-lg bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500 disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : `Save Selected (${selectedTests.length})`}
                  </button>
                )}

                <button
                  type="button"
                  onClick={saveAllTests}
                  disabled={saving}
                  className="rounded-lg bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-zinc-200 disabled:opacity-50"
                >
                  {saving ? "Saving All..." : "Save All Tests"}
                </button>

                <Link
                  href={`/projects/${projectId}`}
                  className="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
                >
                  View In Project →
                </Link>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {tests.map((test, index) => {
                const isSelected = selectedTests.includes(index);
                const isSaved = savedIndices.includes(index);

                return (
                  <div
                    key={index}
                    className={`rounded-xl border p-5 transition-all ${
                      isSelected
                        ? "border-purple-500/40 bg-purple-950/10"
                        : "border-zinc-800 bg-zinc-900/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleTest(index)}
                          className="mt-1 h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-purple-600 focus:ring-0 cursor-pointer"
                        />

                        <div>
                          <div className="flex items-center gap-3">
                            <span className="rounded-md bg-zinc-800 px-2 py-1 text-xs font-mono font-semibold">
                              {test.method}
                            </span>
                            <h3 className="font-medium text-base">
                              {test.name}
                            </h3>
                            {isSaved && (
                              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/20">
                                Saved ✓
                              </span>
                            )}
                          </div>

                          <p className="mt-2 text-sm text-zinc-400 font-mono">
                            {test.url}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => saveTest(test, index)}
                        disabled={saving || isSaved}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                          isSaved
                            ? "border border-emerald-800/40 bg-emerald-950/20 text-emerald-400 cursor-default"
                            : "border border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                        }`}
                      >
                        {isSaved ? "Saved" : "Save Test"}
                      </button>
                    </div>

                    {/* Assertions */}
                    <div className="mt-4 border-t border-zinc-800/80 pt-3">
                      <p className="text-xs uppercase tracking-wide text-zinc-500 font-medium">
                        Expected Assertions
                      </p>

                      <div className="mt-2 flex flex-wrap gap-2">
                        {test.assertions.map((assertion, aIdx) => (
                          <div
                            key={aIdx}
                            className="rounded-lg bg-zinc-950 px-3 py-1.5 text-xs text-zinc-300 border border-zinc-800/80"
                          >
                            <span className="text-zinc-500 font-mono">
                              {assertion.type}
                            </span>
                            <span className="mx-1.5 text-zinc-600">→</span>
                            <span className="font-semibold text-white">
                              {String(assertion.expected)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
