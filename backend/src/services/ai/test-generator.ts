import Groq from "groq-sdk";
import { z } from "zod";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export interface GeneratedAssertion {
  type:
    | "status"
    | "response_time"
    | "body_contains";

  expected: string | number;
}

export interface GeneratedTest {
  name: string;

  method:
    | "GET"
    | "POST"
    | "PUT"
    | "PATCH"
    | "DELETE";

  url: string;

  headers?: Record<string, string> | undefined;

  body?: unknown;

  assertions: GeneratedAssertion[];
}

const assertionSchema =
  z.object({
    type: z.enum([
      "status",
      "response_time",
      "body_contains",
    ]),

    expected: z.union([
      z.string(),
      z.number(),
    ]),
  });

const generatedTestSchema =
  z.object({
    name: z.string().min(1),

    method: z.enum([
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
    ]),

    url: z.string().min(1),

    headers: z
      .record(z.string(), z.string())
      .optional(),

    body: z.unknown().optional(),

    assertions: z
      .array(assertionSchema)
      .min(1),
  });

const generatedTestsSchema =
  z.object({
    tests: z
      .array(generatedTestSchema)
      .min(1)
      .max(10),
  });

const SYSTEM_PROMPT = `
You are an expert API testing assistant.

Your job is to generate API test cases
from the user's description.

Return ONLY valid JSON.

The JSON must have this structure:

{
  "tests": [
    {
      "name": "string",
      "method": "GET | POST | PUT | PATCH | DELETE",
      "url": "string",
      "headers": {},
      "body": {},
      "assertions": [
        {
          "type": "status | response_time | body_contains",
          "expected": "string or number"
        }
      ]
    }
  ]
}

Rules:

1. Generate happy-path tests.

2. Generate important negative tests.

3. Test missing required fields when
   request bodies are provided.

4. Test invalid values when they can
   reasonably be inferred.

5. Test authentication failures when
   authentication is mentioned.

6. Test HTTP status codes.

7. Test important response fields
   when they are explicitly described.

8. Avoid duplicate tests.

9. Do not invent undocumented
   business rules.

10. Every generated test must contain
    at least one assertion.

11. Generate between 1 and 10 tests.

12. Return JSON only.
`;

function cleanJson(
  content: string
): string {

  const trimmed =
    content.trim();

  if (
    trimmed.startsWith("```")
  ) {

    return trimmed
      .replace(/^```json\s*/, "")
      .replace(/^```\s*/, "")
      .replace(/\s*```$/, "");

  }

  return trimmed;
}

export async function generateTests(
  description: string
): Promise<GeneratedTest[]> {

  const completion =
    await groq.chat.completions.create({

      model:
        process.env.GROQ_MODEL ||
        "openai/gpt-oss-120b",

      temperature: 0.2,

      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },

        {
          role: "user",
          content: description,
        },
      ],
    });

  const content =
    completion.choices[0]
      ?.message
      ?.content;

  if (!content) {
    throw new Error(
      "AI returned an empty response"
    );
  }

  let parsed: unknown;

  try {

    parsed = JSON.parse(
      cleanJson(content)
    );

  } catch {

    throw new Error(
      "AI returned invalid JSON"
    );

  }

  const validated =
    generatedTestsSchema.parse(
      parsed
    );

  return validated.tests;
}
