import re

from influxdb_client import InfluxDBClient, Point
from influxdb_client.client.write_api import SYNCHRONOUS

from .config import settings

_IDENTIFIER_RE = re.compile(r"^[A-Za-z0-9_-]+$")

_client: InfluxDBClient | None = None


def _sanitize_identifier(value: str) -> str:
    """Les identifiants injectés dans une requête Flux doivent être restreints à un charset sûr."""
    if not _IDENTIFIER_RE.match(value):
        raise ValueError(f"Identifiant invalide: {value!r}")
    return value


def get_client() -> InfluxDBClient:
    global _client
    if _client is None:
        _client = InfluxDBClient(url=settings.influx_url, token=settings.influx_token, org=settings.influx_org)
    return _client


def write_sensor_reading(node_id: str, node_type: str, value: float, value2: float | None = None) -> None:
    client = get_client()
    write_api = client.write_api(write_options=SYNCHRONOUS)
    point = Point("sensor_reading").tag("node_id", node_id).tag("node_type", node_type).field("value", value)
    if value2 is not None:
        point = point.field("value2", value2)
    write_api.write(bucket=settings.influx_bucket, record=point)


def query_history(node_id: str, minutes: int = 60) -> list[dict]:
    node_id = _sanitize_identifier(node_id)
    minutes = max(1, min(minutes, 60 * 24 * 7))  # borne à 7 jours pour éviter une requête démesurée

    client = get_client()
    query_api = client.query_api()
    flux = f"""
    from(bucket: "{settings.influx_bucket}")
      |> range(start: -{minutes}m)
      |> filter(fn: (r) => r._measurement == "sensor_reading" and r.node_id == "{node_id}")
      |> sort(columns: ["_time"])
    """
    tables = query_api.query(flux, org=settings.influx_org)

    readings: dict[str, dict] = {}
    for table in tables:
        for record in table.records:
            t = record.get_time().isoformat()
            entry = readings.setdefault(t, {"t": t, "value": 0.0, "value2": None})
            entry[record.get_field()] = record.get_value()

    return sorted(readings.values(), key=lambda r: r["t"])
