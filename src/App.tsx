import { useState } from "react";
import { AppLayout } from "./components/Layout/AppLayout";
import { LivePage } from "./components/Live/LivePage";

type Page = "editor" | "live";

function App() {
  const [page, setPage] = useState<Page>("editor");

  return (
    <div className="app-shell">
      <nav className="page-tabs">
        <button type="button" className={page === "editor" ? "active" : ""} onClick={() => setPage("editor")}>
          🧩 Éditeur
        </button>
        <button type="button" className={page === "live" ? "active" : ""} onClick={() => setPage("live")}>
          📡 Vue live
        </button>
      </nav>
      {page === "editor" ? <AppLayout /> : <LivePage />}
    </div>
  );
}

export default App;
