import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { OfficerApi } from "../../api/endpoints.js";
import { Card, Pill, Toast } from "../../components/ui.jsx";

function statusColor(status) {
  if (!status) return "default";
  const s = String(status).toUpperCase();
  if (["APPROVED", "PRE_QUALIFIED"].includes(s)) return "ok";
  if (["MANUAL_REVIEW", "PENDING", "IN_REVIEW", "SUBMITTED"].includes(s)) return "warn";
  if (["DECLINED", "REJECTED"].includes(s)) return "bad";
  return "default";
}

export default function OfficerQueue() {
  const nav = useNavigate();
  const [status, setStatus] = useState("ALL");
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  async function load() {
    setBusy(true);
    setErr(null);
    try {
      const res = await OfficerApi.listQueue(status);
      setItems(res?.items || res?.applications || res || []);
    } catch (e) {
      setErr(e?.message || "Failed to load queue");
      setItems([]);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <div className="container">
      <div className="row" style={{ marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: 22, letterSpacing: "-0.02em" }}>Officer queue</div>
          <div className="small">Review and decide applications requiring attention.</div>
        </div>
        <div className="rowRight">
          <button className="btn" onClick={load} disabled={busy}>{busy ? "Refreshing…" : "Refresh"}</button>
        </div>
      </div>

      {err && <Toast kind="err">{err}</Toast>}

      <Card
        title="Filters"
        subtitle="Use status to narrow down the work queue."
      >
        <div className="row">
          <div className="field" style={{ marginBottom: 0, minWidth: 240 }}>
            <label>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="ALL">All</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="IN_REVIEW">In review</option>
              <option value="MANUAL_REVIEW">Manual review required</option>
              <option value="PRE_QUALIFIED">Pre-qualified</option>
              <option value="DECLINED">Declined</option>
            </select>
          </div>
        </div>
      </Card>

      <div style={{ height: 14 }} />

      <Card title="Queue" subtitle={busy ? "Loading…" : `${items.length} item(s)`}>
        {items?.length ? (
          <table className="table" aria-label="Officer queue table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Applicant</th>
                <th>Status</th>
                <th>Requested</th>
                <th>Updated</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id || a.applicationId}>
                  <td style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>{a.id || a.applicationId}</td>
                  <td>{a.applicantEmail || a.email || a.ownerEmail || "—"}</td>
                  <td><Pill color={statusColor(a.status)}>{a.status || "—"}</Pill></td>
                  <td>{a.amountRequested ? Number(a.amountRequested).toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }) : "—"}</td>
                  <td>{a.updatedAt ? new Date(a.updatedAt).toLocaleString() : "—"}</td>
                  <td>
                    <button className="btn btnPrimary" onClick={() => nav(`/officer/applications/${encodeURIComponent(a.id || a.applicationId)}`)}>
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="small">No items in queue for this filter.</div>
        )}
      </Card>
    </div>
  );
}
