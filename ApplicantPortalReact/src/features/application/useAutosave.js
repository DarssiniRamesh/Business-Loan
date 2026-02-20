import { useEffect, useMemo, useRef, useState } from "react";
import { ApplicantApi } from "../../api/endpoints.js";

/**
 * Autosave behavior:
 * - Keep local state as source of truth for form fields
 * - Debounce PATCH calls to backend
 * - Persist last draft locally so refresh doesn't lose progress
 */

// PUBLIC_INTERFACE
export function useAutosaveDraft({ applicationId, initialDraft }) {
  /** Manages a draft and debounced autosave to backend. */
  const storageKey = useMemo(() => `bl.appDraft.${applicationId || "new"}`, [applicationId]);
  const [draft, setDraft] = useState(() => {
    const local = localStorage.getItem(storageKey);
    if (local) {
      try {
        return JSON.parse(local);
      } catch {
        // ignore
      }
    }
    return initialDraft || { business: {}, owner: {}, loan: {} };
  });

  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const debounceRef = useRef(null);
  const inFlightRef = useRef(false);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(draft));
  }, [draft, storageKey]);

  async function flushSave(nextDraft) {
    if (!applicationId) return;
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setSaving(true);
    setSaveError(null);
    try {
      await ApplicantApi.updateApplication(applicationId, nextDraft);
      setLastSavedAt(new Date().toISOString());
    } catch (e) {
      setSaveError(e?.message || "Autosave failed");
    } finally {
      setSaving(false);
      inFlightRef.current = false;
    }
  }

  function scheduleSave(nextDraft) {
    if (!applicationId) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => flushSave(nextDraft), 750);
  }

  // PUBLIC_INTERFACE
  function updateDraft(path, value) {
    /** Updates draft at "section.field" and schedules autosave. */
    const [section, field] = path.split(".");
    const next = {
      ...draft,
      [section]: {
        ...(draft?.[section] || {}),
        [field]: value
      }
    };
    setDraft(next);
    scheduleSave(next);
  }

  // PUBLIC_INTERFACE
  async function saveNow() {
    /** Forces immediate save without debounce. */
    if (debounceRef.current) clearTimeout(debounceRef.current);
    await flushSave(draft);
  }

  return { draft, setDraft, updateDraft, saveNow, saving, lastSavedAt, saveError };
}
