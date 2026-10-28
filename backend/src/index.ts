import { app } from "./app.js";
import { config } from "./config/env.js";

const server = app.listen(config.port, () => {
  console.log(`[HireFlow Backend] Server running on http://localhost:${config.port}`);
  console.log(`[HireFlow Backend] Environment: ${config.nodeEnv}`);
});

process.on("SIGTERM", () => {
  console.log("[HireFlow Backend] SIGTERM received, shutting down gracefully...");
  server.close(() => {
    console.log("[HireFlow Backend] Server closed.");
    process.exit(0);
  });
});

export default app;
