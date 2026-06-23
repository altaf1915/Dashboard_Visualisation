import React, { useState } from "react";
import { api } from "@/lib/api";
import { Card, MetricBadge, Pill, SectionHeader } from "@/components/Primitives";
import { Upload as UploadIcon, CheckCircle2, AlertTriangle, RefreshCcw } from "lucide-react";

function FileSlot({ title, hint, endpoint, testId }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!file) return;
    setLoading(true); setStatus(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await api.post(endpoint, fd, { headers: { "Content-Type": "multipart/form-data" }, timeout: 120000 });
      setStatus({ ok: true, msg: `Ingest complete · ${JSON.stringify(r.data.stats)}` });
    } catch (e) {
      setStatus({ ok: false, msg: e?.response?.data?.detail || e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-heading font-semibold text-zinc-100">{title}</h3>
          <p className="text-xs text-zinc-500 mt-0.5">{hint}</p>
        </div>
        <MetricBadge id="CSV" />
      </div>
      <label className="block border border-dashed border-zinc-700 hover:border-zinc-500 rounded-lg p-6 text-center cursor-pointer transition bg-zinc-900/40">
        <input data-testid={testId} type="file" accept=".csv" className="hidden" onChange={(e) => { setFile(e.target.files[0]); setStatus(null); }} />
        <UploadIcon className="w-5 h-5 mx-auto text-zinc-400" />
        <div className="mt-2 text-sm text-zinc-300">{file ? file.name : "Drop or click to choose a CSV"}</div>
        <div className="text-xs text-zinc-500 mt-1">.csv only · max ~20MB</div>
      </label>
      <div className="flex items-center justify-between mt-4">
        <Pill tone={status?.ok ? "compliant" : status?.ok === false ? "critical" : "neutral"}>
          {status?.ok ? <><CheckCircle2 className="w-3 h-3 inline mr-1" />Uploaded</> : status?.ok === false ? <><AlertTriangle className="w-3 h-3 inline mr-1" />Error</> : "Idle"}
        </Pill>
        <button
          onClick={submit}
          disabled={!file || loading}
          data-testid={`${testId}-submit`}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border border-zinc-800 bg-zinc-100 text-zinc-900 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {loading ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <UploadIcon className="w-3.5 h-3.5" />}
          {loading ? "Ingesting…" : "Upload & Ingest"}
        </button>
      </div>
      {status?.msg && (
        <div className={`mt-3 text-xs font-mono-ui ${status.ok ? "text-emerald-300" : "text-red-300"}`}>{status.msg}</div>
      )}
    </Card>
  );
}

export default function Upload() {
  const [reseedStatus, setReseedStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const reseed = async () => {
    setBusy(true); setReseedStatus(null);
    try {
      const r = await api.post("/ingest", {}, { timeout: 120000 });
      setReseedStatus({ ok: true, msg: `Re-ingested · ${JSON.stringify(r.data.stats)}` });
    } catch (e) {
      setReseedStatus({ ok: false, msg: e.message });
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-10">
      <div>
        <div className="font-mono-ui text-[11px] tracking-widest uppercase text-zinc-500 mb-1">Data Operations</div>
        <h1 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight text-zinc-100">CSV Upload &amp; Re-ingestion</h1>
        <p className="text-zinc-400 mt-2 max-w-3xl">
          Re-upload the Connect or SEVIS CSVs to replace the validated April 2026 datasets, or trigger a re-ingestion of the
          existing files on disk. Ingestion deduplicates Connect by reference_id (most recent modified_at) — mirroring the
          PostgreSQL workflow.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger">
        <FileSlot
          title="Connect CSV"
          hint="Replaces /app/data/connect.csv and re-runs deduplication."
          endpoint="/upload/connect"
          testId="upload-connect-input"
        />
        <FileSlot
          title="SEVIS CSV"
          hint="Replaces /app/data/sevis.csv and reloads SEVIS metrics."
          endpoint="/upload/sevis"
          testId="upload-sevis-input"
        />
      </div>

      <Card className="p-5">
        <SectionHeader
          kicker="Maintenance"
          title="Re-ingest existing files"
          subtitle="Reload data from /app/data without changing the CSVs. Useful after manual edits."
          right={
            <button
              data-testid="reingest-btn"
              onClick={reseed}
              disabled={busy}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border border-zinc-800 bg-zinc-900 hover:border-zinc-700 hover:bg-zinc-800/80 text-zinc-200 transition"
            >
              {busy ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCcw className="w-3.5 h-3.5" />}
              {busy ? "Re-ingesting…" : "Run Ingest"}
            </button>
          }
        />
        {reseedStatus && (
          <div className={`text-xs font-mono-ui ${reseedStatus.ok ? "text-emerald-300" : "text-red-300"}`}>
            {reseedStatus.msg}
          </div>
        )}
      </Card>
    </div>
  );
}
