import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterator

from .config import settings
from .schemas import HypervisionConfig

_SCHEMA = """
CREATE TABLE IF NOT EXISTS greenhouse_config (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    data TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
"""


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(settings.database_path)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    Path(settings.database_path).parent.mkdir(parents=True, exist_ok=True)
    with _connect() as conn:
        conn.execute(_SCHEMA)


@contextmanager
def get_connection() -> Iterator[sqlite3.Connection]:
    conn = _connect()
    try:
        yield conn
    finally:
        conn.close()


def load_config() -> HypervisionConfig | None:
    with get_connection() as conn:
        row = conn.execute("SELECT data FROM greenhouse_config WHERE id = 1").fetchone()
    if row is None:
        return None
    return HypervisionConfig.model_validate_json(row["data"])


def save_config(config: HypervisionConfig) -> HypervisionConfig:
    now = datetime.now(timezone.utc).isoformat()
    payload = config.model_dump_json()
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO greenhouse_config (id, data, updated_at)
            VALUES (1, ?, ?)
            ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at
            """,
            (payload, now),
        )
        conn.commit()
    return config
