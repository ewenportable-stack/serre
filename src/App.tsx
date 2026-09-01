import { useState } from "react";
import { AppLayout } from "./components/Layout/AppLayout";
import { LivePage } from "./components/Live/LivePage";

type Page = "editor" | "live";

function App() {
  const [page, setPage] = useState<Page>("live");

  return (
    <div className="app-shell">
      {page === "editor" ? (
        <AppLayout onBackToLive={() => setPage("live")} />
      ) : (
        <LivePage onEdit={() => setPage("editor")} />
      )}
    </div>
  );
}

export default App;
