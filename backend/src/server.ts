import Fastify from "fastify";
import cors from "@fastify/cors";

import { executeRoutes } from "./routes/execute.js";

const app = Fastify({
  logger: true,
});

app.register(cors, {
  origin: "http://localhost:3000",
});

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

app.listen({
  port: 4000,
  host: "0.0.0.0",
});