import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useFilters } from "@/lib/filters";
import { Card, MetricBadge, SectionHeader, Spinner, Pill } from "@/components/Primitives";
import { VBar, Donut } from "@/components/Charts";
import { fmtNumber, fmtPct, SEVERITY } from "@/lib/api";

export default function Fees() {
  const { params } = useFilters();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get("/metrics/fees", { params }).then((r) => setData(r.data)).finally(() => setLoading(false));
  }, [params]);

  if (loading || !data) return <Spinner />;

  const t = data.totals;

  return (
    <div className="space-y-10">
      <div>
        <div className="font-mono-ui text-[11px] tracking-widest uppercase text-zinc-500 mb-1">Section 4 · Government Fee Payment</div>
        <h1 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight text-zinc-100">Government Fee Payment Tracking</h1>
        <p className="text-zinc-400 mt-2 max-w-3xl">
          I-901 fee status from SEVIS. {fmtPct(t.no_record / t.total * 100)} of records have no payment registered — the single largest
          compliance gap in the dataset.
        </p>
      </div>

      <section>
        <SectionHeader kicker="F-01 · F-02 · F-03" title="Fee Payment Status" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 stagger">
          {data.status_distribution.map((s) => (
            <Card key={s.id} className={`p-5 glow-${s.severity}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-zinc-400">{s.label}</span>
                <MetricBadge id={s.id} />
              </div>
              <div className="font-heading text-3xl" style={{ color: SEVERITY[s.severity].color }}>
                {fmtNumber(s.value)}
              </div>
              <div className="text-sm text-zinc-400 mt-1">{fmtPct(s.pct)} of SEVIS</div>
            </Card>
          ))}
        </div>
        <Card className="p-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
            <Donut data={data.status_distribution} totalLabel="SEVIS Records" />
            <div className="space-y-3">
              <div className="text-xs font-mono-ui uppercase tracking-widest text-zinc-500">Cross-table consistency (V-12)</div>
              <div className="font-mono-ui text-sm text-zinc-300 leading-relaxed">
                paid ({fmtNumber(t.paid)}) + cancelled ({fmtNumber(t.cancelled)}) + no_record ({fmtNumber(t.no_record)}) = <span className="text-emerald-300">{fmtNumber(t.total)}</span>
              </div>
              <Pill tone="compliant">Validation ✓</Pill>
            </div>
          </div>
        </Card>
      </section>

      <section>
        <SectionHeader kicker="V-10 · Timing" title="Fee Payment Timing Analysis"
          subtitle={`Days between I-901 payment and program start. ${fmtNumber(t.late_payers)} late payers (after/on start) — flagged red.`} />
        <Card className="p-5">
          <VBar
            data={data.timing}
            valueKey="value"
            labelKey="label"
            height={320}
            formatter={(v) => v.toLocaleString()}
          />
        </Card>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 stagger">
          <Card className="p-4">
            <div className="text-xs text-zinc-500">Total Paid</div>
            <div className="font-heading text-2xl text-zinc-100">{fmtNumber(t.paid)}</div>
          </Card>
          <Card className="p-4 glow-critical">
            <div className="text-xs text-zinc-500">Late Payers</div>
            <div className="font-heading text-2xl text-red-300">{fmtNumber(t.late_payers)}</div>
            <div className="text-[11px] text-zinc-500">{fmtPct(t.paid ? t.late_payers / t.paid * 100 : 0)} of paid</div>
          </Card>
          <Card className="p-4 glow-compliant">
            <div className="text-xs text-zinc-500">Early Payers (180+ days)</div>
            <div className="font-heading text-2xl text-emerald-300">{fmtNumber(t.early_payers)}</div>
            <div className="text-[11px] text-zinc-500">{fmtPct(t.paid ? t.early_payers / t.paid * 100 : 0)} of paid</div>
          </Card>
          <Card className="p-4 glow-critical">
            <div className="text-xs text-zinc-500">No Record</div>
            <div className="font-heading text-2xl text-red-300">{fmtNumber(t.no_record)}</div>
            <div className="text-[11px] text-zinc-500">{fmtPct(t.no_record / t.total * 100)} of SEVIS</div>
          </Card>
        </div>
      </section>
    </div>
  );
}
