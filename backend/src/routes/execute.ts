import type { FastifyInstance } from "fastify";
import { executeRequest } from "../services/api-executor.js";

const allowedMethods = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
];

interface ExecuteRequestBody {
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  body?: unknown;
}

export async function executeRoutes(
  app: FastifyInstance
) {
  app.post(
    "/api/execute",
    async (request, reply) => {
      const body =
        (request.body ?? {}) as ExecuteRequestBody;

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

      const method = body.method.toUpperCase();

      if (!allowedMethods.includes(method)) {
        return reply.status(400).send({
          error: "Invalid HTTP method",
        });
      }

      const result = await executeRequest({
        method,
        url: body.url,
        headers: body.headers,
        body: body.body,
      });

      return reply.send(result);
    }
  );
}