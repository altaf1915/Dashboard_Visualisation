import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { api } from "./api";

const FilterContext = createContext(null);

const DEFAULT_FILTERS = {
  intake_month: "All",
  country: "All",
  education_level: "All",
  gender: "All",
  fee_status: "All",
  i20_status: "All",
  deposit_status: "All",
  assignment_status: "All",
};

export function FilterProvider({ children }) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [options, setOptions] = useState(null);

  useEffect(() => {
    api.get("/filters/options").then((r) => setOptions(r.data)).catch(() => {});
  }, []);

  const setFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  const params = useMemo(() => {
    const p = {};
    Object.entries(filters).forEach(([k, v]) => {
      if (v && v !== "All") p[k] = v;
    });
    return p;
  }, [filters]);

  const activeCount = useMemo(
    () => Object.values(filters).filter((v) => v && v !== "All").length,
    [filters],
  );

  return (
    <FilterContext.Provider value={{ filters, setFilter, resetFilters, params, options, activeCount }}>
      {children}
    </FilterContext.Provider>
  );
}

export const useFilters = () => useContext(FilterContext);
