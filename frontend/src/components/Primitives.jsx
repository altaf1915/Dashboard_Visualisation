import React from "react";

export const MetricBadge = ({ id, className = "" }) => (
  <span className={`metric-id ${className}`} data-testid={`metric-id-${id}`}>{id}</span>
);

export const SectionHeader = ({ title, subtitle, right, kicker }) => (
  <div className="flex items-end justify-between gap-6 mb-5 flex-wrap">
    <div>
      {kicker && (
        <div className="font-mono-ui text-[11px] tracking-widest uppercase text-zinc-500 mb-1">
          {kicker}
        </div>
      )}
      <h2 className="font-heading text-2xl font-semibold text-zinc-100">{title}</h2>
      {subtitle && <p className="text-sm text-zinc-400 mt-1 max-w-2xl">{subtitle}</p>}
    </div>
    {right}
  </div>
);

export const Card = ({ className = "", glow, children, ...rest }) => (
  <div className={`surface ${glow ? `glow-${glow}` : ""} ${className}`} {...rest}>
    {children}
  </div>
);

export const Pill = ({ tone = "info", children }) => {
  const toneMap = {
    info:      "bg-blue-500/10 text-blue-300 border-blue-500/30",
    compliant: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    critical:  "bg-red-500/10 text-red-300 border-red-500/30",
    moderate:  "bg-amber-500/10 text-amber-300 border-amber-500/30",
    neutral:   "bg-zinc-800/60 text-zinc-300 border-zinc-700",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${toneMap[tone]}`}>
      {children}
    </span>
  );
};

export const Spinner = () => (
  <div className="flex items-center justify-center py-10" data-testid="loading-spinner">
    <div className="h-5 w-5 rounded-full border-2 border-zinc-700 border-t-zinc-300 animate-spin" />
  </div>
);
