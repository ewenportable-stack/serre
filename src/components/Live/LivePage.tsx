import { LiveTopbar } from "./LiveTopbar";
import { LiveCanvas } from "./LiveCanvas";

export function LivePage() {
  return (
    <div className="live-page">
      <LiveTopbar />
      <div className="canvas-area live-canvas-area">
        <LiveCanvas />
      </div>
    </div>
  );
}
