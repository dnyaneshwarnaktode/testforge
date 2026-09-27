import Fastify from "fastify";

const app = Fastify({
  logger: true,
});

app.get("/", async () => {
  return {
    message: "TestForge API is running",
  };
});

app.get("/health", async () => {
  return {
    status: "health ok",
  };
});

app.listen({
  port: 4000,
  host: "0.0.0.0",
});