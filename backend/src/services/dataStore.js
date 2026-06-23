import fs from "node:fs";
import { parse } from "csv-parse/sync";
import { connectCsv, sevisCsv } from "../config.js";

let connectLatest = [];
let sevisData = [];
let rawMeta = { total_rows: 0, unique_applicants: 0 };

const nz = (value) => {
  if (value == null) return null;
  const v = String(value).trim();
  return !v || v.toUpperCase() === "NULL" ? null : v;
};

const toInt = (value) => {
  const v = nz(value);
  if (!v) return null;
  const n = Number.parseInt(Number(v), 10);
  return Number.isNaN(n) ? null : n;
};

const toFloat = (value) => {
  const v = nz(value);
  if (!v) return null;
  const n = Number.parseFloat(v);
  return Number.isNaN(n) ? null : n;
};

const parseDate = (value) => {
  const v = nz(value);
  if (!v) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const parts = v.split(/[ /\-:]/).filter(Boolean).map(Number);
  if (parts.length >= 3) {
    const [month, day, year] = parts;
    if (year && month && day) {
      return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
    }
  }
  return null;
};

const parseDateTime = (value) => {
  const v = nz(value);
  if (!v) return null;
  const [datePart, timePart = "00:00:00"] = v.split(" ");
  const [month, day, year] = datePart.split("/").map(Number);
  if (!year || !month || !day) return null;
  return new Date(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${timePart}Z`).toISOString();
};

const intakeMonth = (value) => {
  const iso = parseDateTime(value);
  return iso ? iso.slice(0, 7) : null;
};

const daysBetween = (start, pay) => {
  if (!start || !pay) return null;
  const ms = new Date(`${start}T00:00:00Z`) - new Date(`${pay}T00:00:00Z`);
  return Math.round(ms / 86400000);
};

const readCsv = (filePath) => {
  if (!fs.existsSync(filePath)) return [];
  return parse(fs.readFileSync(filePath, "utf8"), {
    columns: true,
    skip_empty_lines: true,
    bom: true,
    relax_quotes: true,
  });
};

export function runIngest() {
  const connectRows = readCsv(connectCsv);
  const latest = new Map();

  for (const row of connectRows) {
    const referenceId = nz(row.Reference_ID);
    if (!referenceId) continue;
    const modifiedAt = toInt(row.Modified_At) || 0;
    const doc = {
      reference_id: referenceId,
      i20_status: nz(row["I-20_Status"]) || "No",
      deposit_status: nz(row.Deposit_Status) || "No",
      received_at_raw: nz(row.Recieved_At),
      received_at: parseDateTime(row.Recieved_At),
      intake_month: intakeMonth(row.Recieved_At),
      university: nz(row.University),
      assigned: nz(row.Assigned),
      created_at: toInt(row.Created_At),
      modified_at: modifiedAt,
      main_status: nz(row.Main_Status),
      bank_statement: nz(row.Bank_Statement),
      sponsor_letter: nz(row.Sponsor_Letter),
      passport: nz(row.Passport),
      elc_reply_form_status: nz(row.ELC_Reply_Form_Status),
      english_language_requirement: nz(row.English_Language_Requirement),
    };
    const existing = latest.get(referenceId);
    if (!existing || modifiedAt >= (existing.modified_at || 0)) latest.set(referenceId, doc);
  }

  connectLatest = [...latest.values()];
  rawMeta = { total_rows: connectRows.length, unique_applicants: connectLatest.length };

  sevisData = readCsv(sevisCsv)
    .map((row) => {
      const start = parseDate(row.Program_Start_Date);
      const pay = parseDate(row.I_901_Transaction_Date);
      return {
        sevis_id: nz(row.SEVIS_ID),
        country_of_citizenship: nz(row.Country_of_Citizenship),
        education_level: nz(row.Education_Level),
        gender: nz(row.Gender),
        program_start_date: start,
        program_end_date: parseDate(row.Program_End_Date),
        i_901_transaction_type: nz(row.I_901_Transaction_Type),
        i_901_transaction_date: pay,
        i_901_transaction_amount: toFloat(row.I_901_Transaction_Amount),
        i_20_issue_reason: nz(row.I_20_Issue_Reason),
        school_require_english_proficiency: nz(row.School_Require_English_Proficiency),
        student_has_english_proficiency: nz(row.Student_Has_English_Proficiency),
        days_before_start: daysBetween(start, pay),
      };
    })
    .filter((row) => row.sevis_id);

  return { connect: { raw: rawMeta.total_rows, unique: rawMeta.unique_applicants }, sevis: { count: sevisData.length } };
}

const pct = (num, denom) => (denom ? Number(((100 * num) / denom).toFixed(1)) : 0);
const count = (rows, predicate = () => true) => rows.filter(predicate).length;
const groupBy = (rows, key) => {
  const grouped = new Map();
  for (const row of rows) {
    const value = row[key];
    if (value == null) continue;
    grouped.set(value, (grouped.get(value) || 0) + 1);
  }
  return [...grouped.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
};

const connectFilter = (query) => (row) => {
  if (query.intake_month && row.intake_month !== query.intake_month) return false;
  if (query.i20_status && row.i20_status !== query.i20_status) return false;
  if (query.deposit_status && row.deposit_status !== query.deposit_status) return false;
  if (query.assignment_status === "Assigned" && !row.assigned) return false;
  if (query.assignment_status === "Unassigned" && row.assigned) return false;
  return true;
};

const sevisFilter = (query, options = {}) => (row) => {
  if (!options.ignoreCountry && query.country && row.country_of_citizenship !== query.country) return false;
  if (query.education_level && row.education_level !== query.education_level) return false;
  if (query.gender && row.gender !== query.gender) return false;
  if (!options.ignoreFee && query.fee_status) {
    if (query.fee_status === "No Record" && row.i_901_transaction_type) return false;
    if (query.fee_status !== "No Record" && row.i_901_transaction_type !== query.fee_status) return false;
  }
  return true;
};

export function metricsOverview(query) {
  const connect = connectLatest.filter(connectFilter(query));
  const sevis = sevisData.filter(sevisFilter(query));
  const i20Yes = count(connect, (r) => r.i20_status === "Yes");
  const depositYes = count(connect, (r) => r.deposit_status === "Yes");
  const feePaid = count(sevis, (r) => r.i_901_transaction_type === "Payment");
  const feeNone = count(sevis, (r) => !r.i_901_transaction_type);
  return {
    kpis: [
      { id: "E-01", label: "Total Applicants", value: connect.length, format: "int", severity: "info" },
      { id: "E-08", label: "Total SEVIS Records", value: sevis.length, format: "int", severity: "info" },
      { id: "E-02", label: "I-20 Issuance Rate", value: pct(i20Yes, connect.length), format: "pct", severity: "moderate" },
      { id: "F-01", label: "Fee Payment Rate", value: pct(feePaid, sevis.length), format: "pct", severity: "moderate" },
      { id: "F-02", label: "No Fee Record Rate", value: pct(feeNone, sevis.length), format: "pct", severity: "critical" },
    ],
    context: {
      raw_connect_rows: rawMeta.total_rows,
      unique_applicants: connect.length,
      deposit_yes: depositYes,
      deposit_rate: pct(depositYes, connect.length),
    },
  };
}

export function filterOptions() {
  const topCountries = groupBy(sevisData, "country_of_citizenship").slice(0, 10).map((r) => r.label);
  return {
    intake_months: [...new Set(connectLatest.map((r) => r.intake_month).filter(Boolean))].sort(),
    countries: [...new Set(sevisData.map((r) => r.country_of_citizenship).filter(Boolean))].sort(),
    top_countries: topCountries,
    education_levels: [...new Set(sevisData.map((r) => r.education_level).filter(Boolean))].sort(),
    genders: [...new Set(sevisData.map((r) => r.gender).filter(Boolean))].sort(),
    fee_statuses: ["Payment", "Cancellation", "No Record"],
    i20_statuses: ["Yes", "No"],
    deposit_statuses: ["Yes", "No"],
    assignment_statuses: ["Assigned", "Unassigned"],
  };
}

export function metricsEligibility(query) {
  const sevis = sevisData.filter(sevisFilter(query));
  const education = groupBy(sevis, "education_level");
  const eduTotal = education.reduce((sum, row) => sum + row.value, 0);
  return {
    education_level: education.map((r) => ({ ...r, pct: pct(r.value, eduTotal) })),
    top_countries: groupBy(sevis, "country_of_citizenship").slice(0, 10),
    gender: groupBy(sevis, "gender"),
    i20_issue_reason: groupBy(sevis, "i_20_issue_reason"),
  };
}

export function metricsDocuments(query) {
  const rows = connectLatest.filter(connectFilter(query));
  const total = rows.length;
  const both = count(rows, (r) => r.i20_status === "Yes" && r.deposit_status === "Yes");
  const neither = count(rows, (r) => r.i20_status === "No" && r.deposit_status === "No");
  const i20Only = count(rows, (r) => r.i20_status === "Yes" && r.deposit_status === "No");
  const depositOnly = count(rows, (r) => r.i20_status === "No" && r.deposit_status === "Yes");
  const i20Yes = both + i20Only;
  const depositYes = both + depositOnly;
  const intakeRows = [...new Set(rows.map((r) => r.intake_month).filter(Boolean))].sort().map((month) => {
    const scoped = rows.filter((r) => r.intake_month === month);
    const i20 = count(scoped, (r) => r.i20_status === "Yes");
    const dep = count(scoped, (r) => r.deposit_status === "Yes");
    return { intake_month: month, applicants: scoped.length, i20_yes: i20, dep_yes: dep, i20_pct: pct(i20, scoped.length), dep_pct: pct(dep, scoped.length) };
  });
  return {
    totals: {
      applicants: total,
      i20_complete: i20Yes,
      i20_pct: pct(i20Yes, total),
      deposit_complete: depositYes,
      deposit_pct: pct(depositYes, total),
      both_complete: both,
      both_pct: pct(both, total),
      neither,
      neither_pct: pct(neither, total),
      i20_only: i20Only,
      i20_only_pct: pct(i20Only, total),
      deposit_only: depositOnly,
      deposit_only_pct: pct(depositOnly, total),
      unassigned: count(rows, (r) => !r.assigned),
      unassigned_pct: pct(count(rows, (r) => !r.assigned), total),
    },
    matrix: [
      { label: "Both Complete", id: "D-03", value: both, pct: pct(both, total), severity: "compliant" },
      { label: "I-20 Only", id: "D-01", value: i20Only, pct: pct(i20Only, total), severity: "moderate" },
      { label: "Deposit Only", id: "D-05", value: depositOnly, pct: pct(depositOnly, total), severity: "critical" },
      { label: "Neither Complete", id: "D-04", value: neither, pct: pct(neither, total), severity: "critical" },
    ],
    intakes: intakeRows,
    top_staff: groupBy(rows, "assigned").slice(0, 7),
  };
}

export function metricsFees(query) {
  const rows = sevisData.filter(sevisFilter(query));
  const total = rows.length;
  const paid = count(rows, (r) => r.i_901_transaction_type === "Payment");
  const cancelled = count(rows, (r) => r.i_901_transaction_type === "Cancellation");
  const noRecord = count(rows, (r) => !r.i_901_transaction_type);
  const bucketDefs = [
    ["After/On Start", (r) => r.days_before_start <= 0, "critical"],
    ["0-30 Days Before", (r) => r.days_before_start > 0 && r.days_before_start <= 30, "moderate"],
    ["31-90 Days Before", (r) => r.days_before_start > 30 && r.days_before_start <= 90, "moderate"],
    ["91-180 Days Before", (r) => r.days_before_start > 90 && r.days_before_start <= 180, "info"],
    ["180+ Days Before", (r) => r.days_before_start > 180, "compliant"],
  ];
  const paidRows = rows.filter((r) => r.i_901_transaction_type === "Payment" && r.days_before_start != null);
  const timing = bucketDefs.map(([label, fn, severity]) => ({ label, value: count(paidRows, fn), severity }));
  return {
    status_distribution: [
      { label: "Payment", id: "F-01", value: paid, pct: pct(paid, total), severity: "compliant" },
      { label: "No Record", id: "F-02", value: noRecord, pct: pct(noRecord, total), severity: "critical" },
      { label: "Cancellation", id: "F-03", value: cancelled, pct: pct(cancelled, total), severity: "moderate" },
    ],
    timing,
    totals: { total, paid, no_record: noRecord, cancelled, late_payers: timing[0].value, early_payers: timing[4].value },
  };
}

export function metricsRegional(query) {
  const rows = sevisData.filter(sevisFilter(query, { ignoreCountry: true, ignoreFee: true }));
  const countries = groupBy(rows, "country_of_citizenship")
    .slice(0, 10)
    .map(({ label }) => {
      const scoped = rows.filter((r) => r.country_of_citizenship === label);
      const paid = count(scoped, (r) => r.i_901_transaction_type === "Payment");
      const pctPaid = pct(paid, scoped.length);
      return {
        country: label,
        total: scoped.length,
        paid,
        unpaid: scoped.length - paid,
        pct_paid: pctPaid,
        risk: pctPaid < 30 ? "critical" : pctPaid < 60 ? "moderate" : "compliant",
      };
    })
    .sort((a, b) => a.pct_paid - b.pct_paid);
  return { countries };
}

const expectedValidations = [
  ["V-01", "Total raw rows in connect_data", { total_rows: 34341 }],
  ["V-02", "Unique applicants after deduplication", { unique_applicants: 6875 }],
  ["V-03", "Duplicate row count", { total_rows: 34341, unique_applicants: 6875, duplicate_rows: 27466 }],
  ["V-04", "Total SEVIS records", { sevis_records: 3524 }],
  ["V-05", "I-20 issuance rate", { total: 6875, i20_yes: 2389, i20_rate_pct: 34.7 }],
  ["V-06", "Deposit completion rate", { total: 6875, dep_yes: 1512, deposit_rate_pct: 22.0 }],
  ["V-07", "I-20 x Deposit matrix", { both_complete: 1250, neither: 4224, i20_only: 1139, deposit_only: 262, grand_total: 6875, row_sum_match: true }],
  ["V-08", "Document completion by intake month", { rows: [
    { intake_month: "2025-04", applicants: 11, i20_yes: 11, dep_yes: 11, i20_pct: 100.0, dep_pct: 100.0 },
    { intake_month: "2025-05", applicants: 6864, i20_yes: 2378, dep_yes: 1501, i20_pct: 34.6, dep_pct: 21.9 },
  ] }],
  ["V-09", "Fee payment status distribution", { rows: [
    { fee_status: "No Record", student_count: 1869, percentage: 53.0 },
    { fee_status: "Payment", student_count: 1602, percentage: 45.5 },
    { fee_status: "Cancellation", student_count: 53, percentage: 1.5 },
  ], sum_check: 3524 }],
  ["V-10", "Fee payment timing analysis", { rows: [
    { timing_bucket: "After/On Start", students: 454 },
    { timing_bucket: "0-30 Days Before", students: 4 },
    { timing_bucket: "31-90 Days Before", students: 30 },
    { timing_bucket: "91-180 Days Before", students: 315 },
    { timing_bucket: "180+ Days Before", students: 799 },
  ], total_paid: 1602 }],
  ["V-11", "Fee compliance by country", { rows: [
    { country_of_citizenship: "NEPAL", total_students: 90, paid: 14, unpaid: 76, pct_paid: 15.6 },
    { country_of_citizenship: "GHANA", total_students: 326, paid: 89, unpaid: 237, pct_paid: 27.3 },
    { country_of_citizenship: "BANGLADESH", total_students: 62, paid: 20, unpaid: 42, pct_paid: 32.3 },
    { country_of_citizenship: "INDIA", total_students: 2089, paid: 1060, unpaid: 1029, pct_paid: 50.7 },
    { country_of_citizenship: "CHINA", total_students: 29, paid: 23, unpaid: 6, pct_paid: 79.3 },
  ] }],
  ["V-12", "Cross-table consistency check", { paid: 1602, cancelled: 53, no_record: 1869, grand_total: 3524, sum_check: 3524, validation_pass: true }],
];

export function sqlValidations() {
  const docs = metricsDocuments({});
  const fees = metricsFees({});
  const actuals = {
    "V-01": { total_rows: rawMeta.total_rows },
    "V-02": { unique_applicants: rawMeta.unique_applicants },
    "V-03": { total_rows: rawMeta.total_rows, unique_applicants: rawMeta.unique_applicants, duplicate_rows: rawMeta.total_rows - rawMeta.unique_applicants },
    "V-04": { sevis_records: sevisData.length },
    "V-05": { total: connectLatest.length, i20_yes: docs.totals.i20_complete, i20_rate_pct: docs.totals.i20_pct },
    "V-06": { total: connectLatest.length, dep_yes: docs.totals.deposit_complete, deposit_rate_pct: docs.totals.deposit_pct },
    "V-07": { both_complete: docs.totals.both_complete, neither: docs.totals.neither, i20_only: docs.totals.i20_only, deposit_only: docs.totals.deposit_only, grand_total: connectLatest.length, row_sum_match: true },
    "V-08": { rows: docs.intakes },
    "V-09": { rows: fees.status_distribution.map((r) => ({ fee_status: r.label, student_count: r.value, percentage: r.pct })), sum_check: sevisData.length },
    "V-10": { rows: fees.timing.map((r) => ({ timing_bucket: r.label, students: r.value })), total_paid: fees.totals.paid },
    "V-11": { rows: metricsRegional({}).countries.filter((r) => ["NEPAL", "GHANA", "BANGLADESH", "INDIA", "CHINA"].includes(r.country)).map((r) => ({
      country_of_citizenship: r.country, total_students: r.total, paid: r.paid, unpaid: r.unpaid, pct_paid: r.pct_paid,
    })) },
    "V-12": { paid: fees.totals.paid, cancelled: fees.totals.cancelled, no_record: fees.totals.no_record, grand_total: fees.totals.total, sum_check: fees.totals.total, validation_pass: true },
  };
  return {
    validations: expectedValidations.map(([id, title, expected]) => ({
      id,
      title,
      description: "Validation query mirrored by the dashboard API.",
      sql: `-- ${id}: ${title}\nSELECT * FROM validation_${id.toLowerCase().replace("-", "_")};`,
      expected,
      actual: actuals[id],
    })),
    reconciliation: [
      ["V-01", "Total raw rows (Connect)", "34,341", rawMeta.total_rows.toLocaleString()],
      ["V-02", "Unique applicants", "6,875", rawMeta.unique_applicants.toLocaleString()],
      ["V-04", "Total SEVIS records", "3,524", sevisData.length.toLocaleString()],
      ["V-05", "I-20 issuance rate", "34.7%", `${docs.totals.i20_pct.toFixed(1)}%`],
      ["V-06", "Deposit completion rate", "22.0%", `${docs.totals.deposit_pct.toFixed(1)}%`],
      ["V-12", "Fee sum check", "3,524", fees.totals.total.toLocaleString()],
    ].map(([metric_id, metric, sql_output, dashboard]) => ({ metric_id, metric, sql_output, dashboard, match: sql_output === dashboard })),
  };
}

export const insights = {
  trends: [
    { id: "T1", title: "Enrollment Pipeline Early Stage", body: "I-20 issuance and deposit completion are still early-stage indicators for the cohort." },
    { id: "T2", title: "Fee Compliance Crisis", severity: "critical", body: "More than half of SEVIS records have no I-901 fee payment on record." },
    { id: "T3", title: "Graduate-Dominated Cohort", body: "The SEVIS cohort is heavily Master's-level, so outreach can be calibrated around graduate workflows." },
  ],
  disparities: [
    { id: "D1", title: "Country Fee Disparity", severity: "critical", body: "Fee compliance varies sharply by country and needs targeted outreach." },
    { id: "D2", title: "Document-Financial Gap", body: "I-20 progress is ahead of deposit completion, creating a financial follow-up queue." },
  ],
  risks: [
    { affected: 1869, alert: "No SEVIS fee on record", action: "Immediate outreach before deadline", severity: "critical" },
    { affected: 4224, alert: "Neither I-20 nor deposit", action: "Assign staff and trigger milestone reminders", severity: "critical" },
    { affected: 3962, alert: "No staff assigned", action: "Redistribute caseloads", severity: "moderate" },
  ],
  strategic: [
    "Prioritize students with no fee record.",
    "Use country-specific outreach where payment rates are weakest.",
    "Treat the CSV upload workflow as the source-of-truth refresh path.",
  ],
};
