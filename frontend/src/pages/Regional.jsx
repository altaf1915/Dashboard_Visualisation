import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useFilters } from "@/lib/filters";
import { Card, MetricBadge, SectionHeader, Spinner, Pill } from "@/components/Primitives";
import { fmtNumber, fmtPct, SEVERITY } from "@/lib/api";

export default function Regional() {
  const { params } = useFilters();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get("/metrics/regional", { params }).then((r) => setData(r.data)).finally(() => setLoading(false));
  }, [params]);

  if (loading || !data) return <Spinner />;

  const max = Math.max(...data.countries.map((c) => c.total)) || 1;

  return (
    <div className="space-y-10">
      <div>
        <div className="font-mono-ui text-[11px] tracking-widest uppercase text-zinc-500 mb-1">Section 5 · Regional & Citizenship Insights</div>
        <h1 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight text-zinc-100">Regional &amp; Citizenship Insights</h1>
        <p className="text-zinc-400 mt-2 max-w-3xl">
          Fee compliance by country, ranked low-to-high. Risk is computed as: &lt;30% critical, 30–60% moderate, ≥60% compliant.
          Nepal (15.6%) vs China (79.3%) is the largest single disparity in the dataset.
        </p>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-heading font-semibold text-zinc-100">Fee Compliance Rate by Country (Top 10)</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Bar color reflects risk classification.</p>
          </div>
          <div className="flex items-center gap-2">
            <MetricBadge id="F-06 · F-09" />
          </div>
        </div>

        <div className="space-y-3" data-testid="regional-list">
          {data.countries.map((c) => {
            const sev = SEVERITY[c.risk];
            return (
              <div key={c.country} className="grid grid-cols-12 items-center gap-3 p-3 rounded-md hover:bg-zinc-900/50 transition border border-transparent hover:border-zinc-800">
                <div className="col-span-3 sm:col-span-2 text-sm text-zinc-200">{c.country}</div>
                <div className="col-span-7 sm:col-span-7">
                  <div className="h-2.5 rounded-full bg-zinc-800/80 overflow-hidden relative">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${c.pct_paid}%`, background: sev.color, boxShadow: `0 0 12px ${sev.bg}` }} />
                    <div className="absolute inset-0 flex items-center" style={{ left: `calc(${(c.total / max) * 100}% + 4px)` }}>
                      <span className="text-[10px] font-mono-ui text-zinc-500">n={c.total}</span>
                    </div>
                  </div>
                </div>
                <div className="col-span-2 text-right font-mono-ui text-sm" style={{ color: sev.color }}>{fmtPct(c.pct_paid)}</div>
                <div className="col-span-12 sm:col-span-1 text-right"><Pill tone={c.risk}>{c.risk}</Pill></div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-900 flex items-center justify-between">
          <h3 className="font-heading font-semibold text-zinc-100">Detailed Country Breakdown</h3>
          <MetricBadge id="V-11" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="regional-table">
            <thead className="bg-zinc-950/60">
              <tr className="text-left text-[11px] font-mono-ui uppercase tracking-widest text-zinc-500">
                <th className="px-4 py-3">Country</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Paid</th>
                <th className="px-4 py-3 text-right">Unpaid</th>
                <th className="px-4 py-3 text-right">% Paid</th>
                <th className="px-4 py-3 text-center">Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {data.countries.map((c) => (
                <tr key={c.country} className="hover:bg-zinc-900/40 transition">
                  <td className="px-4 py-3 text-zinc-100">{c.country}</td>
                  <td className="px-4 py-3 text-right font-mono-ui">{fmtNumber(c.total)}</td>
                  <td className="px-4 py-3 text-right font-mono-ui text-emerald-300">{fmtNumber(c.paid)}</td>
                  <td className="px-4 py-3 text-right font-mono-ui text-red-300">{fmtNumber(c.unpaid)}</td>
                  <td className="px-4 py-3 text-right font-mono-ui" style={{ color: SEVERITY[c.risk].color }}>{fmtPct(c.pct_paid)}</td>
                  <td className="px-4 py-3 text-center"><Pill tone={c.risk}>{c.risk}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
