import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

export default function OfficerDetail() {
  const nav = useNavigate();
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [ok, setOk] = useState(null);

  async function load() {
    setBusy(true);
    setErr(null);
    setOk(null);
    try {
      const res = await OfficerApi.getApplicationDetail(id);
      setData(res?.application || res);
    } catch (e) {
      setErr(e?.message || "Failed to load application");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function decide(decision) {
    setBusy(true);
    setErr(null);
    setOk(null);
    try {
      await OfficerApi.setDecision(id, { decision });
      setOk(`Decision recorded: ${decision}`);
      await load();
    } catch (e) {
      setErr(e?.message || "Failed to set decision");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container">
      <div className="row" style={{ marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: 22, letterSpacing: "-0.02em" }}>Application detail</div>
          <div className="small">ID: <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>{id}</span></div>
        </div>
        <div className="rowRight">
          <button className="btn" onClick={() => nav("/officer/queue")}>Back to queue</button>
          <button className="btn" onClick={load} disabled={busy}>{busy ? "Loading…" : "Refresh"}</button>
        </div>
      </div>

      {err && <Toast kind="err">{err}</Toast>}
      {ok && <Toast kind="ok">{ok}</Toast>}

      <Card
        title="Summary"
        subtitle={busy ? "Loading…" : "Key fields for review"}
        actions={data?.status ? <Pill color={statusColor(data.status)}>{data.status}</Pill> : null}
      >
        {!data ? (
          <div className="small">No data.</div>
        ) : (
          <div className="grid2">
            <div>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>Applicant</div>
              <div className="small">Email: {data.applicantEmail || data.email || data.ownerEmail || "—"}</div>
              <div className="small">Owner: {data.owner?.firstName ? `${data.owner.firstName} ${data.owner.lastName || ""}` : "—"}</div>
              <div className="small">Ownership: {data.owner?.ownershipPct ?? "—"}%</div>
            </div>
            <div>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>Business</div>
              <div className="small">Name: {data.business?.legalName || "—"}</div>
              <div className="small">EIN: {data.business?.ein || "—"}</div>
              <div className="small">Revenue: {data.business?.annualRevenue ? Number(data.business.annualRevenue).toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }) : "—"}</div>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>Loan</div>
              <div className="small">Amount: {data.loan?.amountRequested ? Number(data.loan.amountRequested).toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }) : (data.amountRequested ? Number(data.amountRequested).toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }) : "—")}</div>
              <div className="small">Term: {data.loan?.termMonths ?? data.termMonths ?? "—"} months</div>
              <div className="small">Purpose: {data.loan?.purpose || data.purpose || "—"}</div>
            </div>
          </div>
        )}
      </Card>

      <div style={{ height: 14 }} />

      <Card
        title="Decision"
        subtitle="Record an officer decision or route for manual review."
      >
        <div className="row">
          <button className="btn" disabled={busy} onClick={() => decide("MANUAL_REVIEW")}>Manual review</button>
          <button className="btn btnPrimary" disabled={busy} onClick={() => decide("PRE_QUALIFIED")}>Pre-qualified</button>
          <button className="btn btnDanger" disabled={busy} onClick={() => decide("DECLINED")}>Decline</button>
        </div>
        <div className="small" style={{ marginTop: 10 }}>
          Decisions are audit logged by the backend (expected). If your backend uses different decision codes, update the payload in <code>src/api/endpoints.js</code>.
        </div>
      </Card>
    </div>
  );
}
