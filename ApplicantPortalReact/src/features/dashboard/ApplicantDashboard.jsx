import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ApplicantApi } from "../../api/endpoints.js";
import { Card, Pill, Toast } from "../../components/ui.jsx";

function statusColor(status) {
  if (!status) return "default";
  const s = String(status).toUpperCase();
  if (["APPROVED", "PRE_QUALIFIED"].includes(s)) return "ok";
  if (["MANUAL_REVIEW", "PENDING", "IN_REVIEW", "SUBMITTED"].includes(s)) return "warn";
  if (["DECLINED", "REJECTED"].includes(s)) return "bad";
  return "default";
}

export default function ApplicantDashboard() {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const submitted = sp.get("submitted");

  const [apps, setApps] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  async function load() {
    setBusy(true);
    setErr(null);
    try {
      const res = await ApplicantApi.listMyApplications();
      setApps(res?.applications || res || []);
    } catch (e) {
      setErr(e?.message || "Failed to load applications");
      setApps([]);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="container">
      <div className="row" style={{ marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: 22, letterSpacing: "-0.02em" }}>Your applications</div>
          <div className="small">Track status and next steps.</div>
        </div>
        <div className="rowRight">
          <button className="btn btnPrimary" onClick={() => nav("/apply")}>Start new application</button>
        </div>
      </div>

      {submitted && <Toast kind="ok">Application submitted. We’ll update status as soon as risk assessment completes.</Toast>}
      {err && <Toast kind="err">{err}</Toast>}

      <Card
        title="Applications"
        subtitle={busy ? "Loading…" : "Select an application to continue or upload documents."}
        actions={<button className="btn" onClick={load} disabled={busy}>Refresh</button>}
      >
        {apps?.length ? (
          <table className="table" aria-label="My applications">
            <thead>
              <tr>
                <th>ID</th>
                <th>Status</th>
                <th>Requested</th>
                <th>Updated</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {apps.map((a) => (
                <tr key={a.id || a.applicationId}>
                  <td style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>{a.id || a.applicationId}</td>
                  <td><Pill color={statusColor(a.status)}>{a.status || "DRAFT"}</Pill></td>
                  <td>{a.amountRequested ? Number(a.amountRequested).toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }) : "—"}</td>
                  <td>{a.updatedAt ? new Date(a.updatedAt).toLocaleString() : "—"}</td>
                  <td>
                    <div className="row" style={{ justifyContent: "flex-end" }}>
                      <button className="btn" onClick={() => nav(`/documents?id=${encodeURIComponent(a.id || a.applicationId)}`)}>Documents</button>
                      <button className="btn btnPrimary" onClick={() => nav(`/apply?id=${encodeURIComponent(a.id || a.applicationId)}`)}>Open</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="small">No applications yet. Click “Start new application”.</div>
        )}
      </Card>
    </div>
  );
}
