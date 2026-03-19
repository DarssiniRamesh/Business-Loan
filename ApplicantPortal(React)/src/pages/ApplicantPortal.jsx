import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { AnimatePresence, motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRightFromBracket,
  faBolt,
  faBuilding,
  faBriefcase,
  faCheckCircle,
  faCircleCheck,
  faCircleXmark,
  faClock,
  faChevronRight,
  faDownload,
  faFile,
  faFileArrowUp,
  faFileContract,
  faFolderOpen,
  faGaugeHigh,
  faListCheck,
  faPaperPlane,
  faPlus,
  faRotateRight,
  faShieldHalved,
  faSpinner,
  faTrash,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import { getAccessToken, getRefreshToken, clearTokens } from "../api/tokenStorage";
import { logout } from "../api/authApi";
import {
  createDraft,
  listDrafts,
  patchDraftSection,
  checkDraftReadiness,
  submitDraft,
  decideDraft,
  deleteDraft,
} from "../api/loanDraftApi";
import {
  uploadDocument,
  listDocuments,
  getDocumentDownloadUrl,
  deleteDocument,
} from "../api/documentsApi";

/* ─── Constants ─────────────────────────────────────────────── */
const DEFAULT_REQ_SECTIONS = ["businessInfo", "ownerInfo", "loanRequest"];
const DEFAULT_REQ_DOCS = ["BANK_STATEMENT", "TAX_RETURN"];

/* ─── Helpers ───────────────────────────────────────────────── */
function prettyJson(v) {
  try {
    return JSON.stringify(typeof v === "string" ? JSON.parse(v) : v, null, 2);
  } catch {
    return typeof v === "string" ? v : JSON.stringify(v, null, 2);
  }
}
function safeJsonStr(v) {
  if (typeof v === "string") {
    JSON.parse(v);
    return v;
  }
  return JSON.stringify(v);
}
function shortId(id) {
  return id ? id.slice(-6).toUpperCase() : "------";
}
function statusTheme(s) {
  const u = (s || "").toUpperCase();
  if (u === "SUBMITTED") return { bg: "#dbeafe", color: "#1d4ed8", dot: "#3b82f6" };
  if (u === "APPROVED") return { bg: "#dcfce7", color: "#15803d", dot: "#22c55e" };
  if (u === "DECLINED" || u === "REJECTED") return { bg: "#fee2e2", color: "#b91c1c", dot: "#ef4444" };
  if (u === "IN_PROGRESS") return { bg: "#fef3c7", color: "#b45309", dot: "#f59e0b" };
  return { bg: "#f1f5f9", color: "#475569", dot: "#94a3b8" };
}

/* ─── Global CSS ────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

:root {
  --white:   #ffffff;
  --bg:      #eef2f7;
  --bg2:     #e4eaf2;
  --border:  #d0d9e6;
  --blue:    #2563eb;
  --blue2:   #1d4ed8;
  --blue3:   #dbeafe;
  --blue4:   #eff6ff;
  --navy:    #0f172a;
  --slate:   #334155;
  --muted:   #64748b;
  --dim:     #94a3b8;
  --green:   #16a34a;
  --red:     #dc2626;
  --amber:   #d97706;
  --sh1: 0 1px 4px rgba(15,23,42,.07), 0 1px 2px rgba(15,23,42,.04);
  --sh2: 0 4px 20px rgba(15,23,42,.09);
  --shb: 0 6px 24px rgba(37,99,235,.22);
  --font: 'Inter', system-ui, sans-serif;
  --mono: 'JetBrains Mono', monospace;
  --r: 14px;
  --r2: 10px;
}

body { background:var(--bg); }

.ap {
  min-height:100vh;
  background:var(--bg);
  font-family:var(--font);
  color:var(--navy);
  font-size:14px;
  line-height:1.55;
  -webkit-font-smoothing:antialiased;
}

/* ── Header ── */
.ap-hdr {
  position:sticky; top:0; z-index:200;
  background:rgba(255,255,255,.96);
  backdrop-filter:blur(24px);
  border-bottom:1.5px solid var(--border);
}
.ap-hdr-in { max-width:1180px; margin:0 auto; padding:0 28px; }
.ap-hdr-row {
  display:flex; align-items:center; justify-content:space-between;
  height:64px;
}

.ap-brand { display:flex; align-items:center; gap:12px; }
.ap-brand-mark {
  width:40px; height:40px; border-radius:11px;
  background:linear-gradient(135deg,#2563eb,#1d4ed8);
  display:flex; align-items:center; justify-content:center;
  color:#fff; font-size:16px; box-shadow:var(--shb); flex-shrink:0;
}
.ap-brand-name {
  font-size:17px; font-weight:800; color:var(--navy); letter-spacing:-.025em; line-height:1.2;
}
.ap-brand-sub {
  font-size:11.5px; font-weight:500; color:var(--muted); letter-spacing:.03em;
}

.ap-nav {
  display:flex; gap:0;
  border-top:1.5px solid var(--border);
  overflow-x:auto;
}
.ap-nav::-webkit-scrollbar{display:none}
.ap-tab {
  display:flex; align-items:center; gap:8px;
  padding:0 20px; height:46px;
  border:none; background:none;
  font-family:var(--font); font-size:13.5px; font-weight:500;
  color:var(--muted); cursor:pointer; white-space:nowrap;
  position:relative; transition:color .15s;
}
.ap-tab .ti {
  width:28px; height:28px; border-radius:7px;
  display:flex; align-items:center; justify-content:center;
  font-size:12px; background:var(--bg2); flex-shrink:0;
  transition:all .15s;
}
.ap-tab:hover { color:var(--blue); }
.ap-tab:hover .ti { background:var(--blue3); color:var(--blue); }
.ap-tab.on { color:var(--blue); font-weight:700; }
.ap-tab.on .ti { background:var(--blue3); color:var(--blue); }
.ap-tab.on::after {
  content:''; position:absolute;
  bottom:0; left:0; right:0;
  height:2.5px; background:var(--blue);
  border-radius:2px 2px 0 0;
}

/* ── Layout ── */
.ap-body {
  max-width:1180px; margin:0 auto;
  padding:24px 28px;
  display:flex; gap:20px; align-items:flex-start;
}
.ap-aside { width:268px; flex-shrink:0; display:flex; flex-direction:column; gap:14px; }
.ap-main  { flex:1; min-width:0; display:flex; flex-direction:column; gap:16px; }

@media(max-width:820px){
  .ap-body{flex-direction:column}
  .ap-aside{width:100%}
}

/* ── Card ── */
.card {
  background:var(--white);
  border:1.5px solid var(--border);
  border-radius:var(--r);
  box-shadow:var(--sh1);
  overflow:hidden;
}
.card-hd {
  display:flex; align-items:center; justify-content:space-between;
  padding:18px 20px 0;
}
.card-title {
  display:flex; align-items:center; gap:10px;
  font-size:14.5px; font-weight:700; color:var(--navy); letter-spacing:-.015em;
}
.card-ico {
  width:32px; height:32px; border-radius:9px;
  background:var(--blue3); color:var(--blue);
  display:flex; align-items:center; justify-content:center; font-size:13px;
  flex-shrink:0;
}
.card-bd { padding:16px 20px 20px; }

/* ── Buttons ── */
.btn {
  display:inline-flex; align-items:center; justify-content:center; gap:7px;
  padding:0 18px; height:38px; border:none; border-radius:9px;
  font-family:var(--font); font-size:13.5px; font-weight:600;
  cursor:pointer; transition:all .15s; white-space:nowrap; flex-shrink:0;
}
.btn:disabled{opacity:.38;cursor:not-allowed;transform:none!important;box-shadow:none!important}

.btn-primary{background:var(--blue);color:#fff;box-shadow:var(--shb)}
.btn-primary:hover:not(:disabled){background:var(--blue2);transform:translateY(-1px);box-shadow:0 8px 24px rgba(37,99,235,.3)}

.btn-dark{background:var(--navy);color:#fff;box-shadow:var(--sh1)}
.btn-dark:hover:not(:disabled){background:#1e293b;transform:translateY(-1px)}

.btn-ghost{background:var(--white);border:1.5px solid var(--border);color:var(--slate);box-shadow:var(--sh1)}
.btn-ghost:hover:not(:disabled){border-color:var(--blue);color:var(--blue);background:var(--blue4)}

.btn-danger{background:#fff1f2;border:1.5px solid #fecdd3;color:var(--red)}
.btn-danger:hover:not(:disabled){background:#fee2e2;border-color:#fca5a5}

.btn-success{background:#f0fdf4;border:1.5px solid #bbf7d0;color:var(--green)}
.btn-success:hover:not(:disabled){background:#dcfce7}

.btn-sm{height:33px;padding:0 13px;font-size:12.5px;border-radius:8px}
.btn-xs{height:28px;padding:0 10px;font-size:12px;border-radius:7px}

/* ── Badge ── */
.badge {
  display:inline-flex; align-items:center; gap:5px;
  padding:3px 9px; border-radius:20px;
  font-size:11px; font-weight:700; letter-spacing:.04em; text-transform:uppercase;
}
.bdot { width:6px; height:6px; border-radius:50%; flex-shrink:0; }

/* ── Draft items ── */
.draft-item {
  display:block; width:100%; text-align:left;
  padding:14px 15px; border-radius:11px;
  border:1.5px solid var(--border); background:var(--white);
  cursor:pointer; transition:all .15s; font-family:var(--font);
  box-shadow:var(--sh1);
}
.draft-item:hover{border-color:#93c5fd;box-shadow:0 3px 14px rgba(37,99,235,.11)}
.draft-item.on{border-color:var(--blue);background:var(--blue4);box-shadow:0 3px 14px rgba(37,99,235,.16)}
.d-num{font-family:var(--mono);font-size:10px;color:var(--muted);letter-spacing:.07em;text-transform:uppercase;margin-bottom:3px}
.d-name{font-size:13.5px;font-weight:700;color:var(--navy);margin-bottom:8px}

/* ── Form ── */
.frow{display:flex;gap:12px;align-items:flex-start}
.fcol{display:flex;flex-direction:column;gap:5px;flex:1;min-width:0}
.lbl{font-size:11.5px;font-weight:700;letter-spacing:.055em;text-transform:uppercase;color:var(--slate)}
.inp,.sel,.txa {
  width:100%; padding:10px 14px; border-radius:9px;
  border:1.5px solid var(--border); background:var(--white);
  color:var(--navy); font-family:var(--font); font-size:13.5px;
  outline:none; transition:border .15s,box-shadow .15s; -webkit-appearance:none;
}
.txa{font-family:var(--mono);font-size:12.5px;resize:vertical;line-height:1.75;background:#fafbfc}
.inp:focus,.sel:focus,.txa:focus{
  border-color:var(--blue);
  box-shadow:0 0 0 3px rgba(37,99,235,.1);
}
.inp::placeholder{color:var(--dim)}
.sel option{background:#fff}

/* ── Stat tiles ── */
.stats{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.stat{padding:14px 16px;border-radius:10px;background:var(--bg);border:1.5px solid var(--border)}
.stat-lbl{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--muted);margin-bottom:6px;display:flex;align-items:center;gap:5px}
.stat-val{font-size:15px;font-weight:700;color:var(--navy)}

/* ── Error banner ── */
.err-box{display:flex;align-items:flex-start;gap:9px;padding:12px 14px;border-radius:9px;background:#fff1f2;border:1.5px solid #fecdd3;color:var(--red);font-size:13px;font-weight:500}

/* ── Doc row ── */
.doc-row{display:flex;align-items:center;gap:12px;padding:13px 15px;border-radius:10px;border:1.5px solid var(--border);background:var(--white);box-shadow:var(--sh1);transition:all .15s}
.doc-row:hover{border-color:#93c5fd;box-shadow:0 2px 12px rgba(37,99,235,.1)}
.doc-ico{width:38px;height:38px;border-radius:9px;background:var(--blue3);color:var(--blue);display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0}

/* ── File drop ── */
.file-drop{display:flex;align-items:center;gap:14px;padding:16px;border-radius:10px;border:2px dashed #93c5fd;background:var(--blue4);cursor:pointer;transition:all .15s;position:relative}
.file-drop:hover{border-color:var(--blue);background:var(--blue3)}
.file-drop input{position:absolute;inset:0;opacity:0;cursor:pointer}
.fd-ico{width:42px;height:42px;border-radius:10px;background:var(--blue3);border:1.5px solid #bfdbfe;display:flex;align-items:center;justify-content:center;color:var(--blue);font-size:17px;flex-shrink:0}

/* ── Empty state ── */
.ap-empty{text-align:center;padding:36px 20px}
.e-ico{width:52px;height:52px;border-radius:14px;background:var(--bg);border:1.5px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:20px;color:var(--dim);margin:0 auto 12px}
.e-title{font-size:14px;font-weight:700;color:var(--slate);margin-bottom:4px}
.e-sub{font-size:12.5px;color:var(--muted)}

/* ── Code note ── */
.cnote{font-family:var(--mono);font-size:11.5px;color:var(--muted);background:var(--bg);border-left:3px solid var(--blue);padding:7px 12px;border-radius:0 7px 7px 0;margin-bottom:16px}

/* ── Details ── */
.ap-det{border:1.5px solid var(--border);border-radius:10px;overflow:hidden;margin-top:14px}
.ap-det summary{padding:10px 14px;font-size:12.5px;font-weight:600;color:var(--muted);cursor:pointer;list-style:none;display:flex;align-items:center;gap:6px;background:var(--bg);user-select:none}
.ap-det summary::-webkit-details-marker{display:none}
.ap-det summary:hover{color:var(--navy)}
.ap-det pre{padding:14px;font-family:var(--mono);font-size:11.5px;color:var(--slate);overflow:auto;border-top:1.5px solid var(--border);line-height:1.8;background:#fafbfc;max-height:280px}

/* ── Readiness card ── */
.rdy-card{border:1.5px solid var(--border);border-radius:12px;overflow:hidden;margin-top:16px;box-shadow:var(--sh1)}
.rdy-hd{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;background:var(--bg);border-bottom:1.5px solid var(--border)}
.rdy-bd{padding:16px 18px;background:var(--white)}
.miss{display:flex;align-items:center;gap:8px;padding:8px 11px;border-radius:8px;background:#fffbeb;border:1.5px solid #fde68a;font-size:12.5px;font-weight:600;color:#92400e;font-family:var(--mono)}

/* ── Divider ── */
.divider{height:1.5px;background:var(--border);margin:14px 0}

/* ── Helpers ── */
.stack>*+*{margin-top:14px}
.stack-sm>*+*{margin-top:10px}
.row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.row2{display:flex;align-items:center;gap:7px}
.grow{flex:1;min-width:0}
.mt10{margin-top:10px}
.mt14{margin-top:14px}
.mt16{margin-top:16px}
.muted{color:var(--muted)}
.mono{font-family:var(--mono)}

/* ── Spinner ── */
@keyframes spin{to{transform:rotate(360deg)}}
.spin{animation:spin .7s linear infinite}

/* ── Toast ── */
.toast-wrap{position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:9px;pointer-events:none}
.toast{display:flex;align-items:flex-start;gap:10px;padding:13px 16px;border-radius:11px;background:var(--white);border:1.5px solid var(--border);box-shadow:0 10px 36px rgba(15,23,42,.15);pointer-events:all;min-width:280px;max-width:360px;font-size:13px;font-weight:500;color:var(--slate)}
.toast.error{border-color:#fecdd3;background:#fff1f2;color:var(--red)}
.toast.success{border-color:#bbf7d0;background:#f0fdf4;color:var(--green)}
`;

/* ─── Toast Component ───────────────────────────────────────── */
function Toasts({ items }) {
  return (
    <div className="toast-wrap">
      <AnimatePresence>
        {items.map((t) => (
          <motion.div
            key={t.id}
            className={`toast ${t.type}`}
            initial={{ opacity: 0, x: 80, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          >
            <FontAwesomeIcon
              icon={t.type === "error" ? faTriangleExclamation : faCircleCheck}
              style={{ marginTop: 1, flexShrink: 0, fontSize: 14 }}
            />
            <span>{t.msg}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

Toasts.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      msg: PropTypes.string.isRequired,
      type: PropTypes.oneOf(["info", "success", "error"]).isRequired,
    })
  ).isRequired,
};

/* ─── Main Portal ───────────────────────────────────────────── */
export default function ApplicantPortal() {
  const navigate = useNavigate();

  const [tab, setTab] = useState("drafts");
  const [busy, setBusy] = useState(false);
  const [toasts, setToasts] = useState([]);

  const [drafts, setDrafts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [readiness, setReadiness] = useState(null);

  const [sectionKey, setSectionKey] = useState("businessInfo");
  const [sectionData, setSectionData] = useState('{\n  "companyName": "",\n  "industry": ""\n}');
  const [sectionStatus, setSectionStatus] = useState("IN_PROGRESS");

  const [uploadFile, setUploadFile] = useState(null);
  const [uploadDocType, setUploadDocType] = useState("BANK_STATEMENT");

  const [reqSections, setReqSections] = useState(DEFAULT_REQ_SECTIONS.join(", "));
  const [reqDocTypes, setReqDocTypes] = useState(DEFAULT_REQ_DOCS.join(", "));

  const selectedDraft = useMemo(() => drafts.find((d) => d.id === selectedId) || null, [drafts, selectedId]);

  const tidRef = useRef(0);
  function addToast(msg, type = "info") {
    const id = ++tidRef.current;
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4500);
  }

  async function run(fn, okMsg) {
    setBusy(true);
    try {
      const r = await fn();
      if (okMsg) addToast(okMsg, "success");
      return r;
    } catch (e) {
      const st = e?.response?.status;
      // 401 is already handled by axiosConfig interceptor (clears tokens + redirects to /login).
      // We silently bail here to avoid a double-redirect race condition.
      if (st === 401) return;
      const msg =
        st === 409 ? "Version conflict — draft was modified. Reloading…"
          : st === 403 ? "You don't have permission to do that."
            : st === 404 ? "Resource not found."
              : st >= 500 ? "Server error — please try again in a moment."
                : e?.response?.data?.message || e?.message || "Something went wrong.";
      addToast(msg, "error");
      if (st === 409) await fetchDrafts();
    } finally {
      setBusy(false);
    }
  }

  async function fetchDrafts() {
    const list = await listDrafts();
    setDrafts(list || []);
    return list || [];
  }

  async function fetchDocs(id) {
    if (!id) {
      setDocuments([]);
      return;
    }
    try {
      const list = await listDocuments({ loanDraftId: id });
      setDocuments(list || []);
    } catch {
      setDocuments([]);
    }
  }

  // Auth guard:
  // - If neither access nor refresh token exists, redirect to login.
  // - If only refresh token exists (access token missing/expired), allow the page to load:
  //   the axios interceptor will refresh on the first 401 and retry the request.
  useEffect(() => {
    if (!getAccessToken() && !getRefreshToken()) {
      navigate("/login", { replace: true });
      return;
    }
    run(async () => {
      const list = await fetchDrafts();
      if (list.length > 0) setSelectedId(list[0].id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchDocs(selectedId);
    setReadiness(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  /* ── Actions ── */
  const doCreateDraft = () =>
    run(async () => {
      const d = await createDraft({
        data: { businessInfo: {}, ownerInfo: {}, loanRequest: {} },
        sectionStatus: { businessInfo: "IN_PROGRESS" },
        currentStep: "businessInfo",
      });
      await fetchDrafts();
      if (d?.id) setSelectedId(d.id);
    }, "New draft created");

  const doPatchSection = () => {
    if (!selectedId) {
      addToast("Select a draft first", "error");
      return;
    }
    let payload;
    try {
      payload = safeJsonStr(sectionData);
    } catch {
      addToast("Invalid JSON — fix the payload and retry", "error");
      return;
    }
    run(async () => {
      const updated = await patchDraftSection({
        draftId: selectedId,
        sectionKey,
        sectionData: payload,
        sectionStatus: { [sectionKey]: sectionStatus },
        currentStep: sectionKey,
        expectedVersion: selectedDraft?.version,
      });
      setDrafts((p) => p.map((d) => (d.id === updated.id ? updated : d)));
    }, "Section saved successfully");
  };

  const doUpload = () => {
    if (!uploadFile) {
      addToast("Choose a file first", "error");
      return;
    }
    if (!selectedId) {
      addToast("Select a draft first", "error");
      return;
    }
    run(async () => {
      await uploadDocument({
        file: uploadFile,
        loanDraftId: selectedId,
        metadata: { docType: uploadDocType },
      });
      setUploadFile(null);
      await fetchDocs(selectedId);
    }, "Document uploaded");
  };

  const doCheckReadiness = () => {
    if (!selectedId) {
      addToast("Select a draft first", "error");
      return;
    }
    run(async () => {
      const rs = reqSections.split(",").map((s) => s.trim()).filter(Boolean);
      const rd = reqDocTypes.split(",").map((s) => s.trim()).filter(Boolean);
      const r = await checkDraftReadiness({
        draftId: selectedId,
        requiredSections: rs,
        requiredDocumentTypes: rd,
        runDecisioning: false,
      });
      setReadiness(r);
      setTab("submit");
    });
  };

  const doSubmit = () => {
    if (!selectedId) return;
    run(async () => {
      const rs = reqSections.split(",").map((s) => s.trim()).filter(Boolean);
      const rd = reqDocTypes.split(",").map((s) => s.trim()).filter(Boolean);
      const updated = await submitDraft({
        draftId: selectedId,
        requiredSections: rs,
        requiredDocumentTypes: rd,
        runDecisioning: true,
      });
      setDrafts((p) => p.map((d) => (d.id === updated.id ? updated : d)));
      setReadiness({ ready: true, missingSections: [], missingDocumentTypes: [] });
    }, "Application submitted!");
  };

  const doDecide = () => {
    if (!selectedId) return;
    run(async () => {
      const updated = await decideDraft({ draftId: selectedId });
      setDrafts((p) => p.map((d) => (d.id === updated.id ? updated : d)));
    }, "Decisioning complete");
  };

  const doDeleteDraft = () => {
    if (!selectedId) return;
    run(async () => {
      await deleteDraft({ draftId: selectedId });
      const list = await fetchDrafts();
      setSelectedId(list[0]?.id || null);
      setDocuments([]);
      setReadiness(null);
    }, "Draft deleted");
  };

  const doDeleteDoc = (docId) =>
    run(async () => {
      await deleteDocument({ documentId: docId });
      await fetchDocs(selectedId);
    }, "Document removed");

  const doLogout = async () => {
    setBusy(true);
    try {
      const rt = getRefreshToken();
      if (rt) {
        try {
          await logout({ refreshToken: rt });
        } catch {}
      }
      clearTokens();
      navigate("/login", { replace: true });
    } finally {
      setBusy(false);
    }
  };

  const TABS = [
    { key: "drafts", label: "Applications", icon: faBriefcase },
    { key: "documents", label: "Documents", icon: faFileContract },
    { key: "submit", label: "Submit", icon: faPaperPlane },
  ];

  /* ── Render ── */
  return (
    <>
      <style>{CSS}</style>
      <div className="ap">
        {/* Header */}
        <header className="ap-hdr">
          <div className="ap-hdr-in">
            <div className="ap-hdr-row">
              <div className="ap-brand">
                <div className="ap-brand-mark">
                  <FontAwesomeIcon icon={faBuilding} />
                </div>
                <div>
                  <div className="ap-brand-name">LoanPortal</div>
                  <div className="ap-brand-sub">Business Finance Platform</div>
                </div>
              </div>

              <div className="row2">
                <AnimatePresence>
                  {busy && (
                    <motion.span
                      key="busy"
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      className="row2 muted"
                      style={{ fontSize: 12.5 }}
                    >
                      <FontAwesomeIcon icon={faSpinner} className="spin" />
                      Processing…
                    </motion.span>
                  )}
                </AnimatePresence>
                <button className="btn btn-ghost btn-sm" onClick={doLogout} disabled={busy}>
                  <FontAwesomeIcon icon={faArrowRightFromBracket} />
                  Sign out
                </button>
              </div>
            </div>

            <nav className="ap-nav">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  className={`ap-tab ${tab === t.key ? "on" : ""}`}
                  onClick={() => setTab(t.key)}
                >
                  <span className="ti">
                    <FontAwesomeIcon icon={t.icon} />
                  </span>
                  {t.label}
                </button>
              ))}
            </nav>
          </div>
        </header>

        {/* Body */}
        <div className="ap-body">
          {/* Sidebar */}
          <aside className="ap-aside">
            <div className="card">
              <div className="card-hd">
                <div className="card-title">
                  <span className="card-ico">
                    <FontAwesomeIcon icon={faFolderOpen} />
                  </span>
                  My Drafts
                </div>
                <motion.button
                  className="btn btn-primary btn-sm"
                  onClick={doCreateDraft}
                  disabled={busy}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FontAwesomeIcon icon={faPlus} /> New
                </motion.button>
              </div>

              <div className="card-bd">
                {drafts.length === 0 ? (
                  <div className="ap-empty">
                    <div className="e-ico">
                      <FontAwesomeIcon icon={faBriefcase} />
                    </div>
                    <div className="e-title">No applications yet</div>
                    <div className="e-sub">Create your first draft to begin</div>
                    <motion.button
                      className="btn btn-primary btn-sm"
                      style={{ marginTop: 14 }}
                      onClick={doCreateDraft}
                      disabled={busy}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                    >
                      <FontAwesomeIcon icon={faPlus} /> Create draft
                    </motion.button>
                  </div>
                ) : (
                  <div className="stack-sm">
                    {drafts.map((d, i) => {
                      const th = statusTheme(d.status);
                      return (
                        <motion.button
                          key={d.id}
                          className={`draft-item ${selectedId === d.id ? "on" : ""}`}
                          onClick={() => setSelectedId(d.id)}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05, duration: 0.2 }}
                          whileHover={{ x: 3 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <div className="d-num">
                            #{shortId(d.id)} · v{d.version ?? 0}
                          </div>
                          <div className="d-name">Draft application</div>
                          <div className="row2">
                            <span className="badge" style={{ background: th.bg, color: th.color }}>
                              <span className="bdot" style={{ background: th.dot }} />
                              {d.status || "DRAFT"}
                            </span>
                          </div>
                          {d.decision && (
                            <div
                              style={{
                                marginTop: 5,
                                fontSize: 11.5,
                                fontWeight: 700,
                                color: "var(--blue)",
                                fontFamily: "var(--mono)",
                              }}
                            >
                              ⟶ {d.decision}
                            </div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                )}

                {selectedId && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                    <div className="divider" />
                    <div
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        letterSpacing: ".07em",
                        textTransform: "uppercase",
                        color: "var(--muted)",
                        marginBottom: 10,
                      }}
                    >
                      Quick actions
                    </div>
                    <div className="row" style={{ gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" disabled={busy} onClick={doCheckReadiness} title="Check readiness">
                        <FontAwesomeIcon icon={faShieldHalved} /> Check
                      </button>
                      <button className="btn btn-success btn-sm" disabled={busy} onClick={doDecide} title="Run decisioning">
                        <FontAwesomeIcon icon={faBolt} /> Decide
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        disabled={busy}
                        onClick={doDeleteDraft}
                        style={{ width: 33, padding: 0 }}
                        title="Delete draft"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            <button
              className="btn btn-ghost btn-sm"
              style={{ width: "100%", justifyContent: "center" }}
              disabled={busy}
              onClick={() =>
                run(async () => {
                  const list = await fetchDrafts();
                  if (selectedId && !list.find((d) => d.id === selectedId)) {
                    setSelectedId(list[0]?.id || null);
                  }
                }, "Refreshed")
              }
            >
              <FontAwesomeIcon icon={faRotateRight} /> Refresh list
            </button>
          </aside>

          {/* Content */}
          <main className="ap-main">
            <AnimatePresence mode="wait" initial={false}>
              {tab === "drafts" && (
                <motion.div
                  key="drafts"
                  className="stack"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                >
                  <DraftsPanel
                    draft={selectedDraft}
                    sectionKey={sectionKey}
                    setSectionKey={setSectionKey}
                    sectionData={sectionData}
                    setSectionData={setSectionData}
                    sectionStatus={sectionStatus}
                    setSectionStatus={setSectionStatus}
                    onSave={doPatchSection}
                    busy={busy}
                  />
                </motion.div>
              )}

              {tab === "documents" && (
                <motion.div
                  key="documents"
                  className="stack"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                >
                  <DocumentsPanel
                    selectedId={selectedId}
                    documents={documents}
                    uploadFile={uploadFile}
                    setUploadFile={setUploadFile}
                    uploadDocType={uploadDocType}
                    setUploadDocType={setUploadDocType}
                    onUpload={doUpload}
                    onDelete={doDeleteDoc}
                    busy={busy}
                  />
                </motion.div>
              )}

              {tab === "submit" && (
                <motion.div
                  key="submit"
                  className="stack"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                >
                  <SubmitPanel
                    draft={selectedDraft}
                    reqSections={reqSections}
                    setReqSections={setReqSections}
                    reqDocTypes={reqDocTypes}
                    setReqDocTypes={setReqDocTypes}
                    readiness={readiness}
                    onCheck={doCheckReadiness}
                    onSubmit={doSubmit}
                    busy={busy}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>

      <Toasts items={toasts} />
    </>
  );
}

/* ─── Drafts Panel ──────────────────────────────────────────── */
function DraftsPanel({
  draft,
  sectionKey,
  setSectionKey,
  sectionData,
  setSectionData,
  sectionStatus,
  setSectionStatus,
  onSave,
  busy,
}) {
  const th = statusTheme(draft?.status);

  const sectionKeyInputId = useId();
  const sectionStatusSelectId = useId();
  const sectionPayloadTextareaId = useId();

  return (
    <>
      {/* Overview card */}
      <div className="card">
        <div className="card-hd">
          <div className="card-title">
            <span className="card-ico">
              <FontAwesomeIcon icon={faGaugeHigh} />
            </span>
            Application Overview
          </div>
        </div>
        <div className="card-bd">
          {!draft ? (
            <div className="ap-empty">
              <div className="e-ico">
                <FontAwesomeIcon icon={faBriefcase} />
              </div>
              <div className="e-title">No draft selected</div>
              <div className="e-sub">Select or create a draft from the sidebar to view details</div>
            </div>
          ) : (
            <motion.div key={draft.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              <div className="stats">
                <div className="stat">
                  <div className="stat-lbl">
                    <FontAwesomeIcon icon={faClock} /> Status
                  </div>
                  <div className="stat-val">
                    <span className="badge" style={{ background: th.bg, color: th.color, fontSize: 12 }}>
                      <span className="bdot" style={{ background: th.dot }} />
                      {draft.status || "DRAFT"}
                    </span>
                  </div>
                </div>
                <div className="stat">
                  <div className="stat-lbl">
                    <FontAwesomeIcon icon={faListCheck} /> Current step
                  </div>
                  <div className="stat-val" style={{ fontSize: 13, fontFamily: "var(--mono)", fontWeight: 600 }}>
                    {draft.currentStep || "—"}
                  </div>
                </div>
                <div className="stat">
                  <div className="stat-lbl">
                    <FontAwesomeIcon icon={faShieldHalved} /> Risk score
                  </div>
                  <div className="stat-val">{draft.riskScore ?? "—"}</div>
                </div>
                <div className="stat">
                  <div className="stat-lbl">
                    <FontAwesomeIcon icon={faBolt} /> Decision
                  </div>
                  <div className="stat-val" style={{ fontSize: 13.5, color: draft.decision ? "var(--blue)" : "var(--muted)" }}>
                    {draft.decision ?? "Pending"}
                  </div>
                </div>
              </div>

              {draft.decisionReason && (
                <div className="stat" style={{ marginTop: 10 }}>
                  <div className="stat-lbl">
                    <FontAwesomeIcon icon={faFileContract} /> Decision reason
                  </div>
                  <div style={{ marginTop: 5, fontSize: 13.5, color: "var(--slate)", lineHeight: 1.65 }}>{draft.decisionReason}</div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Section editor */}
      <div className="card">
        <div className="card-hd">
          <div className="card-title">
            <span className="card-ico">
              <FontAwesomeIcon icon={faFileArrowUp} />
            </span>
            Edit Section Data
          </div>
          <motion.button
            className="btn btn-primary btn-sm"
            onClick={onSave}
            disabled={busy || !draft}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
          >
            {busy ? <FontAwesomeIcon icon={faSpinner} className="spin" /> : <FontAwesomeIcon icon={faFileArrowUp} />}
            Save section
          </motion.button>
        </div>
        <div className="card-bd">
          <div className="cnote">PATCH /api/loan/drafts/:id/sections</div>

          <div className="frow" style={{ marginBottom: 12 }}>
            <div className="fcol">
              <label className="lbl" htmlFor={sectionKeyInputId}>
                Section key
              </label>
              <input
                id={sectionKeyInputId}
                className="inp"
                value={sectionKey}
                onChange={(e) => setSectionKey(e.target.value)}
                placeholder="e.g. businessInfo"
              />
            </div>
            <div className="fcol">
              <label className="lbl" htmlFor={sectionStatusSelectId}>
                Section status
              </label>
              <select
                id={sectionStatusSelectId}
                className="sel"
                value={sectionStatus}
                onChange={(e) => setSectionStatus(e.target.value)}
              >
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="COMPLETED">COMPLETED</option>
              </select>
            </div>
          </div>

          <div className="fcol">
            <label className="lbl" htmlFor={sectionPayloadTextareaId}>
              JSON payload
            </label>
            <textarea
              id={sectionPayloadTextareaId}
              className="txa"
              value={sectionData}
              onChange={(e) => setSectionData(e.target.value)}
              rows={9}
              spellCheck={false}
            />
          </div>

          {draft?.data && (
            <details className="ap-det">
              <summary>
                <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: 10 }} />
                View current draft.data (read-only)
              </summary>
              <pre>{prettyJson(draft.data)}</pre>
            </details>
          )}
        </div>
      </div>
    </>
  );
}

DraftsPanel.propTypes = {
  draft: PropTypes.object,
  sectionKey: PropTypes.string.isRequired,
  setSectionKey: PropTypes.func.isRequired,
  sectionData: PropTypes.string.isRequired,
  setSectionData: PropTypes.func.isRequired,
  sectionStatus: PropTypes.string.isRequired,
  setSectionStatus: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  busy: PropTypes.bool.isRequired,
};

/* ─── Documents Panel ───────────────────────────────────────── */
function DocumentsPanel({
  selectedId,
  documents,
  uploadFile,
  setUploadFile,
  uploadDocType,
  setUploadDocType,
  onUpload,
  onDelete,
  busy,
}) {
  const documentTypeSelectId = useId();

  return (
    <>
      {/* Upload card */}
      <div className="card">
        <div className="card-hd">
          <div className="card-title">
            <span className="card-ico">
              <FontAwesomeIcon icon={faFileArrowUp} />
            </span>
            Upload Document
          </div>
          <motion.button
            className="btn btn-primary btn-sm"
            onClick={onUpload}
            disabled={busy || !selectedId}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
          >
            {busy ? <FontAwesomeIcon icon={faSpinner} className="spin" /> : <FontAwesomeIcon icon={faFileArrowUp} />}
            Upload
          </motion.button>
        </div>
        <div className="card-bd">
          <div className="cnote">POST /api/documents — linked to selected draft</div>

          <div className="frow" style={{ alignItems: "flex-start" }}>
            <div className="fcol" style={{ flex: 2 }}>
              <label className="lbl">File (PDF · PNG · JPG)</label>
              <label className="file-drop">
                <div className="fd-ico">
                  <FontAwesomeIcon icon={faFile} />
                </div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--blue)" }}>
                    {uploadFile ? uploadFile.name : "Click to choose a file"}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>
                    Linked to draft: {selectedId ? `#${shortId(selectedId)}` : "none selected"}
                  </div>
                </div>
                <input
                  type="file"
                  accept=".pdf,image/png,image/jpeg"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>
            <div className="fcol">
              <label className="lbl" htmlFor={documentTypeSelectId}>
                Document type
              </label>
              <select
                id={documentTypeSelectId}
                className="sel"
                value={uploadDocType}
                onChange={(e) => setUploadDocType(e.target.value)}
              >
                <option value="BANK_STATEMENT">BANK_STATEMENT</option>
                <option value="TAX_RETURN">TAX_RETURN</option>
                <option value="OTHER">OTHER</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Document list */}
      <div className="card">
        <div className="card-hd">
          <div className="card-title">
            <span className="card-ico">
              <FontAwesomeIcon icon={faFolderOpen} />
            </span>
            Uploaded Files
          </div>
          <span className="badge" style={{ background: "var(--blue3)", color: "var(--blue)", fontSize: 12 }}>
            {documents.length} {documents.length === 1 ? "file" : "files"}
          </span>
        </div>
        <div className="card-bd">
          {documents.length === 0 ? (
            <div className="ap-empty">
              <div className="e-ico">
                <FontAwesomeIcon icon={faFileContract} />
              </div>
              <div className="e-title">No documents yet</div>
              <div className="e-sub">Upload files above to attach them to this draft</div>
            </div>
          ) : (
            <div className="stack-sm">
              <AnimatePresence initial={false}>
                {documents.map((d, i) => (
                  <motion.div
                    key={d.id}
                    className="doc-row"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ delay: i * 0.05 }}
                    layout
                  >
                    <div className="doc-ico">
                      <FontAwesomeIcon icon={faFile} />
                    </div>
                    <div className="grow" style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13.5,
                          fontWeight: 600,
                          color: "var(--navy)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {d.originalFilename}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--muted)", fontFamily: "var(--mono)", marginTop: 2 }}>
                        {d.contentType} · {(d.sizeBytes / 1024).toFixed(1)} KB
                      </div>
                    </div>
                    <div className="row2">
                      <a
                        href={getDocumentDownloadUrl(d.id)}
                        className="btn btn-ghost btn-xs"
                        target="_blank"
                        rel="noreferrer"
                        title="Download"
                      >
                        <FontAwesomeIcon icon={faDownload} />
                      </a>
                      <button
                        className="btn btn-danger btn-xs"
                        onClick={() => onDelete(d.id)}
                        disabled={busy}
                        title="Delete"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

DocumentsPanel.propTypes = {
  selectedId: PropTypes.string,
  documents: PropTypes.arrayOf(PropTypes.object).isRequired,
  uploadFile: PropTypes.any,
  setUploadFile: PropTypes.func.isRequired,
  uploadDocType: PropTypes.string.isRequired,
  setUploadDocType: PropTypes.func.isRequired,
  onUpload: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  busy: PropTypes.bool.isRequired,
};

/* ─── Submit Panel ──────────────────────────────────────────── */
function SubmitPanel({ draft, reqSections, setReqSections, reqDocTypes, setReqDocTypes, readiness, onCheck, onSubmit, busy }) {
  const ready = readiness?.ready === true;

  const requiredSectionsInputId = useId();
  const requiredDocTypesInputId = useId();

  return (
    <div className="card">
      <div className="card-hd">
        <div className="card-title">
          <span className="card-ico">
            <FontAwesomeIcon icon={faPaperPlane} />
          </span>
          Review &amp; Submit
        </div>
      </div>
      <div className="card-bd">
        <div className="cnote">All required sections must be COMPLETED · Required document types must be present</div>

        {!draft ? (
          <div className="ap-empty">
            <div className="e-ico">
              <FontAwesomeIcon icon={faListCheck} />
            </div>
            <div className="e-title">No draft selected</div>
            <div className="e-sub">Select an application from the sidebar first</div>
          </div>
        ) : (
          <>
            <div className="frow">
              <div className="fcol">
                <label className="lbl" htmlFor={requiredSectionsInputId}>
                  Required sections
                </label>
                <input
                  id={requiredSectionsInputId}
                  className="inp"
                  value={reqSections}
                  onChange={(e) => setReqSections(e.target.value)}
                  placeholder="businessInfo, ownerInfo, loanRequest"
                />
              </div>
              <div className="fcol">
                <label className="lbl" htmlFor={requiredDocTypesInputId}>
                  Required document types
                </label>
                <input
                  id={requiredDocTypesInputId}
                  className="inp"
                  value={reqDocTypes}
                  onChange={(e) => setReqDocTypes(e.target.value)}
                  placeholder="BANK_STATEMENT, TAX_RETURN"
                />
              </div>
            </div>

            <div className="row mt14">
              <motion.button className="btn btn-dark" onClick={onCheck} disabled={busy} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                {busy ? <FontAwesomeIcon icon={faSpinner} className="spin" /> : <FontAwesomeIcon icon={faShieldHalved} />}
                Check readiness
              </motion.button>

              <motion.button className="btn btn-primary" onClick={onSubmit} disabled={busy || !ready} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                {busy ? <FontAwesomeIcon icon={faSpinner} className="spin" /> : <FontAwesomeIcon icon={faPaperPlane} />}
                Submit application
              </motion.button>
            </div>

            <AnimatePresence>
              {readiness && (
                <motion.div
                  className="rdy-card"
                  initial={{ opacity: 0, y: 14, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ type: "spring", stiffness: 340, damping: 30 }}
                >
                  <div className="rdy-hd">
                    <div className="row2">
                      <FontAwesomeIcon icon={ready ? faCircleCheck : faCircleXmark} style={{ fontSize: 18, color: ready ? "var(--green)" : "var(--amber)" }} />
                      <span style={{ fontSize: 14, fontWeight: 700 }}>Readiness check</span>
                    </div>
                    <span
                      className="badge"
                      style={
                        ready
                          ? { background: "#dcfce7", color: "var(--green)" }
                          : { background: "#fef3c7", color: "var(--amber)" }
                      }
                    >
                      <span className="bdot" style={{ background: ready ? "var(--green)" : "var(--amber)" }} />
                      {ready ? "READY" : "NOT READY"}
                    </span>
                  </div>

                  <div className="rdy-bd">
                    {ready ? (
                      <div className="row2" style={{ color: "var(--green)", fontWeight: 600, fontSize: 14 }}>
                        <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: 17 }} />
                        Application is complete — you can now submit.
                      </div>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        <div>
                          <div
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              letterSpacing: ".07em",
                              textTransform: "uppercase",
                              color: "var(--muted)",
                              marginBottom: 10,
                              display: "flex",
                              alignItems: "center",
                              gap: 5,
                            }}
                          >
                            <FontAwesomeIcon icon={faListCheck} /> Missing sections
                          </div>
                          <div className="stack-sm">
                            {(readiness.missingSections || []).length === 0 ? (
                              <div className="row2" style={{ fontSize: 13, color: "var(--green)", fontWeight: 600 }}>
                                <FontAwesomeIcon icon={faCircleCheck} /> All sections complete
                              </div>
                            ) : (
                              (readiness.missingSections || []).map((s) => (
                                <div key={s} className="miss">
                                  <FontAwesomeIcon icon={faTriangleExclamation} /> {s}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              letterSpacing: ".07em",
                              textTransform: "uppercase",
                              color: "var(--muted)",
                              marginBottom: 10,
                              display: "flex",
                              alignItems: "center",
                              gap: 5,
                            }}
                          >
                            <FontAwesomeIcon icon={faFileContract} /> Missing documents
                          </div>
                          <div className="stack-sm">
                            {(readiness.missingDocumentTypes || []).length === 0 ? (
                              <div className="row2" style={{ fontSize: 13, color: "var(--green)", fontWeight: 600 }}>
                                <FontAwesomeIcon icon={faCircleCheck} /> All documents present
                              </div>
                            ) : (
                              (readiness.missingDocumentTypes || []).map((s) => (
                                <div key={s} className="miss">
                                  <FontAwesomeIcon icon={faTriangleExclamation} /> {s}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}

SubmitPanel.propTypes = {
  draft: PropTypes.object,
  reqSections: PropTypes.string.isRequired,
  setReqSections: PropTypes.func.isRequired,
  reqDocTypes: PropTypes.string.isRequired,
  setReqDocTypes: PropTypes.func.isRequired,
  readiness: PropTypes.object,
  onCheck: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  busy: PropTypes.bool.isRequired,
};
