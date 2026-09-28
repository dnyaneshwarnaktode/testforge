import { prisma } from "../lib/prisma.js";
import {
  evaluateAssertions,
  isTestPassed,
  type Assertion,
  type TestResponse,
} from "./assertion-engine.js";
import { executeRequest } from "./api-executor.js";
import { Prisma } from "@prisma/client";

function tryParseJson(value: string): Prisma.InputJsonValue {
  try {
    return JSON.parse(value) as Prisma.InputJsonValue;
  } catch {
    return {
      raw: value,
    };
  }
}

export async function runTestCase(testCaseId: string) {
  const testCase = await prisma.testCase.findUnique({
    where: {
      id: testCaseId,
    },
  });

  if (!testCase) {
    throw new Error("Test case not found");
  }

  const startedAt = new Date();

  try {
    const result = await executeRequest({
      method: testCase.method,
      url: testCase.url,
      headers:
        (testCase.headers as Record<string, string> | null) ?? undefined,
      body: testCase.body,
    });

    const response: TestResponse = {
      status: result.status,
      responseTime: result.responseTime,
      body: result.body,
      error: result.error,
    };

    const assertions =
      (testCase.assertions as Assertion[] | null) ?? [];

    let assertionResults = evaluateAssertions(assertions, response);

    if (result.error && assertionResults.length === 0) {
      assertionResults = [
        {
          type: "status",
          passed: false,
          expected: "200 (Reachable Endpoint)",
          actual: null,
          message: `Endpoint unavailable: ${result.error}`,
        },
      ];
    }

    const passed = !result.error && isTestPassed(assertionResults);

    const testRun = await prisma.testRun.create({
      data: {
        testCaseId: testCase.id,
        status: passed ? "PASSED" : "FAILED",
        responseStatus: result.status,
        responseTime: result.responseTime,
        responseBody: tryParseJson(result.body),
        startedAt,
        completedAt: new Date(),

        assertionResults: {
          create: assertionResults.map((assertion) => {
            const item: Prisma.AssertionResultCreateWithoutTestRunInput = {
              type: assertion.type,
              passed: assertion.passed,
              message: assertion.message,
            };
            if (assertion.expected !== undefined) {
              item.expected = assertion.expected as Prisma.InputJsonValue;
            }
            if (assertion.actual !== undefined) {
              item.actual = assertion.actual as Prisma.InputJsonValue;
            }
            return item;
          }),
        },
      },
      include: {
        assertionResults: true,
      },
    });

    return testRun;
  } catch (error) {
    const errMessage =
      error instanceof Error ? error.message : "Test execution failed";

    const testRun = await prisma.testRun.create({
      data: {
        testCaseId: testCase.id,
        status: "FAILED",
        responseStatus: null,
        responseTime: 0,
        responseBody: { error: "Execution Error", message: errMessage },
        startedAt,
        completedAt: new Date(),
        assertionResults: {
          create: [
            {
              type: "status",
              passed: false,
              expected: "Reachable Endpoint",
              actual: Prisma.JsonNull,
              message: `Execution failed: ${errMessage}`,
            },
          ],
        },
      },
      include: {
        assertionResults: true,
      },
    });

    return testRun;
  }
}
