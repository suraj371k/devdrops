import "dotenv/config";
import database from "./db/connection.js";
import app from "./app.js";
import loggerModule from "./middleware/logger.js";

const { logger } = loggerModule;

const PORT = process.env.PORT || 3000;

const requiredEnvVars = ["MONGODB_URI", "JWT_SECRET"];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(
    " Missing required environment variables:",
    missingEnvVars.join(", "),
  );
  process.exit(1);
}

async function startServer() {
  try {
    await database.connect();

    const server = app.listen(PORT, () => {
      logger.info(`Server started on port ${PORT}`, {
        env: process.env.NODE_ENV || "development",
        pid: process.pid,
      });
      console.log(` Server running on http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });

    const gracefulShutdown = async (signal) => {
      logger.info(`${signal} received, shutting down gracefully`);
      server.close(async () => {
        await database.disconnect();
        logger.info("Server closed");
        process.exit(0);
      });

      setTimeout(() => {
        logger.error("Forced shutdown after timeout");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    process.on("unhandledRejection", (reason) => {
      logger.error("Unhandled Rejection", {
        reason: reason?.message || reason,
      });
    });

    process.on("uncaughtException", (error) => {
      logger.error("Uncaught Exception", {
        error: error.message,
        stack: error.stack,
      });
      process.exit(1);
    });
  } catch (error) {
    logger.error("Failed to start server", {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
}

startServer();
