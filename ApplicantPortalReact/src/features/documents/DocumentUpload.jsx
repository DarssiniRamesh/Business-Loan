import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ApplicantApi } from "../../api/endpoints.js";
import { Card, Toast } from "../../components/ui.jsx";

const ACCEPTED = ["application/pdf", "image/jpeg", "image/png"];
const MAX_MB = 20;

// PUBLIC_INTERFACE
export default function DocumentUpload() {
  /** Applicant document upload UI. */
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const applicationId = sp.get("id");

  const [docType, setDocType] = useState("TAX_RETURN");
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [ok, setOk] = useState(null);
  const [docs, setDocs] = useState([]);

  const canUpload = useMemo(() => Boolean(applicationId && file && docType), [applicationId, file, docType]);

  async function refreshDocs() {
    if (!applicationId) return;
    try {
      const res = await ApplicantApi.listDocuments(applicationId);
      setDocs(res?.documents || res || []);
    } catch {
      setDocs([]);
    }
  }

  useEffect(() => {
    refreshDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

  function validateSelected(f) {
    if (!f) return "Please select a file";
    if (!ACCEPTED.includes(f.type)) return "Accepted file types: PDF, JPG, PNG";
    if (f.size > MAX_MB * 1024 * 1024) return `Max file size is ${MAX_MB}MB`;
    return null;
  }

  async function upload() {
    setError(null);
    setOk(null);
    const v = validateSelected(file);
    if (v) {
      setError(v);
      return;
    }
    setBusy(true);
    try {
      await ApplicantApi.uploadDocument(applicationId, file, docType);
      setOk("Uploaded successfully.");
      setFile(null);
      await refreshDocs();
    } catch (e) {
      setError(e?.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container">
      <div className="row" style={{ marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: 22, letterSpacing: "-0.02em" }}>Upload documents</div>
          <div className="small">Application ID: <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>{applicationId || "—"}</span></div>
        </div>
        <div className="rowRight">
          <button className="btn" onClick={() => nav(`/apply?id=${encodeURIComponent(applicationId || "")}`)} disabled={!applicationId}>Back to application</button>
          <button className="btn" onClick={() => nav("/dashboard")}>Dashboard</button>
        </div>
      </div>

      <Card title="Add a document" subtitle="Tax returns and bank statements help speed up the decision.">
        <div className="grid2">
          <div className="field">
            <label>Document type</label>
            <select value={docType} onChange={(e) => setDocType(e.target.value)}>
              <option value="TAX_RETURN">Tax return</option>
              <option value="BANK_STATEMENT">Bank statement</option>
              <option value="FINANCIAL_STATEMENT">Financial statement</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div className="field">
            <label>File</label>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <div className="help">Accepted: PDF/JPG/PNG. Max {MAX_MB}MB.</div>
          </div>
        </div>

        <div className="row">
          <button className="btn btnPrimary" onClick={upload} disabled={!canUpload || busy}>
            {busy ? "Uploading…" : "Upload"}
          </button>
        </div>

        {error && <Toast kind="err">{error}</Toast>}
        {ok && <Toast kind="ok">{ok}</Toast>}
      </Card>

      <div style={{ height: 14 }} />

      <Card title="Uploaded documents" subtitle="What we have on file for this application.">
        {docs?.length ? (
          <table className="table" aria-label="Documents">
            <thead>
              <tr>
                <th>Type</th>
                <th>Filename</th>
                <th>Uploaded</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d, idx) => (
                <tr key={d.id || idx}>
                  <td>{d.docType || d.type || "—"}</td>
                  <td>{d.fileName || d.filename || "—"}</td>
                  <td>{d.createdAt ? new Date(d.createdAt).toLocaleString() : "—"}</td>
                  <td>{d.status || "RECEIVED"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="small">No documents uploaded yet.</div>
        )}
      </Card>
    </div>
  );
}
