import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ApplicantApi } from "../../api/endpoints.js";
import { Card, Toast } from "../../components/ui.jsx";
import { businessSchema, loanSchema, ownerSchema } from "./schemas.js";
import { useAutosaveDraft } from "./useAutosave.js";

const steps = [
  { key: "business", label: "Business" },
  { key: "owner", label: "Owner" },
  { key: "loan", label: "Loan Request" },
  { key: "review", label: "Review & Submit" }
];

function formatCurrency(n) {
  if (n === undefined || n === null || n === "") return "";
  const num = Number(n);
  if (Number.isNaN(num)) return String(n);
  return num.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export default function ApplicationWizard() {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const applicationId = sp.get("id");

  const [creating, setCreating] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [current, setCurrent] = useState(0);

  const { draft, updateDraft, saveNow, saving, lastSavedAt, saveError, setDraft } = useAutosaveDraft({
    applicationId,
    initialDraft: { business: {}, owner: {}, loan: {} }
  });

  // If no applicationId, create skeleton and redirect.
  useEffect(() => {
    let cancelled = false;
    async function ensureApp() {
      if (applicationId) return;
      setCreating(true);
      setServerError(null);
      try {
        const res = await ApplicantApi.createApplication();
        const id = res?.id || res?.applicationId;
        if (!id) throw new Error("Backend did not return application id");
        if (!cancelled) nav(`/apply?id=${encodeURIComponent(id)}`, { replace: true });
      } catch (e) {
        if (!cancelled) setServerError(e?.message || "Failed to create application");
      } finally {
        if (!cancelled) setCreating(false);
      }
    }
    ensureApp();
    return () => {
      cancelled = true;
    };
  }, [applicationId, nav]);

  // Load existing server state if app exists.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!applicationId) return;
      try {
        const res = await ApplicantApi.getApplication(applicationId);
        const normalized = res?.draft || res?.data || res;
        if (!cancelled && normalized) {
          setDraft((prev) => ({
            business: { ...(prev.business || {}), ...(normalized.business || {}) },
            owner: { ...(prev.owner || {}), ...(normalized.owner || {}) },
            loan: { ...(prev.loan || {}), ...(normalized.loan || {}) }
          }));
        }
      } catch {
        // ignore: we still allow local draft editing
      }
    }
    load();
  }, [applicationId, setDraft]);

  const businessForm = useForm({
    resolver: zodResolver(businessSchema),
    defaultValues: useMemo(() => draft.business, [draft.business]),
    mode: "onBlur"
  });
  const ownerForm = useForm({
    resolver: zodResolver(ownerSchema),
    defaultValues: useMemo(() => draft.owner, [draft.owner]),
    mode: "onBlur"
  });
  const loanForm = useForm({
    resolver: zodResolver(loanSchema),
    defaultValues: useMemo(() => draft.loan, [draft.loan]),
    mode: "onBlur"
  });

  // Keep RHF in sync when draft changes due to server load.
  useEffect(() => businessForm.reset(draft.business), [draft.business]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => ownerForm.reset(draft.owner), [draft.owner]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => loanForm.reset(draft.loan), [draft.loan]); // eslint-disable-line react-hooks/exhaustive-deps

  const step = steps[current];

  async function nextFromBusiness(values) {
    Object.entries(values).forEach(([k, v]) => updateDraft(`business.${k}`, v));
    await saveNow();
    setCurrent(1);
  }
  async function nextFromOwner(values) {
    Object.entries(values).forEach(([k, v]) => updateDraft(`owner.${k}`, v));
    await saveNow();
    setCurrent(2);
  }
  async function nextFromLoan(values) {
    Object.entries(values).forEach(([k, v]) => updateDraft(`loan.${k}`, v));
    await saveNow();
    setCurrent(3);
  }

  async function submit() {
    setServerError(null);
    try {
      await saveNow();
      await ApplicantApi.submitApplication(applicationId);
      nav(`/dashboard?submitted=1&id=${encodeURIComponent(applicationId)}`);
    } catch (e) {
      setServerError(e?.message || "Submission failed");
    }
  }

  return (
    <div className="container">
      <div className="row" style={{ marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: 22, letterSpacing: "-0.02em" }}>Loan Application</div>
          <div className="small">
            Application ID: <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>{applicationId || "—"}</span>
          </div>
        </div>
        <div className="rowRight">
          <button className="btn" onClick={() => nav("/dashboard")}>Back to dashboard</button>
        </div>
      </div>

      <div className="stepper" aria-label="Application steps">
        {steps.map((s, idx) => {
          const cls = idx === current ? "step stepActive" : idx < current ? "step stepDone" : "step";
          return (
            <button
              key={s.key}
              type="button"
              className={cls}
              onClick={() => setCurrent(idx)}
              disabled={creating}
              aria-current={idx === current ? "step" : undefined}
            >
              {idx + 1}. {s.label}
            </button>
          );
        })}
      </div>

      {serverError && <Toast kind="err">{serverError}</Toast>}
      {saveError && <Toast kind="err">Autosave error: {saveError}</Toast>}
      {(saving || lastSavedAt) && (
        <div className="small" style={{ margin: "10px 0" }}>
          {saving ? "Saving…" : `Saved ${new Date(lastSavedAt).toLocaleTimeString()}`}
        </div>
      )}

      {creating && (
        <Card title="Preparing application…">
          <div className="small">Creating a new application record.</div>
        </Card>
      )}

      {!creating && step?.key === "business" && (
        <Card title="Business information" subtitle="Tell us about your company.">
          <form onSubmit={businessForm.handleSubmit(nextFromBusiness)}>
            <div className="grid2">
              <div className="field">
                <label>Legal business name</label>
                <input {...businessForm.register("legalName")} onBlur={(e) => updateDraft("business.legalName", e.target.value)} />
                {businessForm.formState.errors.legalName && <div className="error">{businessForm.formState.errors.legalName.message}</div>}
              </div>
              <div className="field">
                <label>DBA / Trade name (optional)</label>
                <input {...businessForm.register("dbaName")} onBlur={(e) => updateDraft("business.dbaName", e.target.value)} />
              </div>

              <div className="field">
                <label>EIN</label>
                <input placeholder="12-3456789" {...businessForm.register("ein")} onBlur={(e) => updateDraft("business.ein", e.target.value)} />
                {businessForm.formState.errors.ein && <div className="error">{businessForm.formState.errors.ein.message}</div>}
              </div>
              <div className="field">
                <label>Industry</label>
                <input {...businessForm.register("industry")} onBlur={(e) => updateDraft("business.industry", e.target.value)} />
                {businessForm.formState.errors.industry && <div className="error">{businessForm.formState.errors.industry.message}</div>}
              </div>

              <div className="field">
                <label>Years in business</label>
                <input type="number" min="0" {...businessForm.register("yearsInBusiness")} onBlur={(e) => updateDraft("business.yearsInBusiness", e.target.value)} />
                {businessForm.formState.errors.yearsInBusiness && <div className="error">{businessForm.formState.errors.yearsInBusiness.message}</div>}
              </div>
              <div className="field">
                <label>Annual revenue (self-reported)</label>
                <input type="number" min="0" {...businessForm.register("annualRevenue")} onBlur={(e) => updateDraft("business.annualRevenue", e.target.value)} />
                {businessForm.formState.errors.annualRevenue && <div className="error">{businessForm.formState.errors.annualRevenue.message}</div>}
              </div>
            </div>

            <div className="grid2">
              <div className="field">
                <label>Address line 1</label>
                <input {...businessForm.register("addressLine1")} onBlur={(e) => updateDraft("business.addressLine1", e.target.value)} />
                {businessForm.formState.errors.addressLine1 && <div className="error">{businessForm.formState.errors.addressLine1.message}</div>}
              </div>
              <div className="field">
                <label>Address line 2 (optional)</label>
                <input {...businessForm.register("addressLine2")} onBlur={(e) => updateDraft("business.addressLine2", e.target.value)} />
              </div>
              <div className="field">
                <label>City</label>
                <input {...businessForm.register("city")} onBlur={(e) => updateDraft("business.city", e.target.value)} />
                {businessForm.formState.errors.city && <div className="error">{businessForm.formState.errors.city.message}</div>}
              </div>
              <div className="field">
                <label>State</label>
                <input {...businessForm.register("state")} onBlur={(e) => updateDraft("business.state", e.target.value)} />
                {businessForm.formState.errors.state && <div className="error">{businessForm.formState.errors.state.message}</div>}
              </div>
              <div className="field">
                <label>ZIP / Postal code</label>
                <input {...businessForm.register("postalCode")} onBlur={(e) => updateDraft("business.postalCode", e.target.value)} />
                {businessForm.formState.errors.postalCode && <div className="error">{businessForm.formState.errors.postalCode.message}</div>}
              </div>
            </div>

            <div className="row">
              <button className="btn btnPrimary" type="submit">Continue</button>
              <div className="small">We autosave your progress as you go.</div>
            </div>
          </form>
        </Card>
      )}

      {!creating && step?.key === "owner" && (
        <Card title="Owner information" subtitle="Primary owner (for preliminary risk assessment).">
          <form onSubmit={ownerForm.handleSubmit(nextFromOwner)}>
            <div className="grid2">
              <div className="field">
                <label>First name</label>
                <input {...ownerForm.register("firstName")} onBlur={(e) => updateDraft("owner.firstName", e.target.value)} />
                {ownerForm.formState.errors.firstName && <div className="error">{ownerForm.formState.errors.firstName.message}</div>}
              </div>
              <div className="field">
                <label>Last name</label>
                <input {...ownerForm.register("lastName")} onBlur={(e) => updateDraft("owner.lastName", e.target.value)} />
                {ownerForm.formState.errors.lastName && <div className="error">{ownerForm.formState.errors.lastName.message}</div>}
              </div>

              <div className="field">
                <label>Email</label>
                <input type="email" {...ownerForm.register("email")} onBlur={(e) => updateDraft("owner.email", e.target.value)} />
                {ownerForm.formState.errors.email && <div className="error">{ownerForm.formState.errors.email.message}</div>}
              </div>
              <div className="field">
                <label>Phone</label>
                <input {...ownerForm.register("phone")} onBlur={(e) => updateDraft("owner.phone", e.target.value)} />
                {ownerForm.formState.errors.phone && <div className="error">{ownerForm.formState.errors.phone.message}</div>}
              </div>

              <div className="field">
                <label>SSN (last 4)</label>
                <input inputMode="numeric" maxLength={4} {...ownerForm.register("ssnLast4")} onBlur={(e) => updateDraft("owner.ssnLast4", e.target.value)} />
                {ownerForm.formState.errors.ssnLast4 && <div className="error">{ownerForm.formState.errors.ssnLast4.message}</div>}
                <div className="help">We only collect the last 4 digits for this MVP.</div>
              </div>
              <div className="field">
                <label>Ownership %</label>
                <input type="number" min="0" max="100" {...ownerForm.register("ownershipPct")} onBlur={(e) => updateDraft("owner.ownershipPct", e.target.value)} />
                {ownerForm.formState.errors.ownershipPct && <div className="error">{ownerForm.formState.errors.ownershipPct.message}</div>}
              </div>
            </div>

            <div className="row">
              <button className="btn" type="button" onClick={() => setCurrent(0)}>Back</button>
              <button className="btn btnPrimary" type="submit">Continue</button>
            </div>
          </form>
        </Card>
      )}

      {!creating && step?.key === "loan" && (
        <Card title="Loan request" subtitle="Requested amount and purpose.">
          <form onSubmit={loanForm.handleSubmit(nextFromLoan)}>
            <div className="grid2">
              <div className="field">
                <label>Amount requested</label>
                <input type="number" min="0" {...loanForm.register("amountRequested")} onBlur={(e) => updateDraft("loan.amountRequested", e.target.value)} />
                {loanForm.formState.errors.amountRequested && <div className="error">{loanForm.formState.errors.amountRequested.message}</div>}
                <div className="help">Example: {formatCurrency(250000)}</div>
              </div>
              <div className="field">
                <label>Term (months)</label>
                <input type="number" min="6" max="240" {...loanForm.register("termMonths")} onBlur={(e) => updateDraft("loan.termMonths", e.target.value)} />
                {loanForm.formState.errors.termMonths && <div className="error">{loanForm.formState.errors.termMonths.message}</div>}
              </div>
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label>Purpose</label>
                <textarea rows={3} {...loanForm.register("purpose")} onBlur={(e) => updateDraft("loan.purpose", e.target.value)} />
                {loanForm.formState.errors.purpose && <div className="error">{loanForm.formState.errors.purpose.message}</div>}
              </div>
            </div>

            <div className="row">
              <button className="btn" type="button" onClick={() => setCurrent(1)}>Back</button>
              <button className="btn btnPrimary" type="submit">Continue</button>
            </div>
          </form>
        </Card>
      )}

      {!creating && step?.key === "review" && (
        <Card
          title="Review & submit"
          subtitle="Confirm details, upload documents, then submit for instant decisioning."
          actions={<button className="btn" onClick={() => nav(`/documents?id=${encodeURIComponent(applicationId)}`)}>Upload documents</button>}
        >
          <div className="grid2">
            <div>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>Business</div>
              <div className="small">Name: {draft.business?.legalName || "—"}</div>
              <div className="small">EIN: {draft.business?.ein || "—"}</div>
              <div className="small">Industry: {draft.business?.industry || "—"}</div>
              <div className="small">Revenue: {draft.business?.annualRevenue ? formatCurrency(draft.business.annualRevenue) : "—"}</div>
            </div>
            <div>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>Owner</div>
              <div className="small">Name: {draft.owner?.firstName ? `${draft.owner.firstName} ${draft.owner.lastName || ""}` : "—"}</div>
              <div className="small">Email: {draft.owner?.email || "—"}</div>
              <div className="small">Ownership: {draft.owner?.ownershipPct ?? "—"}%</div>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>Loan request</div>
              <div className="small">Amount: {draft.loan?.amountRequested ? formatCurrency(draft.loan.amountRequested) : "—"}</div>
              <div className="small">Term: {draft.loan?.termMonths ?? "—"} months</div>
              <div className="small">Purpose: {draft.loan?.purpose || "—"}</div>
            </div>
          </div>

          <div className="row" style={{ marginTop: 14 }}>
            <button className="btn" type="button" onClick={() => setCurrent(2)}>Back</button>
            <button className="btn btnPrimary" type="button" onClick={submit} disabled={!applicationId}>
              Submit application
            </button>
          </div>

          <div className="small" style={{ marginTop: 10 }}>
            By submitting, you authorize us to perform preliminary verification and risk assessment.
          </div>
        </Card>
      )}
    </div>
  );
}
