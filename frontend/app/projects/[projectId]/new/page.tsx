"use client";

import { FormEvent, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

type AssertionType =
  | "status"
  | "response_time"
  | "body_contains";

interface Assertion {
  type: AssertionType;
  expected: string | number;
}

export default function NewTestPage() {
  const params = useParams();
  const router = useRouter();

  const projectId = params.projectId as string;

  const [name, setName] =
    useState("");

  const [method, setMethod] =
    useState("GET");

  const [url, setUrl] =
    useState("");

  const [assertions, setAssertions] =
    useState<Assertion[]>([
      {
        type: "status",
        expected: 200,
      },
    ]);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleSubmit(
    event: FormEvent
  ) {
    event.preventDefault();

    if (!name.trim()) {
      setError("Test name is required.");
      return;
    }

    if (!url.trim()) {
      setError("URL is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await apiFetch(
        `/api/projects/${projectId}/test-cases`,
        {
          method: "POST",
          body: JSON.stringify({
            name: name.trim(),
            method,
            url: url.trim(),
            assertions,
          }),
        }
      );

      router.push(
        `/projects/${projectId}`
      );

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to create test"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">

      <div className="mx-auto max-w-4xl px-8 py-12">

        <button
          type="button"
          onClick={() =>
            router.push(
              `/projects/${projectId}`
            )
          }
          className="text-sm text-zinc-500 hover:text-white"
        >
          ← Back to project
        </button>

        <div className="mt-8">

          <h1 className="text-3xl font-bold">
            Create API Test
          </h1>

          <p className="mt-2 text-zinc-500">
            Define a request and the conditions
            it must satisfy.
          </p>

        </div>

        {error && (
          <div className="mt-6 rounded-lg border border-red-900 bg-red-950/30 p-4 text-red-300">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-10 space-y-8"
        >

          {/* Test name */}

          <section>

            <label className="text-sm font-medium">
              Test name
            </label>

            <input
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="Get Users"
              className="mt-2 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 outline-none focus:border-zinc-500"
            />

          </section>

          {/* Request */}

          <section>

            <h2 className="text-lg font-semibold">
              Request
            </h2>

            <div className="mt-4 grid grid-cols-[140px_1fr] gap-3">

              <select
                value={method}
                onChange={(event) =>
                  setMethod(event.target.value)
                }
                className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 outline-none"
              >
                <option>GET</option>
                <option>POST</option>
                <option>PUT</option>
                <option>PATCH</option>
                <option>DELETE</option>
              </select>

              <input
                value={url}
                onChange={(event) =>
                  setUrl(event.target.value)
                }
                placeholder="https://api.example.com/users"
                className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 outline-none"
              />

            </div>

          </section>

          {/* Assertions */}

          <section>

            <div className="flex items-center justify-between">

              <div>
                <h2 className="text-lg font-semibold">
                  Assertions
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Define what must be true for the
                  test to pass.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setAssertions([
                    ...assertions,
                    {
                      type: "status",
                      expected: 200,
                    },
                  ])
                }
                className="rounded-lg border border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-900"
              >
                + Add Assertion
              </button>

            </div>

            <div className="mt-4 space-y-3">

              {assertions.map(
                (assertion, index) => (
                  <div
                    key={index}
                    className="flex gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4"
                  >

                    <select
                      value={assertion.type}
                      onChange={(event) => {

                        const updated =
                          [...assertions];

                        const type =
                          event.target
                            .value as AssertionType;

                        updated[index] = {
                          type,
                          expected:
                            type ===
                            "status"
                              ? 200
                              : type ===
                                "response_time"
                              ? 1000
                              : "",
                        };

                        setAssertions(updated);

                      }}
                      className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"
                    >

                      <option value="status">
                        Status
                      </option>

                      <option value="response_time">
                        Response Time
                      </option>

                      <option value="body_contains">
                        Body Contains
                      </option>

                    </select>

                    <input
                      value={assertion.expected}
                      onChange={(event) => {

                        const updated =
                          [...assertions];

                        let value:
                          | string
                          | number =
                          event.target.value;

                        if (
                          assertion.type ===
                          "status"
                          ||
                          assertion.type ===
                          "response_time"
                        ) {
                          value =
                            Number(value);
                        }

                        const current = updated[index];
                        if (current) {
                          updated[index] = {
                            ...current,
                            expected: value,
                          };
                        }

                        setAssertions(updated);

                      }}
                      placeholder={
                        assertion.type ===
                        "body_contains"
                          ? "Expected text"
                          : assertion.type ===
                            "response_time"
                          ? "1000"
                          : "200"
                      }
                      className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"
                    />

                    <button
                      type="button"
                      onClick={() => {

                        setAssertions(
                          assertions.filter(
                            (_, i) =>
                              i !== index
                          )
                        );

                      }}
                      className="px-3 text-zinc-500 hover:text-red-400"
                    >
                      Remove
                    </button>

                  </div>
                )
              )}

            </div>

          </section>

          {/* Submit */}

          <div className="flex justify-end">

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-white px-6 py-3 font-medium text-black disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : "Save Test"}
            </button>

          </div>

        </form>

      </div>

    </main>
  );
}
