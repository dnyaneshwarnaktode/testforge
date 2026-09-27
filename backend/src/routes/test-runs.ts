import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { runTestCase } from "../services/test-runner.js";

export async function testRunRoutes(
  app: FastifyInstance
) {
  app.post(
    "/api/test-cases/:testCaseId/run",
    async (request, reply) => {
      const { testCaseId } =
        request.params as {
          testCaseId: string;
        };

      try {
        const result =
          await runTestCase(
            testCaseId
          );

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

  app.get(
    "/api/test-cases/:testCaseId/runs",
    async (request) => {
      const { testCaseId } =
        request.params as {
          testCaseId: string;
        };

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
