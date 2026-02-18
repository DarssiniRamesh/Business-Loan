import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRightFromBracket,
  faBolt,
  faCheckCircle,
  faClock,
  faFileArrowUp,
  faFolderOpen,
  faGaugeHigh,
  faListCheck,
  faPlus,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import { getRefreshToken, clearTokens } from "../api/tokenStorage";
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
import { uploadDocument, listDocuments, getDocumentDownloadUrl, deleteDocument } from "../api/documentsApi";

const DEFAULT_REQUIRED_SECTIONS = ["businessInfo", "ownerInfo", "loanRequest"];
const DEFAULT_REQUIRED_DOC_TYPES = ["BANK_STATEMENT", "TAX_RETURN"];

function prettyJson(value) {
  try {
    const obj = typeof value === "string" ? JSON.parse(value) : value;
    return JSON.stringify(obj, null, 2);
  } catch {
    return typeof value === "string" ? value : JSON.stringify(value, null, 2);
  }
}

function safeJsonString(value) {
  if (typeof value === "string") {
    JSON.parse(value); // validate
    return value;
  }
  return JSON.stringify(value);
}

/**
 * PUBLIC_INTERFACE
 * Applicant Portal page (post-auth): manage drafts, upload documents, submit, and view decisioning.
 */
export default function ApplicantPortal() {
  const navigate = useNavigate();

  const [tab, setTab] = useState("drafts"); // drafts | documents | submit
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [drafts, setDrafts] = useState([]);
  const [selectedDraftId, setSelectedDraftId] = useState(null);
  const selectedDraft = useMemo(
    () => drafts.find((d) => d.id === selectedDraftId) || null,
    [drafts, selectedDraftId]
  );

  const [documents, setDocuments] = useState([]);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadDocType, setUploadDocType] = useState("BANK_STATEMENT");

  const [sectionKey, setSectionKey] = useState("businessInfo");
  const [sectionData, setSectionData] = useState("{\n  \"example\": true\n}");
  const [sectionStatusValue, setSectionStatusValue] = useState("IN_PROGRESS");

  const [requiredSections, setRequiredSections] = useState(DEFAULT_REQUIRED_SECTIONS.join(", "));
  const [requiredDocTypes, setRequiredDocTypes] = useState(DEFAULT_REQUIRED_DOC_TYPES.join(", "));
  const [readiness, setReadiness] = useState(null);

  async function reloadDrafts(selectIdIfMissing = true) {
    const list = await listDrafts();
    setDrafts(list || []);
    if (selectIdIfMissing) {
      const id = selectedDraftId;
      if (id && (list || []).some((d) => d.id === id)) return;
      if ((list || []).length > 0) setSelectedDraftId(list[0].id);
    }
  }

  async function reloadDocuments() {
    const list = await listDocuments({ loanDraftId: selectedDraftId || undefined });
    setDocuments(list || []);
  }

  useEffect(() => {
    // Load initial state
    (async () => {
      setBusy(true);
      setError("");
      try {
        await reloadDrafts(true);
      } catch (e) {
        setError(e?.response?.data?.message || e?.message || "Failed to load drafts.");
      } finally {
        setBusy(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedDraftId) return;
    (async () => {
      try {
        await reloadDocuments();
      } catch {
        // non-fatal
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDraftId]);

  const onCreateDraft = async () => {
    setBusy(true);
    setError("");
    try {
      const d = await createDraft({
        data: { businessInfo: {}, ownerInfo: {}, loanRequest: {} },
        sectionStatus: { businessInfo: "IN_PROGRESS" },
        currentStep: "businessInfo",
      });
      await reloadDrafts(false);
      setSelectedDraftId(d?.id || null);
      setTab("drafts");
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to create draft.");
    } finally {
      setBusy(false);
    }
  };

  const onPatchSection = async () => {
    if (!selectedDraftId) {
      setError("Select or create a draft first.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const sectionObjStr = safeJsonString(sectionData);
      const statusObj = sectionStatusValue ? { [sectionKey]: sectionStatusValue } : {};
      const updated = await patchDraftSection({
        draftId: selectedDraftId,
        sectionKey,
        sectionData: sectionObjStr,
        sectionStatus: statusObj,
        currentStep: sectionKey,
        expectedVersion: selectedDraft?.version,
      });

      // Update local list
      setDrafts((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    } catch (e) {
      const msg =
        e?.response?.status === 409
          ? "Version conflict (409). Reload draft list and try again."
          : e?.response?.data?.message || e?.message || "Failed to patch section.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  const onUploadDocument = async () => {
    if (!uploadFile) {
      setError("Choose a file to upload.");
      return;
    }
    if (!selectedDraftId) {
      setError("Select or create a draft first (documents should be linked to a draft).");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const metadata = { docType: uploadDocType };
      await uploadDocument({
        file: uploadFile,
        loanDraftId: selectedDraftId,
        metadata,
      });
      setUploadFile(null);
      await reloadDocuments();
      setTab("documents");
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Upload failed.");
    } finally {
      setBusy(false);
    }
  };

  const onCheckReadiness = async () => {
    if (!selectedDraftId) {
      setError("Select or create a draft first.");
      return;
    }
    setBusy(true);
    setError("");
    setReadiness(null);
    try {
      const rs = requiredSections
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const rd = requiredDocTypes
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const r = await checkDraftReadiness({
        draftId: selectedDraftId,
        requiredSections: rs,
        requiredDocumentTypes: rd,
        runDecisioning: false,
      });
      setReadiness(r);
      setTab("submit");
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Readiness check failed.");
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = async () => {
    if (!selectedDraftId) return;

    setBusy(true);
    setError("");
    try {
      const rs = requiredSections
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const rd = requiredDocTypes
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const updated = await submitDraft({
        draftId: selectedDraftId,
        requiredSections: rs,
        requiredDocumentTypes: rd,
        runDecisioning: true,
      });
      setDrafts((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      setReadiness({ ready: true, missingSections: [], missingDocumentTypes: [], draftId: selectedDraftId });
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Submit failed.");
    } finally {
      setBusy(false);
    }
  };

  const onDecide = async () => {
    if (!selectedDraftId) return;

    setBusy(true);
    setError("");
    try {
      const updated = await decideDraft({ draftId: selectedDraftId });
      setDrafts((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      setTab("drafts");
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Decisioning failed.");
    } finally {
      setBusy(false);
    }
  };

  const onDeleteDraft = async () => {
    if (!selectedDraftId) return;
    setBusy(true);
    setError("");
    try {
      await deleteDraft({ draftId: selectedDraftId });
      setSelectedDraftId(null);
      await reloadDrafts(true);
      setDocuments([]);
      setReadiness(null);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Delete failed.");
    } finally {
      setBusy(false);
    }
  };

  const onDeleteDocument = async (documentId) => {
    setBusy(true);
    setError("");
    try {
      await deleteDocument({ documentId });
      await reloadDocuments();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Delete document failed.");
    } finally {
      setBusy(false);
    }
  };

  const onLogout = async () => {
    setBusy(true);
    setError("");
    try {
      const rt = getRefreshToken();
      if (rt) {
        try {
          await logout({ refreshToken: rt });
        } catch {
          // best-effort
        }
      }
      clearTokens();
      navigate("/login", { replace: true });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
              <FontAwesomeIcon icon={faGaugeHigh} />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-extrabold tracking-tight text-slate-900">
                Applicant Portal
              </div>
              <div className="text-xs font-medium text-slate-500">
                Drafts, documents, submission
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              disabled={busy}
            >
              <FontAwesomeIcon icon={faArrowRightFromBracket} />
              Logout
            </button>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { k: "drafts", label: "Drafts", icon: faFolderOpen },
              { k: "documents", label: "Documents", icon: faFileArrowUp },
              { k: "submit", label: "Submit", icon: faListCheck },
            ].map((t) => (
              <button
                key={t.k}
                type="button"
                onClick={() => setTab(t.k)}
                className={[
                  "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold",
                  tab === t.k ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                ].join(" ")}
              >
                <FontAwesomeIcon icon={t.icon} />
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="grid grid-cols-1 gap-6 lg:grid-cols-3"
        >
          {/* Left: draft selection */}
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm font-extrabold text-slate-900">Your drafts</div>
              <motion.button
                type="button"
                onClick={onCreateDraft}
                disabled={busy}
                whileHover={busy ? undefined : { scale: 1.02 }}
                whileTap={busy ? undefined : { scale: 0.98 }}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-3 py-2 text-xs font-extrabold text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
              >
                <FontAwesomeIcon icon={faPlus} />
                New draft
              </motion.button>
            </div>

            <div className="mt-4 space-y-2">
              {drafts.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-700">
                      <FontAwesomeIcon icon={faClock} />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-extrabold text-slate-900">Start a new application</div>
                      <div className="mt-1 text-sm text-slate-600">
                        Create a draft to begin entering business details and uploading documents.
                      </div>

                      <motion.button
                        type="button"
                        onClick={onCreateDraft}
                        disabled={busy}
                        whileHover={busy ? undefined : { scale: 1.02 }}
                        whileTap={busy ? undefined : { scale: 0.98 }}
                        className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-extrabold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                      >
                        <FontAwesomeIcon icon={faPlus} />
                        Create draft
                      </motion.button>
                    </div>
                  </div>
                </div>
              ) : (
                drafts.map((d) => (
                  <motion.button
                    key={d.id}
                    type="button"
                    onClick={() => setSelectedDraftId(d.id)}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.99 }}
                    className={[
                      "w-full rounded-2xl border px-4 py-3 text-left shadow-sm transition",
                      selectedDraftId === d.id
                        ? "border-blue-300 bg-blue-50"
                        : "border-slate-200 bg-white hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-extrabold text-slate-900">Draft</div>
                      <div className="text-xs font-semibold text-slate-500">v{d.version ?? 0}</div>
                    </div>
                    <div className="mt-1 text-xs text-slate-600">
                      Status: <span className="font-semibold">{d.status}</span>
                      {" · "}
                      Step: <span className="font-semibold">{d.currentStep || "-"}</span>
                    </div>
                    {d.decision ? (
                      <div className="mt-2 text-xs font-semibold text-slate-700">
                        Decision: <span className="text-blue-700">{d.decision}</span>
                      </div>
                    ) : null}
                  </motion.button>
                ))
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onCheckReadiness}
                disabled={busy || !selectedDraftId}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-extrabold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
              >
                <FontAwesomeIcon icon={faCheckCircle} />
                Check readiness
              </button>

              <button
                type="button"
                onClick={onDecide}
                disabled={busy || !selectedDraftId}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-extrabold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
              >
                <FontAwesomeIcon icon={faBolt} />
                Run decisioning
              </button>

              <button
                type="button"
                onClick={onDeleteDraft}
                disabled={busy || !selectedDraftId}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-3 py-2 text-xs font-extrabold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
              >
                <FontAwesomeIcon icon={faTriangleExclamation} />
                Delete
              </button>
            </div>

            {error ? (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </div>
            ) : null}

            {busy ? (
              <div className="mt-4 text-xs font-semibold text-slate-500">
                Working…
              </div>
            ) : null}
          </section>

          {/* Right: tab content */}
          <section className="lg:col-span-2">
            <AnimatePresence mode="wait" initial={false}>
              {tab === "drafts" ? (
                <motion.div
                  key="tab-drafts"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <DraftsPanel
                    selectedDraft={selectedDraft}
                    sectionKey={sectionKey}
                    setSectionKey={setSectionKey}
                    sectionData={sectionData}
                    setSectionData={setSectionData}
                    sectionStatusValue={sectionStatusValue}
                    setSectionStatusValue={setSectionStatusValue}
                    onPatchSection={onPatchSection}
                    busy={busy}
                  />
                </motion.div>
              ) : null}

              {tab === "documents" ? (
                <motion.div
                  key="tab-documents"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <DocumentsPanel
                    selectedDraftId={selectedDraftId}
                    documents={documents}
                    uploadFile={uploadFile}
                    setUploadFile={setUploadFile}
                    uploadDocType={uploadDocType}
                    setUploadDocType={setUploadDocType}
                    onUpload={onUploadDocument}
                    onDeleteDocument={onDeleteDocument}
                    busy={busy}
                  />
                </motion.div>
              ) : null}

              {tab === "submit" ? (
                <motion.div
                  key="tab-submit"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <SubmitPanel
                    selectedDraft={selectedDraft}
                    requiredSections={requiredSections}
                    setRequiredSections={setRequiredSections}
                    requiredDocTypes={requiredDocTypes}
                    setRequiredDocTypes={setRequiredDocTypes}
                    readiness={readiness}
                    onCheckReadiness={onCheckReadiness}
                    onSubmit={onSubmit}
                    busy={busy}
                  />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </section>
        </motion.div>
      </main>
    </div>
  );
}

function DraftsPanel({
  selectedDraft,
  sectionKey,
  setSectionKey,
  sectionData,
  setSectionData,
  sectionStatusValue,
  setSectionStatusValue,
  onPatchSection,
  busy,
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-sm font-extrabold text-slate-900">Draft details</div>
        {!selectedDraft ? (
          <div className="mt-3 text-sm text-slate-600">Select a draft to view details.</div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs font-semibold text-slate-500">Status</div>
              <div className="mt-1 text-sm font-extrabold text-slate-900">{selectedDraft.status}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs font-semibold text-slate-500">Current step</div>
              <div className="mt-1 text-sm font-extrabold text-slate-900">{selectedDraft.currentStep || "-"}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs font-semibold text-slate-500">Risk score</div>
              <div className="mt-1 text-sm font-extrabold text-slate-900">
                {selectedDraft.riskScore ?? "—"}
              </div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs font-semibold text-slate-500">Decision</div>
              <div className="mt-1 text-sm font-extrabold text-slate-900">
                {selectedDraft.decision ?? "—"}
              </div>
            </div>

            <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-xs font-semibold text-slate-500">Decision reason</div>
              <div className="mt-1 text-sm text-slate-700">
                {selectedDraft.decisionReason ?? "—"}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-sm font-extrabold text-slate-900">Patch a section</div>
        <p className="mt-2 text-sm text-slate-600">
          The backend stores draft.data and draft.sectionStatus as JSON encoded strings. This tool calls{" "}
          <code className="rounded bg-slate-100 px-2 py-0.5 text-xs">PATCH /api/loan/drafts/:id/sections</code>.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <label className="block">
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Section key</div>
            <input
              value={sectionKey}
              onChange={(e) => setSectionKey(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
              placeholder="businessInfo"
            />
          </label>

          <label className="block">
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Section status</div>
            <select
              value={sectionStatusValue}
              onChange={(e) => setSectionStatusValue(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
            >
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
          </label>

          <div className="flex items-end">
            <motion.button
              type="button"
              whileHover={busy ? undefined : { scale: 1.02 }}
              whileTap={busy ? undefined : { scale: 0.98 }}
              onClick={onPatchSection}
              disabled={busy || !selectedDraft}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-500 px-4 py-3 text-sm font-extrabold text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
            >
              Patch section <FontAwesomeIcon icon={faFileArrowUp} />
            </motion.button>
          </div>
        </div>

        <label className="mt-4 block">
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Section JSON</div>
          <textarea
            value={sectionData}
            onChange={(e) => setSectionData(e.target.value)}
            rows={9}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-mono text-xs outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
          />
        </label>

        {selectedDraft?.data ? (
          <details className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <summary className="cursor-pointer text-sm font-bold text-slate-900">
              View current draft.data JSON
            </summary>
            <pre className="mt-3 overflow-auto text-xs text-slate-800">{prettyJson(selectedDraft.data)}</pre>
          </details>
        ) : null}
      </div>
    </div>
  );
}

function DocumentsPanel({
  selectedDraftId,
  documents,
  uploadFile,
  setUploadFile,
  uploadDocType,
  setUploadDocType,
  onUpload,
  onDeleteDocument,
  busy,
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-sm font-extrabold text-slate-900">Upload a document</div>
        <p className="mt-2 text-sm text-slate-600">
          Upload PDFs or images and link them to the selected draft. This calls{" "}
          <code className="rounded bg-slate-100 px-2 py-0.5 text-xs">POST /api/documents</code>.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <label className="block md:col-span-2">
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">File</div>
            <input
              type="file"
              accept=".pdf,image/png,image/jpeg"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
            />
            <div className="mt-2 text-xs text-slate-500">
              Draft link:{" "}
              <span className="font-semibold text-slate-700">
                {selectedDraftId || "Select a draft first"}
              </span>
            </div>
          </label>

          <label className="block">
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Doc type</div>
            <select
              value={uploadDocType}
              onChange={(e) => setUploadDocType(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
            >
              <option value="BANK_STATEMENT">BANK_STATEMENT</option>
              <option value="TAX_RETURN">TAX_RETURN</option>
              <option value="OTHER">OTHER</option>
            </select>

            <motion.button
              type="button"
              whileHover={busy ? undefined : { scale: 1.02 }}
              whileTap={busy ? undefined : { scale: 0.98 }}
              onClick={onUpload}
              disabled={busy || !selectedDraftId}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-500 px-4 py-3 text-sm font-extrabold text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
            >
              Upload <FontAwesomeIcon icon={faFileArrowUp} />
            </motion.button>
          </label>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-sm font-extrabold text-slate-900">Documents</div>
        <div className="mt-4 space-y-2">
          {documents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              No documents found for this draft.
            </div>
          ) : (
            documents.map((d) => (
              <div
                key={d.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="text-sm font-extrabold text-slate-900">{d.originalFilename}</div>
                  <div className="mt-1 text-xs text-slate-600">
                    {d.contentType} · {(d.sizeBytes / 1024).toFixed(1)} KB
                  </div>
                  <div className="mt-2 text-xs text-slate-600">
                    Metadata: <code className="rounded bg-slate-100 px-2 py-0.5">{d.metadata || "{}"}</code>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <a
                    href={getDocumentDownloadUrl(d.id)}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-extrabold text-white hover:bg-slate-800"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Download <FontAwesomeIcon icon={faArrowRightFromBracket} />
                  </a>
                  <button
                    type="button"
                    onClick={() => onDeleteDocument(d.id)}
                    className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-3 py-2 text-xs font-extrabold text-white hover:bg-red-700"
                    disabled={busy}
                  >
                    Delete <FontAwesomeIcon icon={faTriangleExclamation} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function SubmitPanel({
  selectedDraft,
  requiredSections,
  setRequiredSections,
  requiredDocTypes,
  setRequiredDocTypes,
  readiness,
  onCheckReadiness,
  onSubmit,
  busy,
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-sm font-extrabold text-slate-900">Readiness & submission</div>
        <p className="mt-2 text-sm text-slate-600">
          The backend enforces required sections (sectionStatus must be COMPLETED) and required documents (documents.metadata.docType).
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="block">
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              Required sections (comma-separated)
            </div>
            <input
              value={requiredSections}
              onChange={(e) => setRequiredSections(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
              placeholder="businessInfo, ownerInfo, loanRequest"
            />
          </label>

          <label className="block">
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              Required document types (comma-separated)
            </div>
            <input
              value={requiredDocTypes}
              onChange={(e) => setRequiredDocTypes(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
              placeholder="BANK_STATEMENT, TAX_RETURN"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onCheckReadiness}
            disabled={busy || !selectedDraft}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-extrabold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
          >
            Check readiness <FontAwesomeIcon icon={faListCheck} />
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={busy || !selectedDraft || readiness?.ready !== true}
            className="inline-flex items-center gap-2 rounded-2xl bg-blue-500 px-4 py-3 text-sm font-extrabold text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
          >
            Submit <FontAwesomeIcon icon={faArrowRightFromBracket} />
          </button>
        </div>

        {!selectedDraft ? (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Select a draft first.
          </div>
        ) : null}

        {readiness ? (
          <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center justify-between">
              <div className="text-sm font-extrabold text-slate-900">Readiness result</div>
              <div
                className={[
                  "rounded-full px-3 py-1 text-xs font-extrabold",
                  readiness.ready ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800",
                ].join(" ")}
              >
                {readiness.ready ? "READY" : "NOT READY"}
              </div>
            </div>

            {!readiness.ready ? (
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-2xl bg-white p-4">
                  <div className="text-xs font-semibold text-slate-500">Missing sections</div>
                  <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
                    {(readiness.missingSections || []).map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                    {(readiness.missingSections || []).length === 0 ? <li>None</li> : null}
                  </ul>
                </div>

                <div className="rounded-2xl bg-white p-4">
                  <div className="text-xs font-semibold text-slate-500">Missing document types</div>
                  <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
                    {(readiness.missingDocumentTypes || []).map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                    {(readiness.missingDocumentTypes || []).length === 0 ? <li>None</li> : null}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-emerald-700">
                <FontAwesomeIcon icon={faCheckCircle} />
                Draft is ready to submit.
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
