import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";
import morgan from "morgan";
import { config } from "./config.js";
import authRoutes from "./routes/auth.js";
import dashboardRoutes from "./routes/dashboard.js";
import { errorHandler, notFound } from "./middleware/errors.js";
import { runIngest } from "./services/dataStore.js";

const app = express();

app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || config.corsOrigins.includes("*") || config.corsOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked for origin ${origin}`));
  },
  credentials: true,
}));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/health", (req, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);
app.use("/api", dashboardRoutes);
app.use(notFound);
app.use(errorHandler);

async function start() {
  const stats = runIngest();

  if (process.argv.includes("--seed-only")) {
    console.log(JSON.stringify({ status: "ok", stats }, null, 2));
    return;
  }

  await mongoose.connect(config.mongoUrl, { dbName: config.dbName });

  app.listen(config.port, () => {
    console.log(`API ready on http://localhost:${config.port}`);
    console.log(`Loaded ${stats.connect.unique} applicants and ${stats.sevis.count} SEVIS rows`);
  });
}

start().catch((error) => {
  console.error("Failed to start API", error);
  process.exit(1);
});
