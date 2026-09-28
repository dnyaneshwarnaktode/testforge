import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";

import { clerkPlugin } from "@clerk/fastify";

import { executeRoutes } from "./routes/execute.js";
import { projectRoutes } from "./routes/projects.js";
import { testCaseRoutes } from "./routes/test-cases.js";
import { testRunRoutes } from "./routes/test-runs.js";
import { aiRoutes } from "./routes/ai.js";

const app = Fastify({
  logger: true,
});

await app.register(cors, {
  origin: "http://localhost:3000",
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
});

await app.register(clerkPlugin);

app.addContentTypeParser(
  "application/json",
  { parseAs: "string" },
  (req, body: string, done) => {
    if (!body || !body.trim()) {
      done(null, {});
      return;
    }
    try {
      done(null, JSON.parse(body));
    } catch (err) {
      done(err as Error, undefined);
    }
  }
);

app.get("/", async () => {
  return {
    message: "TestForge API is running",
  };
});

app.get("/api/health", async () => {
  return {
    status: "ok",
  };
});

app.register(executeRoutes);
app.register(projectRoutes);
app.register(testCaseRoutes);
app.register(testRunRoutes);
app.register(aiRoutes);
await app.register(rateLimit, {
  max: 100,
  timeWindow: 60 * 1000,
});
app.listen({
  port: 4000,
  host: "0.0.0.0",
});