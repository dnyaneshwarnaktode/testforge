import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { requireAuth, verifyProjectOwnership } from "../lib/auth.js";

export async function projectRoutes(app: FastifyInstance) {
  // Create a new project - strictly requires authentication
  app.post("/api/projects", async (request, reply) => {
    const userId = await requireAuth(request, reply);
    if (!userId) return;

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
        userId,
      } as any,
    });

    return reply.status(201).send(project);
  });

  // List projects for the authenticated tenant only
  app.get("/api/projects", async (request, reply) => {
    const userId = await requireAuth(request, reply);
    if (!userId) return;

    return prisma.project.findMany({
      where: {
        userId,
      } as any,
      orderBy: {
        createdAt: "desc",
      },
    });
  });

  // Claim legacy unowned projects for the current user
  app.post("/api/projects/claim-legacy", async (request, reply) => {
    const userId = await requireAuth(request, reply);
    if (!userId) return;

    const result = await prisma.project.updateMany({
      where: {
        userId: null,
      } as any,
      data: {
        userId,
      } as any,
    });

    return reply.send({
      message: `Successfully claimed ${result.count} legacy projects to your account.`,
      claimed: result.count,
    });
  });

  // Get project details with ownership verification
  app.get("/api/projects/:projectId", async (request, reply) => {
    const { projectId } = request.params as {
      projectId: string;
    };

    const authResult = await verifyProjectOwnership(request, reply, projectId);
    if (!authResult) return;

    return authResult.project;
  });

  // Get project stats with ownership verification
  app.get(
    "/api/projects/:projectId/stats",
    async (request, reply) => {
      const { projectId } = request.params as {
        projectId: string;
      };

      const authResult = await verifyProjectOwnership(request, reply, projectId);
      if (!authResult) return;

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

  // Generate AI insights with ownership verification
  app.post(
    "/api/projects/:projectId/insights",
    async (request, reply) => {
      const { projectId } = request.params as {
        projectId: string;
      };

      const authResult = await verifyProjectOwnership(request, reply, projectId);
      if (!authResult) return;

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
