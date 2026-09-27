"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";

interface Analysis {
  summary: string;
  likelyCause: string;
  evidence: string[];
  suggestions: string[];
  confidence: "low" | "medium" | "high";
}

interface Props {
  runId: string;
}

export default function AIFailureAnalysis({ runId }: Props) {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function analyze() {
    try {
      setLoading(true);
      setError("");

      const result = await apiFetch<{
        analysis: Analysis;
      }>(`/api/test-runs/${runId}/analyze`, {
        method: "POST",
      });

      setAnalysis(result.analysis);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Analysis failed"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <span>🤖</span> AI Failure Analysis
          </h3>
          <p className="mt-1 text-sm text-zinc-500">
            Use AI to understand why this test failed.
          </p>
        </div>

        {!analysis && (
          <button
            type="button"
            onClick={analyze}
            disabled={loading}
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            {loading ? "Analyzing..." : "Analyze Failure"}
          </button>
        )}
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-400">{error}</p>
      )}

      {analysis && (
        <div className="mt-6 space-y-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">
              Summary
            </p>
            <p className="mt-2 text-sm text-zinc-200">{analysis.summary}</p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">
              Likely Cause
            </p>
            <p className="mt-2 text-sm text-zinc-200">{analysis.likelyCause}</p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">
              Evidence
            </p>
            <ul className="mt-2 space-y-2">
              {analysis.evidence.map((item, index) => (
                <li key={index} className="text-sm text-zinc-300">
                  • {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">
              Suggested Fixes
            </p>
            <ol className="mt-2 space-y-2">
              {analysis.suggestions.map((item, index) => (
                <li key={index} className="text-sm text-zinc-300">
                  {index + 1}. {item}
                </li>
              ))}
            </ol>
          </div>

          <div className="flex items-center">
            <span className="text-xs text-zinc-500">Confidence</span>
            <span
              className={`ml-2 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                analysis.confidence === "high"
                  ? "bg-green-500/10 text-green-400 border border-green-500/20"
                  : analysis.confidence === "medium"
                  ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                  : "bg-zinc-800 text-zinc-400 border border-zinc-700"
              }`}
            >
              {analysis.confidence}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
