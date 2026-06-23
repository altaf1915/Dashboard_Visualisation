import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", ".env") });

export const rootDir = path.resolve(__dirname, "..", "..");
export const dataDir = path.join(rootDir, "data");
export const connectCsv = path.join(dataDir, "connect.csv");
export const sevisCsv = path.join(dataDir, "sevis.csv");

export const config = {
  port: Number(process.env.PORT || 8001),
  mongoUrl: process.env.MONGO_URL || "mongodb://127.0.0.1:27017/dashboard_validation",
  dbName: process.env.DB_NAME || "dashboard_validation",
  jwtSecret: process.env.JWT_SECRET || "change-this-secret-for-local-dev",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  corsOrigins: (process.env.CORS_ORIGINS || "http://localhost:3000,http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
};
