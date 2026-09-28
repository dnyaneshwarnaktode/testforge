import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { generateTests } from "../services/ai/test-generator.js";
import {
  analyzeFailure,
  type FailureContext,
} from "../services/ai/failure-analyzer.js";
import { requireAuth } from "../lib/auth.js";

export async function aiRoutes(app: FastifyInstance) {
  // Generate tests with AI - requires authenticated session
  app.post("/api/ai/generate-tests", async (request, reply) => {
    const userId = await requireAuth(request, reply);
    if (!userId) return;

    const body = (request.body ?? {}) as {
      description?: string;
    };

    if (!body.description || !body.description.trim()) {
      return reply.status(400).send({
        error: "Description is required",
      });
    }

    try {
      const tests = await generateTests(body.description);
      return { tests };
    } catch (error) {
      console.error("AI generation error:", error);
      return reply.status(500).send({
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate tests",
      });
    }
  });

  // Analyze failure - requires authenticated session
  app.post("/api/ai/analyze-failure", async (request, reply) => {
    const userId = await requireAuth(request, reply);
    if (!userId) return;

    try {
      const context = request.body as FailureContext;
      const analysis = await analyzeFailure(context);
      return { analysis };
    } catch (error) {
      console.error("Failure analysis error:", error);
      return reply.status(500).send({
        error: "Failed to analyze test failure",
      });
    }
  });

  // Analyze specific test run - requires ownership of the project
  app.post("/api/test-runs/:runId/analyze", async (request, reply) => {
    const { runId } = request.params as {
      runId: string;
    };

    const userId = await requireAuth(request, reply);
    if (!userId) return;

    try {
      const run = await prisma.testRun.findUnique({
        where: { id: runId },
        include: {
          testCase: {
            include: {
              project: true,
            },
          },
          assertionResults: true,
        },
      });

      if (!run) {
        return reply.status(404).send({
          error: "Not Found",
          message: "Test run not found",
        });
      }

      if (
        run.testCase.project.userId &&
        run.testCase.project.userId !== userId
      ) {
        return reply.status(403).send({
          error: "Forbidden",
          message: "Access denied. You do not own the project for this test run.",
        });
      }

      if (run.status !== "FAILED") {
        return reply.status(400).send({
          error: "AI analysis is only available for failed tests",
        });
      }

      const context: FailureContext = {
        test: {
          name: run.testCase.name,
          method: run.testCase.method,
          url: run.testCase.url,
          headers: run.testCase.headers,
          body: run.testCase.body,
        },
        assertions: run.assertionResults.map((assertion) => ({
          type: assertion.type,
          expected: assertion.expected,
          actual: assertion.actual,
          passed: assertion.passed,
          message: assertion.message,
        })),
        response: {
          status: run.responseStatus,
          responseTime: run.responseTime,
          body: run.responseBody,
        },
      };

      const analysis = await analyzeFailure(context);
      return { analysis };
    } catch (error) {
      console.error("Run analysis error:", error);
      return reply.status(500).send({
        error: "Failed to analyze test run",
      });
    }
  });
}
