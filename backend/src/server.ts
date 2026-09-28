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

const allowedOrigins = [
  "http://localhost:3000",
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

await app.register(cors, {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith(".vercel.app") ||
      origin === "http://localhost:3000"
    ) {
      return cb(null, true);
    }
    return cb(null, false);
  },
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
const PORT = Number(process.env.PORT) || 4000;

app.listen({
  port: PORT,
  host: "0.0.0.0",
});