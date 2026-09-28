import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { runTestCase } from "../services/test-runner.js";
import { requireAuth } from "../lib/auth.js";

export async function testRunRoutes(app: FastifyInstance) {
  // Execute a test case - requires ownership of the project it belongs to
  app.post(
    "/api/test-cases/:testCaseId/run",
    async (request, reply) => {
      const { testCaseId } = request.params as {
        testCaseId: string;
      };

      const userId = await requireAuth(request, reply);
      if (!userId) return;

      const testCase = await prisma.testCase.findUnique({
        where: { id: testCaseId },
        include: { project: true },
      });

      if (!testCase) {
        return reply.status(404).send({
          error: "Not Found",
          message: "Test case not found",
        });
      }

      const projectOwnerId = (testCase.project as { userId?: string | null }).userId;
      if (projectOwnerId && projectOwnerId !== userId) {
        return reply.status(403).send({
          error: "Forbidden",
          message: "Access denied. You do not own the project for this test case.",
        });
      }

      try {
        const result = await runTestCase(testCaseId);
        return reply.send(result);
      } catch (error) {
        return reply.status(500).send({
          error:
            error instanceof Error
              ? error.message
              : "Test execution failed",
        });
      }
    }
  );

  // Get test run history - requires ownership of the project
  app.get(
    "/api/test-cases/:testCaseId/runs",
    async (request, reply) => {
      const { testCaseId } = request.params as {
        testCaseId: string;
      };

      const userId = await requireAuth(request, reply);
      if (!userId) return;

      const testCase = await prisma.testCase.findUnique({
        where: { id: testCaseId },
        include: { project: true },
      });

      if (!testCase) {
        return reply.status(404).send({
          error: "Not Found",
          message: "Test case not found",
        });
      }

      const projectOwnerId = (testCase.project as { userId?: string | null }).userId;
      if (projectOwnerId && projectOwnerId !== userId) {
        return reply.status(403).send({
          error: "Forbidden",
          message: "Access denied. You do not own the project for this test case.",
        });
      }

      return prisma.testRun.findMany({
        where: {
          testCaseId,
        },
        include: {
          assertionResults: true,
        },
        orderBy: {
          startedAt: "desc",
        },
      });
    }
  );
}
