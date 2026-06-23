import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useFilters } from "@/lib/filters";
import { Card, MetricBadge, SectionHeader, Spinner, Pill } from "@/components/Primitives";
import { fmtNumber, fmtPct, SEVERITY } from "@/lib/api";
import { AlertTriangle, TrendingUp, ShieldCheck, Database, Users2 } from "lucide-react";

function KpiCard({ kpi }) {
  const sev = SEVERITY[kpi.severity] || SEVERITY.info;
  const isPct = kpi.format === "pct";
  return (
    <div
      data-testid={`kpi-${kpi.id.toLowerCase()}`}
      className={`surface p-5 relative overflow-hidden transition hover:-translate-y-0.5 hover:border-zinc-700 ${kpi.severity === "critical" ? "glow-critical" : ""}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="text-xs text-zinc-400 leading-tight">{kpi.label}</div>
        <MetricBadge id={kpi.id} />
      </div>
      <div className="font-heading text-4xl font-semibold text-zinc-50 tracking-tight" style={{ color: kpi.severity === "critical" ? sev.color : "#F4F4F5" }}>
        {isPct ? fmtPct(kpi.value) : fmtNumber(kpi.value)}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Pill tone={kpi.severity}>{
          kpi.severity === "critical" ? "Critical Alert"
            : kpi.severity === "moderate" ? "Monitor"
            : kpi.severity === "compliant" ? "On Track"
            : "Informational"
        }</Pill>
      </div>
    </div>
  );
}

export default function Overview() {
  const { params } = useFilters();
  const [data, setData] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get("/metrics/overview", { params }),
      api.get("/insights"),
    ]).then(([o, i]) => {
      setData(o.data);
      setInsights(i.data);
    }).finally(() => setLoading(false));
  }, [params]);

  if (loading || !data) return <Spinner />;

  return (
    <div className="space-y-10">
      <div>
        <div className="font-mono-ui text-[11px] tracking-widest uppercase text-zinc-500 mb-1">Section 1 · Executive Summary</div>
        <h1 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight text-zinc-100">
          International Student Compliance Overview
        </h1>
        <p className="text-zinc-400 mt-2 max-w-3xl">
          Validated metrics from PostgreSQL (Connect &amp; SEVIS datasets) surfaced live.
          Critical alerts are highlighted in red. All metric IDs are traceable to SQL validation queries V-01 through V-12.
        </p>
        <div className="flex flex-wrap gap-2 mt-4 text-[11px] font-mono-ui">
          <Pill tone="info">{fmtNumber(data.context.raw_connect_rows)} raw Connect rows</Pill>
          <Pill tone="compliant">{fmtNumber(data.context.unique_applicants)} unique applicants</Pill>
          <Pill tone="moderate">Deposit rate {fmtPct(data.context.deposit_rate)}</Pill>
        </div>
      </div>

      <section>
        <SectionHeader
          kicker="Section 1 · High-Level Compliance"
          title="Key Performance Indicators"
          subtitle="Snapshot of the April 2026 cohort against compliance thresholds. Tiles re-compute live as filters change."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 stagger">
          {data.kpis.map((k) => <KpiCard key={k.id} kpi={k} />)}
        </div>
      </section>

      {insights && (
        <section>
          <SectionHeader
            kicker="Section 7 · Insight Summary"
            title="Strategic Trends &amp; Risk Signals"
            subtitle="Highlighted patterns informing the Week 4 monitoring system."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger">
            {insights.trends.map((t) => {
              const Icon = t.severity === "critical" ? AlertTriangle : TrendingUp;
              const sev = t.severity || "info";
              return (
                <Card key={t.id} className={`p-5 ${sev === "critical" ? "glow-critical" : ""}`}>
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-md`} style={{ background: SEVERITY[sev].bg, color: SEVERITY[sev].color }}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="font-heading font-semibold text-zinc-100">{t.title}</h3>
                        <MetricBadge id={t.id} />
                      </div>
                      <p className="text-sm text-zinc-400 leading-relaxed">{t.body}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {insights && (
        <section>
          <SectionHeader
            kicker="Section 7.3 · Risk Register"
            title="Compliance Risk Register"
            subtitle="Each row corresponds to a dashboard alert that requires institutional action."
          />
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="risk-register-table">
                <thead className="bg-zinc-950/60">
                  <tr className="text-left text-[11px] font-mono-ui uppercase tracking-widest text-zinc-500">
                    <th className="px-4 py-3">Severity</th>
                    <th className="px-4 py-3">Affected</th>
                    <th className="px-4 py-3">Alert</th>
                    <th className="px-4 py-3">Recommended Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {insights.risks.map((r, i) => (
                    <tr key={i} className="hover:bg-zinc-900/40 transition">
                      <td className="px-4 py-3"><Pill tone={r.severity}>{r.severity}</Pill></td>
                      <td className="px-4 py-3 font-mono-ui text-zinc-100">{fmtNumber(r.affected)}</td>
                      <td className="px-4 py-3 text-zinc-200">{r.alert}</td>
                      <td className="px-4 py-3 text-zinc-400">{r.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </section>
      )}

      <section>
        <SectionHeader kicker="Pipeline" title="Dataset Pipeline" subtitle="From raw CSV to validated dashboard metric." />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 stagger">
          {[
            { icon: Database, label: "Raw Connect Rows",   value: fmtNumber(data.context.raw_connect_rows), hint: "Source CSV" },
            { icon: Users2,   label: "Unique Applicants",  value: fmtNumber(data.context.unique_applicants), hint: "Deduplicated by reference_id" },
            { icon: ShieldCheck, label: "Deposit Rate",    value: fmtPct(data.context.deposit_rate),         hint: `${fmtNumber(data.context.deposit_yes)} of ${fmtNumber(data.context.unique_applicants)}` },
            { icon: AlertTriangle, label: "No Fee Record", value: fmtPct(data.kpis.find(k => k.id === "F-02")?.value || 0), hint: "Critical compliance gap" },
          ].map((c, i) => (
            <Card key={i} className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-zinc-800/60 text-zinc-300"><c.icon className="w-4 h-4" /></div>
                <div className="text-xs text-zinc-500 font-mono-ui uppercase tracking-widest">{c.label}</div>
              </div>
              <div className="mt-3 font-heading text-2xl text-zinc-100">{c.value}</div>
              <div className="text-xs text-zinc-500 mt-1">{c.hint}</div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
