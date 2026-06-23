import React, { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { LockKeyhole, LogIn, UserPlus } from "lucide-react";
import { useAuth } from "@/lib/auth";

function AuthShell({ mode }) {
  const isRegister = mode === "register";
  const { login, register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (isRegister) await register(form);
      else await login({ email: form.email, password: form.password });
      navigate("/", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#09090B] text-zinc-100 flex items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-md border border-zinc-800 bg-zinc-950 rounded-lg p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-md bg-emerald-400 text-zinc-950 flex items-center justify-center">
            <LockKeyhole className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-semibold">{isRegister ? "Create account" : "Welcome back"}</h1>
            <p className="text-sm text-zinc-500">SLU Compliance Dashboard</p>
          </div>
        </div>

        {isRegister && (
          <label className="block mb-4">
            <span className="text-xs text-zinc-400">Name</span>
            <input className="mt-1 w-full rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 outline-none focus:border-emerald-400" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </label>
        )}

        <label className="block mb-4">
          <span className="text-xs text-zinc-400">Email</span>
          <input type="email" className="mt-1 w-full rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 outline-none focus:border-emerald-400" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </label>

        <label className="block mb-4">
          <span className="text-xs text-zinc-400">Password</span>
          <input type="password" minLength={6} className="mt-1 w-full rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 outline-none focus:border-emerald-400" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        </label>

        {error && <div className="mb-4 rounded-md border border-red-900/50 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>}

        <button disabled={busy} className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-zinc-100 text-zinc-950 px-4 py-2 font-medium hover:bg-white disabled:opacity-60">
          {isRegister ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
          {busy ? "Please wait..." : isRegister ? "Register" : "Login"}
        </button>

        <p className="mt-4 text-sm text-zinc-500 text-center">
          {isRegister ? "Already have an account?" : "Need an account?"}{" "}
          <Link className="text-emerald-300 hover:text-emerald-200" to={isRegister ? "/login" : "/register"}>
            {isRegister ? "Login" : "Register"}
          </Link>
        </p>
      </form>
    </main>
  );
}

export function Login() {
  return <AuthShell mode="login" />;
}

export function Register() {
  return <AuthShell mode="register" />;
}
