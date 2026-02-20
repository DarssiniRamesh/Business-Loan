import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Card, Toast } from "../../components/ui.jsx";
import { useAuth } from "../../state/auth.jsx";

export default function Login() {
  const nav = useNavigate();
  const loc = useLocation();
  const { login, mfaPending } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await login({ email, password, remember });
      if (res?.mfaRequired || mfaPending) {
        nav("/mfa", { replace: true });
        return;
      }
      const from = loc.state?.from || "/";
      nav(from, { replace: true });
    } catch (ex) {
      setErr(ex?.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 520 }}>
      <Card title="Sign in" subtitle="Access your application dashboard.">
        <form onSubmit={onSubmit}>
          <div className="field">
            <label>Email</label>
            <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          <div className="row" style={{ marginBottom: 12 }}>
            <label style={{ display: "flex", gap: 8, alignItems: "center", cursor: "pointer" }}>
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              Remember me
            </label>
          </div>

          <div className="row">
            <button className="btn btnPrimary" type="submit" disabled={busy}>
              {busy ? "Signing in…" : "Sign in"}
            </button>
            <div className="rowRight small">
              No account? <Link to="/register">Create one</Link>
            </div>
          </div>

          {err && <Toast kind="err">{err}</Toast>}
        </form>
      </Card>
    </div>
  );
}
