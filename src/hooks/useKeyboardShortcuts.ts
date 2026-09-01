import { useEffect } from "react";
import { useEditorStore } from "../store/editorStore";

const EDITABLE_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

export function useKeyboardShortcuts() {
  const removeSelected = useEditorStore((s) => s.removeSelected);
  const select = useEditorStore((s) => s.select);
  const hasSelection = useEditorStore((s) => s.selection !== null);
  const hasClipboard = useEditorStore((s) => s.clipboard !== null);
  const copySelected = useEditorStore((s) => s.copySelected);
  const pasteClipboard = useEditorStore((s) => s.pasteClipboard);
  const isDrawingPipe = useEditorStore((s) => s.pipeDraft !== null);
  const finishPipeDraft = useEditorStore((s) => s.finishPipeDraft);
  const cancelPipeDraft = useEditorStore((s) => s.cancelPipeDraft);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && EDITABLE_TAGS.has(target.tagName)) return;

      if (isDrawingPipe) {
        if (e.key === "Enter") {
          e.preventDefault();
          finishPipeDraft();
        } else if (e.key === "Escape") {
          e.preventDefault();
          cancelPipeDraft();
        }
        return;
      }

      const meta = e.ctrlKey || e.metaKey;

      if (meta && e.key.toLowerCase() === "c") {
        if (hasSelection) {
          e.preventDefault();
          copySelected();
        }
      } else if (meta && e.key.toLowerCase() === "v") {
        if (hasClipboard) {
          e.preventDefault();
          pasteClipboard();
        }
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        removeSelected();
      } else if (e.key === "Escape") {
        select(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    removeSelected,
    select,
    isDrawingPipe,
    finishPipeDraft,
    cancelPipeDraft,
    hasSelection,
    hasClipboard,
    copySelected,
    pasteClipboard,
  ]);
}
