import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import type { Prisma } from "@prisma/client";

export async function testCaseRoutes(
  app: FastifyInstance
) {
  app.post(
    "/api/projects/:projectId/test-cases",
    async (request, reply) => {
      const { projectId } =
        request.params as {
          projectId: string;
        };

      const body =
        (request.body ?? {}) as {
          name?: string;
          method?: string;
          url?: string;
          headers?: Record<string, string>;
          body?: unknown;
          assertions?: unknown[];
        };

      if (!body.name?.trim()) {
        return reply.status(400).send({
          error: "Test case name is required",
        });
      }

      if (!body.method) {
        return reply.status(400).send({
          error: "Method is required",
        });
      }

      if (!body.url) {
        return reply.status(400).send({
          error: "URL is required",
        });
      }

      const project =
        await prisma.project.findUnique({
          where: {
            id: projectId,
          },
        });

      if (!project) {
        return reply.status(404).send({
          error: "Project not found",
        });
      }

      const data: Prisma.TestCaseUncheckedCreateInput = {
        projectId,
        name: body.name.trim(),
        method: body.method.toUpperCase(),
        url: body.url,
      };

      if (body.headers !== undefined) {
        data.headers = body.headers as Prisma.InputJsonValue;
      }

      if (body.body !== undefined) {
        data.body = body.body as Prisma.InputJsonValue;
      }

      if (body.assertions !== undefined) {
        data.assertions = body.assertions as Prisma.InputJsonValue;
      }

      const testCase = await prisma.testCase.create({
        data,
      });

      return reply.status(201).send(testCase);
    }
  );

  app.get(
    "/api/projects/:projectId/test-cases",
    async (request) => {
      const { projectId } =
        request.params as {
          projectId: string;
        };

      return prisma.testCase.findMany({
        where: {
          projectId,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }
  );

  app.post(
    "/api/test-cases",
    async (request, reply) => {
      try {
        const body = (request.body ?? {}) as {
          projectId?: string;
          name?: string;
          method?: string;
          url?: string;
          headers?: unknown;
          body?: unknown;
          assertions?: unknown;
        };

        if (!body.projectId) {
          return reply.status(400).send({
            error: "Project ID is required",
          });
        }

        if (!body.name?.trim()) {
          return reply.status(400).send({
            error: "Test name is required",
          });
        }

        if (!body.method) {
          return reply.status(400).send({
            error: "Method is required",
          });
        }

        if (!body.url) {
          return reply.status(400).send({
            error: "URL is required",
          });
        }

        const project = await prisma.project.findUnique({
          where: {
            id: body.projectId,
          },
        });

        if (!project) {
          return reply.status(404).send({
            error: "Project not found",
          });
        }

        const data: Prisma.TestCaseUncheckedCreateInput = {
          projectId: body.projectId,
          name: body.name.trim(),
          method: body.method.toUpperCase(),
          url: body.url,
        };

        if (body.headers !== undefined) {
          data.headers = body.headers as Prisma.InputJsonValue;
        }

        if (body.body !== undefined) {
          data.body = body.body as Prisma.InputJsonValue;
        }

        if (body.assertions !== undefined) {
          data.assertions = body.assertions as Prisma.InputJsonValue;
        }

        const testCase = await prisma.testCase.create({
          data,
        });

        return reply.status(201).send({
          testCase,
        });
      } catch (error) {
        console.error("Create test case error:", error);
        return reply.status(500).send({
          error: "Failed to create test case",
        });
      }
    }
  );
}
