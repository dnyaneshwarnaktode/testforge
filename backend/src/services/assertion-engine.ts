export type AssertionType =
  | "status"
  | "response_time"
  | "body_contains";

export interface Assertion {
  type: AssertionType;
  expected: unknown;
}

export interface TestResponse {
  status: number;
  responseTime: number;
  body: string;
}

export interface AssertionResult {
  type: AssertionType;
  passed: boolean;
  expected: unknown;
  actual: unknown;
  message: string;
}

export function evaluateAssertion(
  assertion: Assertion,
  response: TestResponse
): AssertionResult {
  switch (assertion.type) {
    case "status": {
      const actual = response.status;
      const expected = assertion.expected;

      const passed = actual === expected;

      return {
        type: assertion.type,
        passed,
        expected,
        actual,
        message: passed
          ? `Status code is ${actual}`
          : `Expected status ${expected} but received ${actual}`,
      };
    }

    case "response_time": {
      const actual = response.responseTime;
      const expected =
        assertion.expected as number;

      const passed = actual < expected;

      return {
        type: assertion.type,
        passed,
        expected,
        actual,
        message: passed
          ? `Response time ${actual}ms is below ${expected}ms`
          : `Response time ${actual}ms exceeded ${expected}ms`,
      };
    }

    case "body_contains": {
      const actual = response.body;

      const expected = String(
        assertion.expected
      );

      const passed =
        actual.includes(expected);

      return {
        type: assertion.type,
        passed,
        expected,
        actual: passed
          ? expected
          : "Text not found",
        message: passed
          ? `Response contains "${expected}"`
          : `Response does not contain "${expected}"`,
      };
    }

    default:
      throw new Error(
        `Unsupported assertion type: ${(assertion as { type: string }).type}`
      );
  }
}

export function evaluateAssertions(
  assertions: Assertion[],
  response: TestResponse
): AssertionResult[] {
  return assertions.map((assertion) =>
    evaluateAssertion(
      assertion,
      response
    )
  );
}

export function isTestPassed(
  results: AssertionResult[]
): boolean {
  return results.every(
    (result) => result.passed
  );
}
