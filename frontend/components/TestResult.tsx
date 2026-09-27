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
  status: string;
  responseStatus: number | null;
  responseTime: number | null;
  responseBody: unknown;
  startedAt: string;
  completedAt: string | null;
  assertionResults: AssertionResult[];
}

interface TestResultProps {
  run: TestRun;
}

export default function TestResult({
  run,
}: TestResultProps) {
  const passed = run.status === "PASSED";

  return (
    <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/40">

      {/* Header */}

      <div className="flex items-center justify-between border-b border-zinc-800 p-5">

        <div>

          <h3 className="font-semibold">
            Test Result
          </h3>

          <p className="mt-1 text-sm text-zinc-500">
            {new Date(
              run.startedAt
            ).toLocaleString()}
          </p>

        </div>

        <span
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            passed
              ? "bg-green-500/10 text-green-400"
              : "bg-red-500/10 text-red-400"
          }`}
        >
          {passed ? "✓ PASSED" : "✕ FAILED"}
        </span>

      </div>

      {/* Summary */}

      <div className="grid grid-cols-2 gap-4 border-b border-zinc-800 p-5 md:grid-cols-3">

        <div>
          <p className="text-xs text-zinc-500">
            HTTP Status
          </p>

          <p className="mt-1 text-lg font-semibold">
            {run.responseStatus ?? "—"}
          </p>
        </div>

        <div>
          <p className="text-xs text-zinc-500">
            Response Time
          </p>

          <p className="mt-1 text-lg font-semibold">
            {run.responseTime != null
              ? `${run.responseTime}ms`
              : "—"}
          </p>
        </div>

        <div>
          <p className="text-xs text-zinc-500">
            Assertions
          </p>

          <p className="mt-1 text-lg font-semibold">
            {
              run.assertionResults.filter(
                (item) => item.passed
              ).length
            }
            /
            {run.assertionResults.length}
          </p>
        </div>

      </div>

      {/* Assertions */}

      <div className="border-b border-zinc-800 p-5">

        <h4 className="font-medium">
          Assertions
        </h4>

        <div className="mt-4 space-y-3">

          {run.assertionResults.map(
            (assertion) => (
              <div
                key={assertion.id}
                className="flex items-start justify-between rounded-lg border border-zinc-800 p-4"
              >

                <div>

                  <p className="font-medium">
                    {formatAssertionType(
                      assertion.type
                    )}
                  </p>

                  <p className="mt-1 text-sm text-zinc-500">
                    {assertion.message}
                  </p>

                </div>

                <span
                  className={
                    assertion.passed
                      ? "text-green-400"
                      : "text-red-400"
                  }
                >
                  {assertion.passed
                    ? "✓"
                    : "✕"}
                </span>

              </div>
            )
          )}

        </div>

      </div>

      {/* Response */}

      <div className="p-5">

        <h4 className="font-medium">
          Response Body
        </h4>

        <pre className="mt-4 max-h-[400px] overflow-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300">
          {JSON.stringify(
            run.responseBody,
            null,
            2
          )}
        </pre>

      </div>

    </div>
  );
}

function formatAssertionType(
  type: string
) {
  switch (type) {
    case "status":
      return "HTTP Status";

    case "response_time":
      return "Response Time";

    case "body_contains":
      return "Body Contains";

    default:
      return type;
  }
}
