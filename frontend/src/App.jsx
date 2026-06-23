import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import Overview from "@/pages/Overview";
import Eligibility from "@/pages/Eligibility";
import Documents from "@/pages/Documents";
import Fees from "@/pages/Fees";
import Regional from "@/pages/Regional";
import SqlValidation from "@/pages/SqlValidation";
import Report from "@/pages/Report";
import Upload from "@/pages/Upload";
import { Login, Register } from "@/pages/Auth";
import { FilterProvider } from "@/lib/filters";
import { AuthProvider, useAuth } from "@/lib/auth";

function Protected({ children }) {
  const { ready, isAuthenticated } = useAuth();
  if (!ready) return <div className="min-h-screen bg-[#09090B] text-zinc-400 flex items-center justify-center">Loading...</div>;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <AuthProvider>
      <FilterProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route element={<Protected><Layout /></Protected>}>
              <Route index element={<Overview />} />
              <Route path="/eligibility" element={<Eligibility />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/fees" element={<Fees />} />
              <Route path="/regional" element={<Regional />} />
              <Route path="/sql" element={<SqlValidation />} />
              <Route path="/report" element={<Report />} />
              <Route path="/upload" element={<Upload />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </FilterProvider>
    </AuthProvider>
  );
}

export default App;
