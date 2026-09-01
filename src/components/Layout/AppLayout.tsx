import { Toolbar } from "../Toolbar/Toolbar";
import { DevicePalette } from "../Palette/DevicePalette";
import { EditorCanvas } from "../Editor/EditorCanvas";
import { InspectorPanel } from "../Inspector/InspectorPanel";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";

interface AppLayoutProps {
  onBackToLive: () => void;
}

export function AppLayout({ onBackToLive }: AppLayoutProps) {
  useKeyboardShortcuts();

  return (
    <div className="app-layout">
      <Toolbar onBackToLive={onBackToLive} />
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
