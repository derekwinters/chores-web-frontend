import { useState, useEffect, useRef } from "react";

/**
 * Manages save button visual state: null | 'saving' | 'success' | 'error'
 * - 'saving': request in flight (intermediate success-outline color), shown for at least minSavingDelay
 * - 'success': request completed successfully (full success color), shown for at least successDelay
 * - 'error': request failed (error color, auto-reverts)
 * Cleans up timers on unmount.
 */
export function useSaveStatus({ minSavingDelay = 1000, successDelay = 1000, errorDelay = 3000 } = {}) {
  const [saveStatus, setSaveStatus] = useState(null);
  const timerRef = useRef(null);
  const savingStartRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const triggerSaving = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    savingStartRef.current = Date.now();
    setSaveStatus("saving");
  };

  const triggerSuccess = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const elapsed = savingStartRef.current ? Date.now() - savingStartRef.current : minSavingDelay;
    const remaining = Math.max(0, minSavingDelay - elapsed);
    timerRef.current = setTimeout(() => {
      setSaveStatus("success");
      timerRef.current = setTimeout(() => setSaveStatus(null), successDelay);
    }, remaining);
  };

  const triggerError = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setSaveStatus("error");
    timerRef.current = setTimeout(() => setSaveStatus(null), errorDelay);
  };

  const reset = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setSaveStatus(null);
  };

  const saveBtnClass =
    saveStatus === "saving"  ? "btn-saving"  :
    saveStatus === "success" ? "btn-success" :
    saveStatus === "error"   ? "btn-error"   : "btn-primary";

  // Returns ms until button fully reverts after triggerSuccess() is called.
  // Use this to time dialog/form close so "Saved" is fully visible first.
  const getCloseDelay = () => {
    const elapsed = savingStartRef.current ? Date.now() - savingStartRef.current : minSavingDelay;
    const remaining = Math.max(0, minSavingDelay - elapsed);
    return remaining + successDelay;
  };

  return { saveStatus, saveBtnClass, triggerSaving, triggerSuccess, triggerError, reset, getCloseDelay };
}
