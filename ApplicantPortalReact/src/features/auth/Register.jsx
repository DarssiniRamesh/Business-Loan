import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, Toast } from "../../components/ui.jsx";
import { useAuth } from "../../state/auth.jsx";

export default function Register() {
  const nav = useNavigate();
  const { register } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [ok, setOk] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setOk(null);
    try {
      await register({ email, password, phone: phone || undefined });
      setOk("Registration successful. Please sign in to continue.");
      setTimeout(() => nav("/login"), 700);
    } catch (ex) {
      setErr(ex?.message || "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 520 }}>
      <Card title="Create account" subtitle="Register to start a business loan application.">
        <form onSubmit={onSubmit}>
          <div className="field">
            <label>Email</label>
            <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="field">
            <label>Password</label>
            <input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <div className="help">Use a strong password. MFA will be required at sign in.</div>
          </div>

          <div className="field">
            <label>Phone (optional)</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 555-5555" />
          </div>

          <div className="row">
            <button className="btn btnPrimary" type="submit" disabled={busy}>
              {busy ? "Creating…" : "Create account"}
            </button>
            <div className="rowRight small">
              Already registered? <Link to="/login">Sign in</Link>
            </div>
          </div>

          {err && <Toast kind="err">{err}</Toast>}
          {ok && <Toast kind="ok">{ok}</Toast>}
        </form>
      </Card>
    </div>
  );
}
