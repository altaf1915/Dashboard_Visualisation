import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, MetricBadge, Spinner, Pill } from "@/components/Primitives";
import { fmtNumber } from "@/lib/api";
import { CheckCircle2, XCircle, Copy } from "lucide-react";

function highlightSql(sql) {
  const KEYWORDS = ["SELECT","FROM","WHERE","GROUP BY","ORDER BY","WITH","AS","CASE","WHEN","THEN","ELSE","END","AND","OR","DISTINCT","ON","COUNT","SUM","ROUND","COALESCE","CREATE","TABLE","INSERT","UPDATE","DELETE","JOIN","LEFT","RIGHT","INNER","IN","IS","NOT","NULL","LIMIT","UNION","ASC","DESC","ROW","COLUMN","CONSTRAINT","INTERVAL","BY","IS NULL"];
  return sql.split("\n").map((line, i) => {
    const isComment = line.trim().startsWith("--");
    if (isComment) return <span key={i} className="cmt">{line + "\n"}</span>;
    let html = line;
    // strings
    html = html.replace(/'([^']*)'/g, (m) => `__STR__${m}__STR__`);
    // numbers
    html = html.replace(/\b(\d+(?:\.\d+)?)\b/g, (m) => `__NUM__${m}__NUM__`);
    // keywords
    KEYWORDS.forEach((kw) => {
      const re = new RegExp(`\\b${kw.replace(/ /g, "\\s+")}\\b`, "g");
      html = html.replace(re, (m) => `__KW__${m}__KW__`);
    });
    const parts = html.split(/(__(?:KW|STR|NUM)__[^_]*?__(?:KW|STR|NUM)__)/g).filter(Boolean);
    return (
      <span key={i}>
        {parts.map((p, j) => {
          if (p.startsWith("__KW__"))  return <span key={j} className="kw">{p.replace(/__KW__/g, "")}</span>;
          if (p.startsWith("__STR__")) return <span key={j} className="str">{p.replace(/__STR__/g, "")}</span>;
          if (p.startsWith("__NUM__")) return <span key={j} className="num">{p.replace(/__NUM__/g, "")}</span>;
          return <span key={j}>{p}</span>;
        })}
        {"\n"}
      </span>
    );
  });
}

function shallowEqual(a, b) {
  if (typeof a !== typeof b) {
    // numeric tolerance
    if (typeof a === "number" && typeof b === "number") return Math.abs(a - b) < 0.05;
    return String(a) === String(b);
  }
  if (typeof a === "number") return Math.abs(a - b) < 0.05;
  if (a == null || b == null) return a === b;
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false;
    return a.every((v, i) => shallowEqual(v, b[i]));
  }
  if (typeof a === "object") {
    const ak = Object.keys(a), bk = Object.keys(b);
    if (ak.length !== bk.length) return false;
    return ak.every((k) => shallowEqual(a[k], b[k]));
  }
  return a === b;
}

function ResultBlock({ data }) {
  if (!data) return <span className="text-zinc-500 text-xs">—</span>;
  if (data.rows) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono-ui">
          <thead>
            <tr className="text-zinc-500">
              {Object.keys(data.rows[0] || {}).map((k) => <th key={k} className="px-2 py-1 text-left">{k}</th>)}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r, i) => (
              <tr key={i} className="border-t border-zinc-900">
                {Object.values(r).map((v, j) => <td key={j} className="px-2 py-1 text-zinc-200">{typeof v === "number" ? fmtNumber(v) : String(v)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs font-mono-ui">
      {Object.entries(data).map(([k, v]) => (
        <React.Fragment key={k}>
          <div className="text-zinc-500">{k}</div>
          <div className="text-zinc-100 text-right">{typeof v === "number" ? fmtNumber(v) : String(v)}</div>
        </React.Fragment>
      ))}
    </div>
  );
}

function ValidationCard({ v }) {
  const match = shallowEqual(v.expected, v.actual);
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(v.sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <Card className={`p-5 ${match ? "" : "glow-critical"}`} data-testid={`sql-${v.id.toLowerCase()}`}>
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <MetricBadge id={v.id} />
          <h3 className="font-heading text-base font-semibold text-zinc-100">{v.title}</h3>
        </div>
        <div className="flex items-center gap-2">
          {match
            ? <Pill tone="compliant"><CheckCircle2 className="w-3 h-3" /> Match</Pill>
            : <Pill tone="critical"><XCircle className="w-3 h-3" /> Mismatch</Pill>}
          <button onClick={copy} className="text-xs text-zinc-400 hover:text-zinc-100 inline-flex items-center gap-1 px-2 py-1 rounded border border-zinc-800 hover:bg-zinc-900">
            <Copy className="w-3 h-3" /> {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
      <p className="text-xs text-zinc-500 mb-3">{v.description}</p>

      <pre className="sql-block">{highlightSql(v.sql)}</pre>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
        <div className="p-3 rounded-md border border-zinc-800 bg-zinc-950/50">
          <div className="text-[11px] font-mono-ui uppercase tracking-widest text-zinc-500 mb-2">Expected</div>
          <ResultBlock data={v.expected} />
        </div>
        <div className={`p-3 rounded-md border ${match ? "border-emerald-900/40 bg-emerald-500/5" : "border-red-900/40 bg-red-500/5"}`}>
          <div className="text-[11px] font-mono-ui uppercase tracking-widest text-zinc-500 mb-2">Actual (Live)</div>
          <ResultBlock data={v.actual} />
        </div>
      </div>
    </Card>
  );
}

export default function SqlValidation() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/sql/validations").then((r) => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading || !data) return <Spinner />;

  const allMatch = data.reconciliation.every((r) => r.match);

  return (
    <div className="space-y-10">
      <div>
        <div className="font-mono-ui text-[11px] tracking-widest uppercase text-zinc-500 mb-1">Section 5 · SQL Validation Scripts</div>
        <h1 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight text-zinc-100">SQL Validation &amp; Reconciliation</h1>
        <p className="text-zinc-400 mt-2 max-w-3xl">
          Every dashboard metric is anchored to a PostgreSQL validation query (V-01 … V-12). The Expected column shows the
          documented Week 3 output; the Actual column is computed live from the loaded data.
        </p>
        <div className="mt-3">
          {allMatch
            ? <Pill tone="compliant"><CheckCircle2 className="w-3.5 h-3.5" /> All 13 reconciliation rows match</Pill>
            : <Pill tone="critical">Discrepancies detected — review highlighted cards</Pill>}
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-xl font-semibold text-zinc-100">Reconciliation Table</h2>
          <Pill tone="info">SQL Output vs Dashboard</Pill>
        </div>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="reconciliation-table">
              <thead className="bg-zinc-950/60">
                <tr className="text-left text-[11px] font-mono-ui uppercase tracking-widest text-zinc-500">
                  <th className="px-4 py-3">Metric ID</th>
                  <th className="px-4 py-3">Metric Name</th>
                  <th className="px-4 py-3">SQL Output</th>
                  <th className="px-4 py-3">Dashboard Value</th>
                  <th className="px-4 py-3 text-center">Match</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {data.reconciliation.map((r, i) => (
                  <tr key={i} className="hover:bg-zinc-900/40 transition">
                    <td className="px-4 py-3"><MetricBadge id={r.metric_id} /></td>
                    <td className="px-4 py-3 text-zinc-200">{r.metric}</td>
                    <td className="px-4 py-3 font-mono-ui text-zinc-100">{r.sql_output}</td>
                    <td className="px-4 py-3 font-mono-ui text-zinc-100">{r.dashboard}</td>
                    <td className="px-4 py-3 text-center">
                      {r.match
                        ? <span className="inline-flex text-emerald-300"><CheckCircle2 className="w-4 h-4" /></span>
                        : <span className="inline-flex text-red-300"><XCircle className="w-4 h-4" /></span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      <section className="space-y-6 stagger">
        <h2 className="font-heading text-xl font-semibold text-zinc-100">Validation Queries</h2>
        {data.validations.map((v) => <ValidationCard key={v.id} v={v} />)}
      </section>
    </div>
  );
}
