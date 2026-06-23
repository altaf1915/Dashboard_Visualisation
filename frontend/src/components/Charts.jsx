import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LabelList,
} from "recharts";

const COLORS = {
  compliant: "#70AD47",
  critical:  "#C00000",
  moderate:  "#F4B942",
  info:      "#60A5FA",
  primary:   "#60A5FA",
  neutral:   "#52525B",
};

const palette = ["#60A5FA", "#82C358", "#FCD34D", "#F472B6", "#A78BFA", "#34D399", "#F87171", "#FB923C", "#22D3EE", "#94A3B8"];

const tipStyle = {
  background: "rgba(9,9,11,0.92)",
  border: "1px solid #27272A",
  borderRadius: 8,
  fontSize: 12,
  color: "#F4F4F5",
  padding: "8px 10px",
  backdropFilter: "blur(8px)",
};

const tickStyle = { fill: "#A1A1AA", fontSize: 11, fontFamily: "IBM Plex Sans" };

export function HBar({ data, valueKey = "value", labelKey = "label", colorKey, height = 280, formatter, severityMap }) {
  const colored = data.map((d) => ({
    ...d,
    _fill: colorKey ? d[colorKey] : (severityMap ? COLORS[severityMap[d[labelKey]] || "primary"] : COLORS.primary),
  }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={colored} layout="vertical" margin={{ top: 8, right: 30, left: 8, bottom: 8 }}>
        <CartesianGrid stroke="#27272A" strokeDasharray="3 4" horizontal={false} />
        <XAxis type="number" tick={tickStyle} stroke="#3F3F46" />
        <YAxis type="category" dataKey={labelKey} tick={tickStyle} width={140} stroke="#3F3F46" />
        <Tooltip contentStyle={tipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }}
          formatter={formatter || ((v) => v.toLocaleString())} />
        <Bar dataKey={valueKey} radius={[0, 4, 4, 0]} animationDuration={650}>
          {colored.map((d, i) => <Cell key={i} fill={d._fill || COLORS.primary} />)}
          <LabelList dataKey={valueKey} position="right" fill="#A1A1AA" fontSize={11} formatter={formatter} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function VBar({ data, valueKey = "value", labelKey = "label", height = 280, severities, formatter }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid stroke="#27272A" strokeDasharray="3 4" vertical={false} />
        <XAxis dataKey={labelKey} tick={tickStyle} stroke="#3F3F46" interval={0} angle={-15} textAnchor="end" height={60} />
        <YAxis tick={tickStyle} stroke="#3F3F46" />
        <Tooltip contentStyle={tipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }}
          formatter={formatter || ((v) => v.toLocaleString())} />
        <Bar dataKey={valueKey} radius={[6, 6, 0, 0]} animationDuration={650}>
          {data.map((d, i) => {
            const sev = severities ? severities[i] || d.severity : d.severity;
            return <Cell key={i} fill={COLORS[sev] || COLORS.primary} />;
          })}
          <LabelList dataKey={valueKey} position="top" fill="#A1A1AA" fontSize={11} formatter={formatter} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function Donut({ data, valueKey = "value", labelKey = "label", height = 280, severityMap, totalLabel }) {
  const total = data.reduce((s, d) => s + (d[valueKey] || 0), 0);
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            dataKey={valueKey}
            nameKey={labelKey}
            innerRadius={70}
            outerRadius={105}
            paddingAngle={2}
            stroke="#09090B"
            strokeWidth={2}
            animationDuration={650}
          >
            {data.map((d, i) => (
              <Cell key={i} fill={
                d.severity ? COLORS[d.severity]
                  : severityMap ? COLORS[severityMap[d[labelKey]] || "primary"]
                  : palette[i % palette.length]
              } />
            ))}
          </Pie>
          <Tooltip contentStyle={tipStyle}
            formatter={(v, n) => [`${v.toLocaleString()} (${((v / total) * 100).toFixed(1)}%)`, n]} />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="text-2xl font-heading font-semibold text-zinc-100">{total.toLocaleString()}</div>
        <div className="text-[11px] font-mono-ui uppercase tracking-widest text-zinc-500">{totalLabel || "Total"}</div>
      </div>
    </div>
  );
}

export function Legend({ items }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3">
      {items.map((it, i) => (
        <div key={i} className="flex items-center gap-2 text-xs text-zinc-300">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: COLORS[it.severity] || palette[i % palette.length] }} />
          <span>{it.label}</span>
          {it.value != null && <span className="text-zinc-500 font-mono-ui">{it.value}</span>}
        </div>
      ))}
    </div>
  );
}

export { COLORS };
