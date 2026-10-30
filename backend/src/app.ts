import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import apiRouter from "./routes/index.js";
import { authenticate } from "./middlewares/auth.js";
import { errorHandler } from "./middlewares/error-handler.js";
import { config } from "./config/env.js";

export const app = express();

const allowedOrigins = [
  config.frontendUrl,
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, same-origin)
      if (!origin) return callback(null, true);
      // Allow any Vercel deployment, localhost, or configured frontend URL
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Attach authentication state if valid session cookie present
app.use(authenticate);

// Mount main API
app.use("/api", apiRouter);
app.use(apiRouter);

// Fallback 404 for unknown API endpoints
app.use("/api/*", (_req, res) => {
  res.status(404).json({ message: "API endpoint not found." });
});

// Root ping
app.get("/", (_req, res) => {
  res.status(200).json({ name: "HireFlow Backend API", status: "running" });
});

// Centralized error handler
app.use(errorHandler);

export default app;

