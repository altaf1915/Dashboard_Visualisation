import React from "react";
import { Card, MetricBadge, Pill } from "@/components/Primitives";

function H2({ children, id, num }) {
  return (
    <h2 id={id} className="font-heading text-2xl md:text-3xl font-semibold text-zinc-100 mt-12 mb-3 tracking-tight">
      {num && <span className="text-zinc-600 mr-3 font-mono-ui text-base align-middle">{num}</span>}
      {children}
    </h2>
  );
}
function H3({ children }) {
  return <h3 className="font-heading text-lg font-semibold text-zinc-100 mt-6 mb-2">{children}</h3>;
}
function P({ children }) {
  return <p className="text-zinc-300 leading-relaxed mb-3">{children}</p>;
}
function Quote({ children }) {
  return (
    <blockquote className="border-l-2 border-blue-500/60 pl-4 italic text-zinc-300 my-4 bg-blue-500/5 py-2 rounded-r">
      {children}
    </blockquote>
  );
}
function Code({ children }) {
  return <pre className="sql-block text-[12px] my-3">{children}</pre>;
}

export default function Report() {
  return (
    <div className="max-w-3xl mx-auto">
      <header className="mb-12">
        <div className="font-mono-ui text-[11px] tracking-widest uppercase text-zinc-500 mb-2">Excelerate Data Visualization Internship 2026</div>
        <h1 className="font-heading text-4xl md:text-5xl font-semibold text-zinc-100 tracking-tight">
          Week 3 Analytical Report
        </h1>
        <p className="text-zinc-400 mt-3 text-lg">
          Dashboard Validation, Metric Reconciliation &amp; Compliance Monitoring System
        </p>
        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="p-3 rounded-md border border-zinc-800 bg-zinc-900/40">
            <div className="text-[11px] font-mono-ui uppercase tracking-widest text-zinc-500">Prepared By</div>
            <div className="text-zinc-100 mt-1">Abukpain Francis Ubueke</div>
          </div>
          <div className="p-3 rounded-md border border-zinc-800 bg-zinc-900/40">
            <div className="text-[11px] font-mono-ui uppercase tracking-widest text-zinc-500">Team</div>
            <div className="text-zinc-100 mt-1">Team 21</div>
          </div>
          <div className="p-3 rounded-md border border-zinc-800 bg-zinc-900/40">
            <div className="text-[11px] font-mono-ui uppercase tracking-widest text-zinc-500">Datasets</div>
            <div className="text-zinc-100 mt-1">Connect &amp; SEVIS · April 2026</div>
          </div>
          <div className="p-3 rounded-md border border-zinc-800 bg-zinc-900/40">
            <div className="text-[11px] font-mono-ui uppercase tracking-widest text-zinc-500">Records</div>
            <div className="text-zinc-100 mt-1">34,341 / 6,875 · 3,524</div>
          </div>
        </div>
      </header>

      <Card className="p-5 mb-10">
        <H3>Contents</H3>
        <ol className="list-decimal list-inside space-y-1 text-zinc-300 text-sm">
          <li><a className="hover:text-zinc-100" href="#s1">Connecting PostgreSQL to Looker Studio</a></li>
          <li><a className="hover:text-zinc-100" href="#s2">Defining Key Compliance Metrics</a></li>
          <li><a className="hover:text-zinc-100" href="#s3">Dashboard Design Documentation</a></li>
          <li><a className="hover:text-zinc-100" href="#s4">Dashboard Visualizations</a></li>
          <li><a className="hover:text-zinc-100" href="#s5">SQL Validation Scripts</a></li>
          <li><a className="hover:text-zinc-100" href="#s6">Metric Reconciliation Summary</a></li>
          <li><a className="hover:text-zinc-100" href="#s7">Insight Summary</a></li>
        </ol>
      </Card>

      <H2 id="s1" num="1.">PostgreSQL → Looker Studio Connection &amp; Setup</H2>
      <P>
        This section documents the validated connection between the PostgreSQL database holding Connect &amp; SEVIS data and
        Looker Studio. Field mappings, date conversions and the deduplication view are presented to ensure full
        traceability between source and dashboard.
      </P>

      <H3>1.1 Table Setup — connect_data</H3>
      <Code>{`CREATE TABLE connect_data (
    id              SERIAL PRIMARY KEY,
    reference_id    BIGINT,
    deposit_status  TEXT,
    i20_status      TEXT,
    received_at     TEXT,
    university      TEXT,
    assigned        TEXT,
    created_at      BIGINT,
    modified_at     BIGINT
);`}</Code>

      <H3>1.2 Table Setup — sevis_data</H3>
      <Code>{`CREATE TABLE sevis_data (
    sevis_id                     TEXT PRIMARY KEY,
    country_of_citizenship       TEXT,
    education_level              TEXT,
    gender                       TEXT,
    program_start_date           TEXT,
    program_end_date             TEXT,
    i_901_transaction_type       TEXT,
    i_901_transaction_date       TEXT,
    i_901_transaction_amount     NUMERIC,
    i_20_issue_reason            TEXT,
    school_require_english_proficiency TEXT,
    student_has_english_proficiency    TEXT
);`}</Code>

      <H3>1.3 Deduplication View</H3>
      <P>
        Connect contains 34,341 rows but only 6,875 unique applicants. All metrics use the deduplicated view to avoid inflating counts ~5x.
      </P>
      <Code>{`CREATE OR REPLACE VIEW connect_latest AS
SELECT DISTINCT ON (reference_id) reference_id,
    i20_status, deposit_status, received_at, assigned,
    created_at, modified_at,
    TO_CHAR(TO_TIMESTAMP(received_at, 'MM/DD/YYYY HH24:MI:SS'),'YYYY-MM') AS intake_month
FROM connect_data
ORDER BY reference_id, modified_at DESC;

-- Verify
SELECT COUNT(*) FROM connect_latest;  -- → 6,875`}</Code>

      <H2 id="s2" num="2.">Defining Key Compliance Metrics</H2>
      <P>
        Each metric in the dashboard is anchored to a SQL formula and labelled with a Metric ID (E-, D-, F-) visible on every visual element.
      </P>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-4">
        {[
          { id: "E-02", label: "I-20 Issuance Rate", value: "34.7%" },
          { id: "E-03", label: "Deposit Completion", value: "22.0%" },
          { id: "E-04", label: "Full Enrollment Ready", value: "18.2%" },
          { id: "E-05", label: "At-Risk (Neither)", value: "61.4%" },
          { id: "F-01", label: "Fee Payment Rate", value: "45.5%" },
          { id: "F-02", label: "No Fee Record Rate", value: "53.0%" },
        ].map((m) => (
          <div key={m.id} className="p-3 rounded-md border border-zinc-800 bg-zinc-900/40">
            <div className="flex items-center justify-between"><span className="text-xs text-zinc-400">{m.label}</span><MetricBadge id={m.id} /></div>
            <div className="font-heading text-xl text-zinc-100 mt-1">{m.value}</div>
          </div>
        ))}
      </div>

      <H2 id="s3" num="3.">Dashboard Design Documentation</H2>
      <P>
        The dashboard is built across five sections directly aligned with the compliance domains in Section 2:
        High-Level Overview, Eligibility, Document Compliance, Fee Tracking, and Regional Insights.
      </P>
      <P>
        Global filters live in a persistent left sidebar so context is consistent across every section.
        Color semantics: <Pill tone="compliant">Compliant</Pill> green, <Pill tone="critical">Critical</Pill> red,
        <span className="mx-1"><Pill tone="moderate">Moderate</Pill></span> gold, <Pill tone="info">Informational</Pill> blue.
      </P>

      <H2 id="s4" num="4.">Dashboard Visualizations</H2>
      <P>
        All eight visualizations are rendered from validated query outputs. Each chart displays its source Metric ID(s) for full traceability.
        See the <a className="text-blue-300 hover:underline" href="/">Overview</a>, Eligibility, Documents, Fees and Regional pages for interactive versions.
      </P>

      <H2 id="s5" num="5.">SQL Validation Scripts</H2>
      <P>
        Twelve validation queries (V-01 .. V-12) anchor every dashboard number. See the
        <a className="text-blue-300 hover:underline mx-1" href="/sql">SQL Validation page</a>
        for code, expected and live-actual outputs side-by-side with Match badges.
      </P>

      <H2 id="s6" num="6.">Metric Reconciliation Summary</H2>
      <P>
        13 key metrics were reconciled between SQL output and dashboard display. <strong>All match ✓</strong>.
        Known data limitations documented:
      </P>
      <ul className="list-disc list-inside text-zinc-300 space-y-1 ml-2 mb-4">
        <li>27,466 duplicate rows in Connect — handled via `DISTINCT ON (reference_id) ORDER BY modified_at DESC`.</li>
        <li>16 Connect columns are 100% null (financial docs, ELC, English) — flagged as data gap.</li>
        <li>April 2025 cohort is 11 applicants — labelled as test/early-bird batch.</li>
        <li>SEVIS FIN_ID is 98.2% null — no direct join key to Connect.</li>
      </ul>

      <H2 id="s7" num="7.">Insight Summary</H2>
      <H3>7.1 Major Trends</H3>
      <Quote>
        <strong>Fee Compliance Crisis:</strong> 53.0% of SEVIS records have no I-901 fee payment on record —
        the single largest compliance gap in the dataset, and the most likely to cause institutional and federal compliance issues.
      </Quote>
      <P>
        The April 2026 cohort is at an early pipeline stage: I-20 issuance is 34.7% and deposit completion is 22.0%.
        61.4% of applicants have not completed any milestone. The dataset is a 27 May 2025 snapshot, ~3 months before
        the August 2025 programme start — rates are expected to improve but must be actively monitored.
      </P>

      <H3>7.2 Notable Disparities</H3>
      <Quote>
        <strong>Nepal vs China:</strong> 63.7 pp gap in fee compliance between two top-10 nationality groups (15.6% vs 79.3%).
        Country-specific outreach is essential — a uniform approach will underserve Nepal and over-resource China.
      </Quote>

      <H3>7.3 Strategic Recommendations</H3>
      <ul className="list-disc list-inside text-zinc-300 space-y-1 ml-2">
        <li>Calibrate monitoring to the August 2025 deadline (60-day + 30-day pre-start alerts).</li>
        <li>India priority — 59.3% of SEVIS; a 5 pp improvement clears 100+ students.</li>
        <li>Replicate the China outreach model (79.3% compliance, zero late payers) for high-risk nationalities.</li>
        <li>Resolve data infrastructure gap — request updated export with non-null financial &amp; English fields.</li>
      </ul>

      <div className="divider-line my-10" />
      <div className="text-center text-xs font-mono-ui uppercase tracking-widest text-zinc-500">
        End of Week 3 Analytical Report · Team 21 · June 2026
      </div>
    </div>
  );
}
