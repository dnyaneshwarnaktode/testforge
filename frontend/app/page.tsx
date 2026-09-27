"use client";

import { useState } from "react";

type Method =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE";

interface HeaderRow {
  key: string;
  value: string;
}

export default function Home() {
  const [method, setMethod] =
    useState<Method>("GET");

  const [url, setUrl] = useState("");

  const [headers, setHeaders] =
    useState<HeaderRow[]>([
      {
        key: "",
        value: "",
      },
    ]);

  const [requestBody, setRequestBody] =
    useState("");

  const [response, setResponse] =
    useState("");

  const [status, setStatus] =
    useState<number | null>(null);

  const [responseTime, setResponseTime] =
    useState<number | null>(null);

  const [loading, setLoading] =
    useState(false);

  function updateHeader(
    index: number,
    field: "key" | "value",
    value: string
  ) {
    const updated = [...headers];
    const currentRow = updated[index];
    if (currentRow) {
      updated[index] = {
        ...currentRow,
        [field]: value,
      };
    }
    setHeaders(updated);
  }

  function addHeader() {
    setHeaders([
      ...headers,
      {
        key: "",
        value: "",
      },
    ]);
  }

  function removeHeader(index: number) {
    setHeaders(
      headers.filter(
        (_, headerIndex) =>
          headerIndex !== index
      )
    );
  }

  async function executeRequest() {
    setLoading(true);
    setResponse("");
    setStatus(null);
    setResponseTime(null);

    try {
      const headerObject: Record<
        string,
        string
      > = {};

      headers.forEach((header) => {
        if (
          header.key.trim() &&
          header.value.trim()
        ) {
          headerObject[header.key.trim()] =
            header.value.trim();
        }
      });

      let parsedBody: unknown = undefined;

      if (requestBody.trim()) {
        parsedBody =
          JSON.parse(requestBody);
      }

      const result = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/execute`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            method,
            url,
            headers: headerObject,
            body: parsedBody,
          }),
        }
      );

      const data = await result.json();

      if (!result.ok) {
        setStatus(result.status);
        setResponse(
          JSON.stringify(
            data,
            null,
            2
          )
        );

        return;
      }

      setStatus(data.status);
      setResponseTime(
        data.responseTime
      );

      try {
        const formatted =
          JSON.stringify(
            JSON.parse(data.body),
            null,
            2
          );

        setResponse(formatted);
      } catch {
        setResponse(data.body);
      }
    } catch (error) {
      if (
        error instanceof SyntaxError
      ) {
        setResponse(
          "Invalid JSON body."
        );
      } else {
        setResponse(
          "Failed to execute request."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">

      <div className="mx-auto max-w-6xl">

        <h1 className="text-3xl font-bold">
          TestForge
        </h1>

        <p className="mt-2 text-zinc-400">
          API Playground
        </p>

        {/* Request */}

        <section className="mt-8 rounded-xl border border-zinc-800 p-6">

          <div className="flex gap-3">

            <select
              value={method}
              onChange={(event) =>
                setMethod(
                  event.target.value as Method
                )
              }
              className="rounded-lg bg-zinc-900 border border-zinc-700 px-4 py-3"
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
              placeholder="https://example.com/api/users"
              className="flex-1 rounded-lg bg-zinc-900 border border-zinc-700 px-4 py-3"
            />

            <button
              onClick={executeRequest}
              disabled={loading}
              className="rounded-lg bg-white px-5 py-3 font-medium text-black disabled:opacity-50"
            >
              {loading
                ? "Executing..."
                : "Execute"}
            </button>

          </div>

          {/* Headers */}

          <div className="mt-8">

            <div className="flex items-center justify-between">

              <h2 className="text-lg font-semibold">
                Headers
              </h2>

              <button
                onClick={addHeader}
                className="text-sm text-zinc-300 hover:text-white"
              >
                + Add header
              </button>

            </div>

            <div className="mt-3 space-y-2">

              {headers.map(
                (header, index) => (
                  <div
                    key={index}
                    className="flex gap-2"
                  >

                    <input
                      value={header.key}
                      onChange={(event) =>
                        updateHeader(
                          index,
                          "key",
                          event.target.value
                        )
                      }
                      placeholder="Header name"
                      className="flex-1 rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2"
                    />

                    <input
                      value={header.value}
                      onChange={(event) =>
                        updateHeader(
                          index,
                          "value",
                          event.target.value
                        )
                      }
                      placeholder="Header value"
                      className="flex-1 rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2"
                    />

                    <button
                      onClick={() =>
                        removeHeader(index)
                      }
                      className="px-3 text-zinc-500 hover:text-white"
                    >
                      ×
                    </button>

                  </div>
                )
              )}

            </div>

          </div>

          {/* Body */}

          <div className="mt-8">

            <h2 className="text-lg font-semibold">
              Request Body
            </h2>

            <textarea
              value={requestBody}
              onChange={(event) =>
                setRequestBody(
                  event.target.value
                )
              }
              placeholder={`{
  "name": "John",
  "email": "john@example.com"
}`}
              className="mt-3 h-48 w-full rounded-lg bg-zinc-900 border border-zinc-700 p-4 font-mono text-sm"
            />

          </div>

        </section>

        {/* Response */}

        <section className="mt-6 rounded-xl border border-zinc-800 p-6">

          <h2 className="text-lg font-semibold">
            Response
          </h2>

          <div className="mt-4 flex gap-8">

            <div>
              <p className="text-sm text-zinc-500">
                Status
              </p>

              <p className="mt-1 font-medium">
                {status ?? "-"}
              </p>
            </div>

            <div>
              <p className="text-sm text-zinc-500">
                Response Time
              </p>

              <p className="mt-1 font-medium">
                {responseTime !== null
                  ? `${responseTime} ms`
                  : "-"}
              </p>
            </div>

          </div>

          <pre className="mt-6 max-h-[500px] overflow-auto rounded-lg bg-zinc-900 p-5 text-sm">
            {response ||
              "No response yet."}
          </pre>

        </section>

      </div>

    </main>
  );
}