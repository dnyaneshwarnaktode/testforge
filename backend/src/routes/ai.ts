import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { generateTests } from "../services/ai/test-generator.js";
import {
  analyzeFailure,
  type FailureContext,
} from "../services/ai/failure-analyzer.js";

export async function aiRoutes(
  app: FastifyInstance
) {
  app.post(
    "/api/ai/generate-tests",
    async (request, reply) => {
      const body =
        (request.body ?? {}) as {
          description?: string;
        };

      if (
        !body.description ||
        !body.description.trim()
      ) {
        return reply
          .status(400)
          .send({
            error:
              "Description is required",
          });
      }

      try {
        const tests =
          await generateTests(
            body.description
          );

        return {
          tests,
        };
      } catch (error) {
        console.error(
          "AI generation error:",
          error
        );

        return reply
          .status(500)
          .send({
            error:
              error instanceof Error
                ? error.message
                : "Failed to generate tests",
          });
      }
    }
  );

  app.post(
    "/api/ai/analyze-failure",
    async (
      request,
      reply
    ) => {
      try {
        const context =
          request.body as FailureContext;

        const analysis =
          await analyzeFailure(
            context
          );

        return {
          analysis,
        };
      } catch (error) {
        console.error(
          "Failure analysis error:",
          error
        );

        return reply
          .status(500)
          .send({
            error:
              "Failed to analyze test failure",
          });
      }
    }
  );

  app.post(
    "/api/test-runs/:runId/analyze",
    async (
      request,
      reply
    ) => {
      const { runId } =
        request.params as {
          runId: string;
        };

      try {
        const run =
          await prisma.testRun.findUnique({
            where: {
              id: runId,
            },
            include: {
              testCase: true,
              assertionResults: true,
            },
          });

        if (!run) {
          return reply
            .status(404)
            .send({
              error:
                "Test run not found",
            });
        }

        if (run.status !== "FAILED") {
          return reply
            .status(400)
            .send({
              error:
                "AI analysis is only available for failed tests",
            });
        }

        const context: FailureContext = {
          test: {
            name:
              run.testCase.name,
            method:
              run.testCase.method,
            url:
              run.testCase.url,
            headers:
              run.testCase.headers,
            body:
              run.testCase.body,
          },
          assertions:
            run.assertionResults.map(
              (assertion) => ({
                type:
                  assertion.type,
                expected:
                  assertion.expected,
                actual:
                  assertion.actual,
                passed:
                  assertion.passed,
                message:
                  assertion.message,
              })
            ),
          response: {
            status:
              run.responseStatus,
            responseTime:
              run.responseTime,
            body:
              run.responseBody,
          },
        };

        const analysis =
          await analyzeFailure(
            context
          );

        return {
          analysis,
        };
      } catch (error) {
        console.error(
          "Run analysis error:",
          error
        );

        return reply
          .status(500)
          .send({
            error:
              "Failed to analyze test run",
          });
      }
    }
  );
}

