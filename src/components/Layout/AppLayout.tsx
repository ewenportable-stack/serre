import { Toolbar } from "../Toolbar/Toolbar";
import { DevicePalette } from "../Palette/DevicePalette";
import { EditorCanvas } from "../Editor/EditorCanvas";
import { InspectorPanel } from "../Inspector/InspectorPanel";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";

export function AppLayout() {
  useKeyboardShortcuts();

  return (
    <div className="app-layout">
      <Toolbar />
      <div className="app-body">
        <DevicePalette />
        <main className="canvas-area">
          <EditorCanvas />
        </main>
        <InspectorPanel />
      </div>
    </div>
  );
}
