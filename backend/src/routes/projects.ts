import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";

export async function projectRoutes(
  app: FastifyInstance
) {
  app.post("/api/projects", async (request, reply) => {
    const body = request.body as {
      name?: string;
    };

    if (!body?.name?.trim()) {
      return reply.status(400).send({
        error: "Project name is required",
      });
    }

    const project = await prisma.project.create({
      data: {
        name: body.name.trim(),
      },
    });

    return reply.status(201).send(project);
  });

  app.get("/api/projects", async () => {
    return prisma.project.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
  });

  app.get(
    "/api/projects/:projectId/stats",
    async (request, reply) => {
      const { projectId } = request.params as {
        projectId: string;
      };

      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        return reply.status(404).send({
          error: "Project not found",
        });
      }

      const totalTests = await prisma.testCase.count({
        where: { projectId },
      });

      const runs = await prisma.testRun.findMany({
        where: {
          testCase: {
            projectId,
          },
        },
        select: {
          status: true,
        },
      });

      const totalRuns = runs.length;
      const passed = runs.filter((r) => r.status === "PASSED").length;
      const failed = runs.filter((r) => r.status === "FAILED").length;
      const passRate =
        totalRuns > 0
          ? Number(((passed / totalRuns) * 100).toFixed(1))
          : 0;

      return {
        totalTests,
        totalRuns,
        passed,
        failed,
        passRate,
      };
    }
  );

  app.post(
    "/api/projects/:projectId/insights",
    async (request, reply) => {
      const { projectId } = request.params as {
        projectId: string;
      };

      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        return reply.status(404).send({
          error: "Project not found",
        });
      }

      const recentRuns = await prisma.testRun.findMany({
        where: {
          testCase: {
            projectId,
          },
        },
        include: {
          testCase: true,
          assertionResults: true,
        },
        orderBy: {
          startedAt: "desc",
        },
        take: 50,
      });

      const failedRuns = recentRuns.filter((r) => r.status === "FAILED");

      if (failedRuns.length === 0) {
        return {
          insights: {
            summary:
              recentRuns.length === 0
                ? "No test executions recorded yet for this project. Run tests to enable failure insights."
                : "All recent test executions passed! Endpoints are performing within expected limits.",
            recurringIssues: [],
            systemicSuggestions: [
              "Maintain high test coverage by testing both happy paths and edge cases.",
            ],
          },
        };
      }

      const failureSummaries = failedRuns.map((r) => ({
        testName: r.testCase.name,
        method: r.testCase.method,
        url: r.testCase.url,
        status: r.responseStatus,
        responseTime: r.responseTime,
        failedAssertions: r.assertionResults
          .filter((a) => !a.passed)
          .map((a) => a.message),
      }));

      try {
        const { analyzeProjectFailures } = await import(
          "../services/ai/insights-analyzer.js"
        );

        const insights = await analyzeProjectFailures(failureSummaries);
        return { insights };
      } catch (err) {
        console.error("Project insights generation error:", err);
        return reply.status(500).send({
          error:
            err instanceof Error
              ? err.message
              : "Failed to generate project insights",
        });
      }
    }
  );
}
