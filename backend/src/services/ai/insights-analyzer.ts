import Groq from "groq-sdk";
import { z } from "zod";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export const insightsSchema = z.object({
  summary: z.string(),
  recurringIssues: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      count: z.string().or(z.number()),
    })
  ),
  systemicSuggestions: z.array(z.string()),
});

export type ProjectInsights = z.infer<typeof insightsSchema>;

export interface FailureSummaryItem {
  testName: string;
  method: string;
  url: string;
  status: number | null;
  responseTime: number | null;
  failedAssertions: string[];
}

const SYSTEM_PROMPT = `
You are an expert QA and API reliability engineering assistant.

Analyze the aggregate API failure records across recent test runs.
Identify patterns, recurring issues, common bottlenecks, and systemic suggestions.

Return ONLY valid JSON with this exact structure:
{
  "summary": "High-level diagnostic summary of recurring failure trends",
  "recurringIssues": [
    {
      "title": "Short title describing the issue category (e.g. Authentication Rejections, High Latency)",
      "description": "Explanation of how and why this occurs across the endpoints",
      "count": "Estimated or exact count / frequency (e.g., 3 failures or 60%)"
    }
  ],
  "systemicSuggestions": [
    "Practical architectural or engineering action items to permanently resolve these failure modes"
  ]
}
`;

function cleanJson(content: string): string {
  const trimmed = content.trim();

  if (trimmed.startsWith("```")) {
    return trimmed
      .replace(/^```json\s*/, "")
      .replace(/^```\s*/, "")
      .replace(/\s*```$/, "");
  }

  const jsonMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch && jsonMatch[1]) {
    return jsonMatch[1].trim();
  }

  return trimmed;
}

export async function analyzeProjectFailures(
  failures: FailureSummaryItem[]
): Promise<ProjectInsights> {
  const prompt = `
Analyze these API test run failures to identify systemic root causes and patterns:

${JSON.stringify(failures, null, 2)}
`;

  const completion = await groq.chat.completions.create({
    model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
    temperature: 0.1,
    messages: [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("AI returned empty insights");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleanJson(content));
  } catch {
    throw new Error("AI returned invalid JSON for insights");
  }

  return insightsSchema.parse(parsed);
}
