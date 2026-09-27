interface TestRun {
  id: string;
  status: string;
  responseStatus: number | null;
  responseTime: number | null;
  startedAt: string;
}

interface ExecutionHistoryProps {
  runs: TestRun[];
}

export default function ExecutionHistory({
  runs,
}: ExecutionHistoryProps) {

  return (
    <section className="mt-8">

      <div className="mb-4">

        <h2 className="text-xl font-semibold">
          Execution History
        </h2>

        <p className="mt-1 text-sm text-zinc-500">
          Previous executions of this test.
        </p>

      </div>

      {runs.length === 0 ? (

        <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center text-zinc-500">
          No executions yet.
        </div>

      ) : (

        <div className="overflow-hidden rounded-xl border border-zinc-800">

          {runs.map((run) => {

            const passed =
              run.status === "PASSED";

            return (
              <div
                key={run.id}
                className="flex items-center justify-between border-b border-zinc-800 p-4 last:border-b-0"
              >

                <div className="flex items-center gap-4">

                  <span
                    className={
                      passed
                        ? "text-green-400"
                        : "text-red-400"
                    }
                  >
                    {passed
                      ? "✓"
                      : "✕"}
                  </span>

                  <div>

                    <p className="text-sm font-medium">
                      {run.status}
                    </p>

                    <p className="text-xs text-zinc-500">
                      {new Date(
                        run.startedAt
                      ).toLocaleString()}
                    </p>

                  </div>

                </div>

                <div className="flex items-center gap-6 text-sm text-zinc-500">

                  <span>
                    {run.responseStatus ??
                      "—"}
                  </span>

                  <span>
                    {run.responseTime !=
                    null
                      ? `${run.responseTime}ms`
                      : "—"}
                  </span>

                </div>

              </div>
            );
          })}

        </div>

      )}

    </section>
  );
}
