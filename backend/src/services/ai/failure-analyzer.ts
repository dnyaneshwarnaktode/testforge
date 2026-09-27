import Groq from "groq-sdk";
import { z } from "zod";
import { redactHeaders } from "../../utils/redact-secrets.js";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export const failureAnalysisSchema = z.object({
  summary: z.string(),

  likelyCause: z.string(),

  evidence: z.array(z.string()).min(1),

  suggestions: z.array(z.string()).min(1),

  confidence: z.enum(["low", "medium", "high"]),
});

export type FailureAnalysis = z.infer<typeof failureAnalysisSchema>;

export interface FailureContext {
  test: {
    name: string;
    method: string;
    url: string;
    headers?: unknown;
    body?: unknown;
  };

  assertions: Array<{
    type: string;
    expected: unknown;
    actual: unknown;
    passed: boolean;
    message: string;
  }>;

  response: {
    status: number | null;
    responseTime: number | null;
    body: unknown;
  };
}

const SYSTEM_PROMPT = `
You are an API debugging assistant.

Analyze API test failures using ONLY
the evidence provided by the application.

Your job is to:

1. Explain what failed.
2. Identify the most likely cause.
3. Cite concrete evidence.
4. Suggest practical debugging steps.
5. Clearly distinguish evidence from hypotheses.
6. Do not claim certainty when the evidence
   is insufficient.

Return ONLY valid JSON.

Use exactly this structure:

{
  "summary": "string",
  "likelyCause": "string",
  "evidence": [
    "string"
  ],
  "suggestions": [
    "string"
  ],
  "confidence": "low | medium | high"
}

Do not invent API behavior that is not
supported by the supplied evidence.
`;

export async function analyzeFailure(
  context: FailureContext
): Promise<FailureAnalysis> {
  const safeHeaders =
    context.test.headers && typeof context.test.headers === "object"
      ? redactHeaders(
          context.test.headers as Record<string, unknown>
        )
      : context.test.headers;

  const safeTest = {
    ...context.test,
    headers: safeHeaders,
  };

  const userPrompt = `
Analyze the following failed API test.

TEST:
${JSON.stringify(safeTest, null, 2)}

ASSERTIONS:
${JSON.stringify(context.assertions, null, 2)}

RESPONSE:
${JSON.stringify(context.response, null, 2)}
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
        content: userPrompt,
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;

  if (!content) {
    throw new Error("AI returned an empty response");
  }

  return parseFailureAnalysis(content);
}

function parseFailureAnalysis(content: string): FailureAnalysis {
  const cleaned = cleanJson(content);

  let parsed: unknown;

  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("AI returned invalid JSON");
  }

  return failureAnalysisSchema.parse(parsed);
}

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
