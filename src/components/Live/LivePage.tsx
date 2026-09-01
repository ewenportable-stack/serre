import { LiveTopbar } from "./LiveTopbar";
import { LiveCanvas } from "./LiveCanvas";

interface LivePageProps {
  onEdit: () => void;
}

export function LivePage({ onEdit }: LivePageProps) {
  return (
    <div className="live-page">
      <LiveTopbar onEdit={onEdit} />
      <div className="canvas-area live-canvas-area">
        <LiveCanvas />
      </div>
    </div>
  );
}
