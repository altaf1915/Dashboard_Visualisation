import React, { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useFilters } from "@/lib/filters";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard, Users, FileCheck2, Wallet, Globe2, Code2,
  BookText, Upload, Filter, X, RefreshCcw, Printer, ChevronRight,
  LogOut,
} from "lucide-react";

const NAV = [
  { to: "/",         label: "Overview",       icon: LayoutDashboard, end: true },
  { to: "/eligibility", label: "Eligibility", icon: Users },
  { to: "/documents",  label: "Documents",    icon: FileCheck2 },
  { to: "/fees",       label: "Fee Payment",  icon: Wallet },
  { to: "/regional",   label: "Regional",     icon: Globe2 },
  { to: "/sql",        label: "SQL Validation", icon: Code2 },
  { to: "/report",     label: "Report",       icon: BookText },
  { to: "/upload",     label: "Data Upload",  icon: Upload },
];

function Select({ label, value, onChange, options, testId }) {
  return (
    <label className="block">
      <span className="text-[11px] font-mono-ui uppercase tracking-widest text-zinc-500 mb-1.5 block">{label}</span>
      <div className="relative">
        <select
          data-testid={testId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 focus:border-blue-500/60 text-zinc-200 text-sm rounded-lg px-3 py-2 pr-8 appearance-none outline-none transition"
        >
          {options.map((o) => (
            <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
          ))}
        </select>
        <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 rotate-90 w-3.5 h-3.5 text-zinc-500" />
      </div>
    </label>
  );
}

function FilterSidebar() {
  const { filters, setFilter, options, resetFilters, activeCount } = useFilters();

  const opt = (arr, prefix = "All") => [prefix, ...(arr || [])].map((v) => ({ value: v, label: v }));

  return (
    <aside className="hidden md:flex md:flex-col w-64 shrink-0 border-r border-zinc-900 bg-[#09090B] sticky top-0 h-screen overflow-y-auto">
      <div className="px-5 pt-6 pb-4 border-b border-zinc-900">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center font-heading font-bold text-zinc-950">S</div>
          <div>
            <div className="font-heading text-sm font-semibold text-zinc-100 leading-tight">SLU Compliance</div>
            <div className="text-[10px] font-mono-ui uppercase tracking-widest text-zinc-500">Team 21 · Week 3</div>
          </div>
        </div>
      </div>

      <nav className="px-3 py-4 space-y-1">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            <item.icon className="w-4 h-4" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-3 border-t border-zinc-900 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] font-mono-ui uppercase tracking-widest text-zinc-500">
          <Filter className="w-3.5 h-3.5" /> Global Filters
          {activeCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 normal-case tracking-normal">{activeCount} active</span>
          )}
        </div>
        <button
          data-testid="reset-filters-btn"
          onClick={resetFilters}
          className="text-zinc-400 hover:text-zinc-100 transition"
          title="Reset filters"
        >
          <RefreshCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="px-4 pb-6 space-y-4 overflow-y-auto">
        <Select label="Intake Month" value={filters.intake_month} onChange={(v) => setFilter("intake_month", v)}
          options={opt(options?.intake_months)} testId="filter-intake-month" />
        <Select label="Country of Citizenship" value={filters.country} onChange={(v) => setFilter("country", v)}
          options={opt(options?.top_countries)} testId="filter-country" />
        <Select label="Education Level" value={filters.education_level} onChange={(v) => setFilter("education_level", v)}
          options={opt(options?.education_levels)} testId="filter-education" />
        <Select label="Gender" value={filters.gender} onChange={(v) => setFilter("gender", v)}
          options={opt(options?.genders)} testId="filter-gender" />
        <Select label="Fee Payment Status" value={filters.fee_status} onChange={(v) => setFilter("fee_status", v)}
          options={opt(options?.fee_statuses)} testId="filter-fee-status" />
        <Select label="I-20 Status" value={filters.i20_status} onChange={(v) => setFilter("i20_status", v)}
          options={opt(options?.i20_statuses)} testId="filter-i20-status" />
        <Select label="Deposit Status" value={filters.deposit_status} onChange={(v) => setFilter("deposit_status", v)}
          options={opt(options?.deposit_statuses)} testId="filter-deposit-status" />
        <Select label="Staff Assignment" value={filters.assignment_status} onChange={(v) => setFilter("assignment_status", v)}
          options={opt(options?.assignment_statuses)} testId="filter-assignment-status" />
      </div>
    </aside>
  );
}

function MobileFilters({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="absolute left-0 top-0 bottom-0 w-72 bg-[#09090B] border-r border-zinc-900 overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-900">
          <span className="font-heading font-semibold">Filters & Nav</span>
          <button onClick={onClose} className="text-zinc-400"><X className="w-5 h-5" /></button>
        </div>
        <FilterSidebar />
      </div>
    </div>
  );
}

function TopBar() {
  const loc = useLocation();
  const current = NAV.find((n) => (n.end ? n.to === loc.pathname : loc.pathname.startsWith(n.to))) || NAV[0];
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  return (
    <>
    <header className="sticky top-0 z-30 backdrop-blur-xl bg-[#09090B]/80 border-b border-zinc-900">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3 text-sm">
          <button className="md:hidden text-zinc-400 hover:text-zinc-100" onClick={() => setMobileOpen(true)} data-testid="mobile-menu-btn">
            <Filter className="w-5 h-5" />
          </button>
          <span className="font-mono-ui text-[11px] uppercase tracking-widest text-zinc-500">Compliance Dashboard</span>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-700" />
          <span className="font-heading font-medium text-zinc-100">{current?.label}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden md:inline text-[11px] font-mono-ui uppercase tracking-widest text-zinc-500">{user?.name || user?.email}</span>
          <button
            data-testid="print-btn"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-md border border-zinc-800 bg-zinc-900 hover:border-zinc-700 hover:bg-zinc-800/80 text-zinc-200 transition"
          >
            <Printer className="w-3.5 h-3.5" /> Export PDF
          </button>
          <button
            data-testid="logout-btn"
            onClick={logout}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-md border border-zinc-800 bg-zinc-900 hover:border-zinc-700 hover:bg-zinc-800/80 text-zinc-200 transition"
          >
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </div>
    </header>
    <MobileFilters open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}

export default function Layout() {
  return (
    <div className="min-h-screen flex bg-[#09090B] text-zinc-200">
      <FilterSidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar />
        <main className="flex-1 px-6 lg:px-8 py-8 max-w-[1400px] w-full mx-auto fade-up">
          <Outlet />
        </main>
        <footer className="px-6 lg:px-8 py-6 border-t border-zinc-900 text-[11px] font-mono-ui uppercase tracking-widest text-zinc-600 flex flex-wrap items-center justify-between gap-2">
          <span>SLU International Student Compliance · Team 21 · Week 3 Deliverable</span>
          <span>Data snapshot: 27 May 2025 · Built with Express + MongoDB + Recharts</span>
        </footer>
      </div>
    </div>
  );
}
