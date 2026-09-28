import type { FastifyRequest, FastifyReply } from "fastify";
import { getAuth } from "@clerk/fastify";
import { prisma } from "./prisma.js";

/**
 * Requires an authenticated user session.
 * If unauthenticated, replies with 401 Unauthorized and returns null.
 */
export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<string | null> {
  const auth = getAuth(request);
  if (!auth?.userId) {
    reply.status(401).send({
      error: "Unauthorized",
      message: "Authentication required to access this resource",
    });
    return null;
  }
  return auth.userId;
}

/**
 * Verifies that the authenticated user owns the specified project.
 * If unauthorized, sends 401/403/404 reply and returns null.
 */
export async function verifyProjectOwnership(
  request: FastifyRequest,
  reply: FastifyReply,
  projectId: string
) {
  const userId = await requireAuth(request, reply);
  if (!userId) return null;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    reply.status(404).send({
      error: "Not Found",
      message: "Project not found",
    });
    return null;
  }

  // If the project has an owner and it doesn't match the current user, forbid access
  const projectOwnerId = (project as { userId?: string | null }).userId;
  if (projectOwnerId && projectOwnerId !== userId) {
    reply.status(403).send({
      error: "Forbidden",
      message: "Access denied. You do not own this project.",
    });
    return null;
  }

  // If project is legacy unowned (userId === null), automatically bind it to the requesting user to prevent cross-tenant sharing
  if (!projectOwnerId) {
    const updated = await prisma.project.update({
      where: { id: projectId },
      data: { userId } as any,
    });
    return { userId, project: updated };
  }

  return { userId, project };
}
