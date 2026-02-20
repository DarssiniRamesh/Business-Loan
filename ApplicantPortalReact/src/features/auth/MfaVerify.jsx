import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Toast } from "../../components/ui.jsx";
import { useAuth } from "../../state/auth.jsx";

export default function MfaVerify() {
  const nav = useNavigate();
  const { mfaPending, mfaContext, verifyMfa } = useAuth();

  const [code, setCode] = useState("");
  const [remember, setRemember] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await verifyMfa({ code, remember });
      nav("/", { replace: true });
    } catch (ex) {
      setErr(ex?.message || "MFA verification failed");
    } finally {
      setBusy(false);
    }
  }

  if (!mfaPending) {
    return (
      <div className="container" style={{ maxWidth: 520 }}>
        <Card title="MFA not required">
          <div className="small">No pending MFA verification. Please sign in again.</div>
          <div style={{ marginTop: 12 }}>
            <button className="btn btnPrimary" onClick={() => nav("/login")}>Go to login</button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: 520 }}>
      <Card title="Verify MFA" subtitle={`Enter the one-time code for ${mfaContext?.email || "your account"}.`}>
        <form onSubmit={onSubmit}>
          <div className="field">
            <label>One-time code</label>
            <input inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" required />
          </div>

          <div className="row" style={{ marginBottom: 12 }}>
            <label style={{ display: "flex", gap: 8, alignItems: "center", cursor: "pointer" }}>
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              Remember this session
            </label>
          </div>

          <div className="row">
            <button className="btn btnPrimary" type="submit" disabled={busy}>
              {busy ? "Verifying…" : "Verify"}
            </button>
          </div>

          {err && <Toast kind="err">{err}</Toast>}
        </form>
      </Card>
    </div>
  );
}
