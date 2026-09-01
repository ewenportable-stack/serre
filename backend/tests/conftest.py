import os
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))


@pytest.fixture(autouse=True)
def isolated_database(tmp_path, monkeypatch):
    """Chaque test utilise sa propre base SQLite temporaire, jamais celle de dev/prod."""
    db_path = tmp_path / "test-serre.db"
    monkeypatch.setenv("DATABASE_PATH", str(db_path))

    from app.config import Settings
    import app.database as database_module

    monkeypatch.setattr(database_module, "settings", Settings())
    database_module.init_db()
    yield
