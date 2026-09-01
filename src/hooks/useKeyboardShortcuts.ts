import { useEffect } from "react";
import { useEditorStore } from "../store/editorStore";

const EDITABLE_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

export function useKeyboardShortcuts() {
  const removeSelected = useEditorStore((s) => s.removeSelected);
  const select = useEditorStore((s) => s.select);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && EDITABLE_TAGS.has(target.tagName)) return;

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        removeSelected();
      } else if (e.key === "Escape") {
        select(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [removeSelected, select]);
}
