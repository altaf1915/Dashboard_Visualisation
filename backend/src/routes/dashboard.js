import fs from "node:fs";
import { Router } from "express";
import asyncHandler from "express-async-handler";
import multer from "multer";
import { connectCsv, dataDir, sevisCsv } from "../config.js";
import { requireAuth } from "../middleware/auth.js";
import {
  filterOptions,
  insights,
  metricsDocuments,
  metricsEligibility,
  metricsFees,
  metricsOverview,
  metricsRegional,
  runIngest,
  sqlValidations,
} from "../services/dataStore.js";

const router = Router();
fs.mkdirSync("uploads", { recursive: true });
const upload = multer({ dest: "uploads/", limits: { fileSize: 25 * 1024 * 1024 } });

const cleanQuery = (query) => Object.fromEntries(
  Object.entries(query).filter(([, value]) => value && value !== "All"),
);

router.get("/", (req, res) => {
  res.json({ service: "SLU Compliance Dashboard API", version: "1.0.0", stack: "Node.js + Express" });
});

router.use(requireAuth);

router.post("/ingest", (req, res) => {
  res.json({ status: "ok", stats: runIngest() });
});

function uploadCsv(target) {
  return [
    upload.single("file"),
    asyncHandler(async (req, res) => {
      if (!req.file) return res.status(400).json({ message: "CSV file is required" });
      if (!req.originalUrl.endsWith("/connect") && !req.originalUrl.endsWith("/sevis")) {
        return res.status(400).json({ message: "Unknown upload target" });
      }
      if (!req.file.originalname.toLowerCase().endsWith(".csv")) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ message: "Only .csv files are accepted" });
      }
      fs.mkdirSync(dataDir, { recursive: true });
      fs.copyFileSync(req.file.path, target);
      fs.unlinkSync(req.file.path);
      res.json({ status: "ok", file: req.file.originalname, stats: runIngest() });
    }),
  ];
}

router.post("/upload/connect", uploadCsv(connectCsv));
router.post("/upload/sevis", uploadCsv(sevisCsv));
router.get("/filters/options", (req, res) => res.json(filterOptions()));
router.get("/metrics/overview", (req, res) => res.json(metricsOverview(cleanQuery(req.query))));
router.get("/metrics/eligibility", (req, res) => res.json(metricsEligibility(cleanQuery(req.query))));
router.get("/metrics/documents", (req, res) => res.json(metricsDocuments(cleanQuery(req.query))));
router.get("/metrics/fees", (req, res) => res.json(metricsFees(cleanQuery(req.query))));
router.get("/metrics/regional", (req, res) => res.json(metricsRegional(cleanQuery(req.query))));
router.get("/sql/validations", (req, res) => res.json(sqlValidations()));
router.get("/insights", (req, res) => res.json(insights));

export default router;
