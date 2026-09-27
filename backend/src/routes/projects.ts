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
}
