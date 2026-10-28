import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "5000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",
  frontendUrl: (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, ""),
  databaseUrl: process.env.DATABASE_URL || "",
  directUrl: process.env.DIRECT_URL || "",
  sessionSecret: process.env.SESSION_SECRET || "hireflow-session-secret-default-key-dev",
  sessionCookieName: "hireflow_session",
  sessionDurationDays: 14,
};

