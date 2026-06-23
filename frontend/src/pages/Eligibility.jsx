import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useFilters } from "@/lib/filters";
import { Card, MetricBadge, SectionHeader, Spinner } from "@/components/Primitives";
import { HBar, VBar, Donut, COLORS } from "@/components/Charts";
import { fmtNumber, fmtPct } from "@/lib/api";

export default function Eligibility() {
  const { params } = useFilters();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get("/metrics/eligibility", { params }).then((r) => setData(r.data)).finally(() => setLoading(false));
  }, [params]);

  if (loading || !data) return <Spinner />;

  return (
    <div className="space-y-10">
      <div>
        <div className="font-mono-ui text-[11px] tracking-widest uppercase text-zinc-500 mb-1">Section 2 · Eligibility Breakdown</div>
        <h1 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight text-zinc-100">Eligibility Breakdown</h1>
        <p className="text-zinc-400 mt-2 max-w-3xl">
          Distribution of the SEVIS cohort across education level, nationality, gender and I-20 issue reason.
          The cohort is dominated by Master&apos;s-level students from India.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 stagger">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-heading font-semibold text-zinc-100">Education Level Distribution</h3>
              <p className="text-xs text-zinc-500 mt-0.5">SEVIS records · Master&apos;s dominates at 86.9%</p>
            </div>
            <MetricBadge id="E-08" />
          </div>
          <VBar data={data.education_level} valueKey="value" labelKey="label"
            severities={data.education_level.map(() => "info")} formatter={(v) => v.toLocaleString()} />
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-heading font-semibold text-zinc-100">Top 10 Countries of Citizenship</h3>
              <p className="text-xs text-zinc-500 mt-0.5">India accounts for ~59% of SEVIS records</p>
            </div>
            <MetricBadge id="E-08" />
          </div>
          <HBar data={data.top_countries} formatter={(v) => v.toLocaleString()} height={340} />
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-heading font-semibold text-zinc-100">Gender Distribution</h3>
              <p className="text-xs text-zinc-500 mt-0.5">SEVIS cohort split</p>
            </div>
            <MetricBadge id="E-08" />
          </div>
          <Donut data={data.gender} totalLabel="Students" />
          <div className="mt-3 grid grid-cols-2 gap-3">
            {data.gender.map((g, i) => (
              <div key={i} className="text-sm flex items-center justify-between p-2 rounded-md bg-zinc-900/60 border border-zinc-800">
                <span className="text-zinc-300">{g.label}</span>
                <span className="font-mono-ui text-zinc-100">{fmtNumber(g.value)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-heading font-semibold text-zinc-100">I-20 Issue Reason</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Initial issuances drive the bulk of activity</p>
            </div>
            <MetricBadge id="E-02" />
          </div>
          <HBar data={data.i20_issue_reason} formatter={(v) => v.toLocaleString()} height={300} />
        </Card>
      </div>
    </div>
  );
}
