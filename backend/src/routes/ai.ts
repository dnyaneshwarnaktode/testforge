import type { FastifyInstance } from "fastify";
import { generateTests } from "../services/ai/test-generator.js";

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
}
