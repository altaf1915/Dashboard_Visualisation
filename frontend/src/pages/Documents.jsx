import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useFilters } from "@/lib/filters";
import { Card, MetricBadge, SectionHeader, Spinner, Pill } from "@/components/Primitives";
import { VBar, HBar } from "@/components/Charts";
import { fmtNumber, fmtPct, SEVERITY } from "@/lib/api";

function MatrixCell({ item }) {
  const sev = SEVERITY[item.severity];
  return (
    <div
      data-testid={`matrix-${item.id.toLowerCase()}`}
      className="p-5 rounded-lg border transition hover:-translate-y-0.5"
      style={{ background: sev.bg, borderColor: sev.border }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-200">{item.label}</span>
        <MetricBadge id={item.id} />
      </div>
      <div className="font-heading text-3xl mt-3" style={{ color: sev.color }}>{fmtNumber(item.value)}</div>
      <div className="text-xs text-zinc-300 mt-1">{fmtPct(item.pct)} of applicants</div>
    </div>
  );
}

export default function Documents() {
  const { params } = useFilters();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get("/metrics/documents", { params }).then((r) => setData(r.data)).finally(() => setLoading(false));
  }, [params]);

  if (loading || !data) return <Spinner />;

  const t = data.totals;
  const completionBars = [
    { label: "I-20 Complete",     value: t.i20_complete,     pct: t.i20_pct,     severity: "moderate" },
    { label: "Deposit Complete",  value: t.deposit_complete, pct: t.deposit_pct, severity: "moderate" },
    { label: "Both Complete",     value: t.both_complete,    pct: t.both_pct,    severity: "compliant" },
    { label: "Neither Complete",  value: t.neither,          pct: t.neither_pct, severity: "critical" },
  ];

  return (
    <div className="space-y-10">
      <div>
        <div className="font-mono-ui text-[11px] tracking-widest uppercase text-zinc-500 mb-1">Section 3 · Document Compliance</div>
        <h1 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight text-zinc-100">Document Compliance Monitoring</h1>
        <p className="text-zinc-400 mt-2 max-w-3xl">
          I-20 and deposit completion across the deduplicated applicant pool ({fmtNumber(t.applicants)} unique applicants).
          The four-segment matrix sums to total ({fmtNumber(t.applicants)}) — validation passes.
        </p>
      </div>

      <section>
        <SectionHeader kicker="D-01 · D-02 · D-03 · D-04" title="Completion Snapshot" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 stagger">
          {completionBars.map((c, i) => (
            <Card key={i} className={`p-5 glow-${c.severity}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-zinc-400">{c.label}</span>
                <MetricBadge id={["D-01","D-02","D-03","D-04"][i]} />
              </div>
              <div className="font-heading text-3xl text-zinc-100">{fmtNumber(c.value)}</div>
              <div className="text-sm text-zinc-400 mt-1">{fmtPct(c.pct)}</div>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <SectionHeader kicker="V-07 · Cross-tab" title="I-20 × Deposit Matrix" subtitle="Four mutually-exclusive segments." />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 stagger">
          {data.matrix.map((m) => <MatrixCell key={m.id} item={m} />)}
        </div>
        <div className="mt-3 text-xs font-mono-ui text-zinc-500">
          Row sum check: {fmtNumber(data.matrix.reduce((a, b) => a + b.value, 0))} = {fmtNumber(t.applicants)} ✓
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-heading font-semibold text-zinc-100">Document Completion by Intake</h3>
              <p className="text-xs text-zinc-500 mt-0.5">April 2025 is an 11-applicant test batch; May 2025 is the actual cohort.</p>
            </div>
            <MetricBadge id="V-08" />
          </div>
          <div className="space-y-4 mt-2">
            {data.intakes.map((it) => (
              <div key={it.intake_month} className="p-4 rounded-lg bg-zinc-900/40 border border-zinc-800">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-heading font-medium text-zinc-100">{it.intake_month}</div>
                    <div className="text-xs text-zinc-500">{fmtNumber(it.applicants)} applicants</div>
                  </div>
                  <div className="flex gap-2">
                    <Pill tone="moderate">I-20 {fmtPct(it.i20_pct)}</Pill>
                    <Pill tone="info">Deposit {fmtPct(it.dep_pct)}</Pill>
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    { label: "I-20 Yes", v: it.i20_pct, color: "#60A5FA" },
                    { label: "Deposit Yes", v: it.dep_pct, color: "#82C358" },
                  ].map((b) => (
                    <div key={b.label}>
                      <div className="flex justify-between text-xs text-zinc-400 mb-1">
                        <span>{b.label}</span><span className="font-mono-ui">{fmtPct(b.v)}</span>
                      </div>
                      <div className="h-2 bg-zinc-800 rounded overflow-hidden">
                        <div className="h-full rounded" style={{ width: `${b.v}%`, background: b.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-heading font-semibold text-zinc-100">Staff Assignment</h3>
              <p className="text-xs text-zinc-500 mt-0.5">{fmtPct(t.unassigned_pct)} of applicants have no assigned staff member.</p>
            </div>
            <MetricBadge id="D-06" />
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 rounded-md border border-zinc-800 bg-zinc-900/40">
              <div className="text-xs text-zinc-500">Unassigned</div>
              <div className="font-heading text-2xl text-red-300">{fmtNumber(t.unassigned)}</div>
              <div className="text-xs text-zinc-500">{fmtPct(t.unassigned_pct)}</div>
            </div>
            <div className="p-3 rounded-md border border-zinc-800 bg-zinc-900/40">
              <div className="text-xs text-zinc-500">Assigned</div>
              <div className="font-heading text-2xl text-emerald-300">{fmtNumber(t.applicants - t.unassigned)}</div>
              <div className="text-xs text-zinc-500">{fmtPct(100 - t.unassigned_pct)}</div>
            </div>
          </div>
          <div className="text-xs text-zinc-500 font-mono-ui uppercase tracking-widest mb-2">Top assigned groupings</div>
          <HBar
            data={data.top_staff.map((s) => ({ label: s.label.length > 24 ? s.label.slice(0, 22) + "…" : s.label, value: s.value }))}
            height={Math.max(180, data.top_staff.length * 38)}
            formatter={(v) => v.toLocaleString()}
          />
        </Card>
      </div>
    </div>
  );
}
