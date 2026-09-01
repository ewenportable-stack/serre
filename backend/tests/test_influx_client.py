"""
Tests unitaires de la couche InfluxDB. Aucune instance InfluxDB réelle n'est
disponible dans cet environnement de développement (le binaire serveur OSS 2.x
n'est plus distribué en tarball téléchargeable directement) : on vérifie donc
la logique propre à ce module (validation des identifiants, regroupement des
enregistrements Flux) avec un client InfluxDB simulé plutôt qu'un test
d'intégration bout-en-bout. Voir README.md pour tester manuellement contre une
vraie instance (docker-compose fourni).
"""

from datetime import datetime, timezone
from unittest.mock import MagicMock

import pytest

from app import influx_client


def test_sanitize_identifier_accepts_normal_ids():
    assert influx_client._sanitize_identifier("node-1234-abcd") == "node-1234-abcd"


@pytest.mark.parametrize("bad_id", ['node" or 1=1', "node)\nfilter(", "node id", "node;drop"])
def test_sanitize_identifier_rejects_suspicious_input(bad_id):
    with pytest.raises(ValueError):
        influx_client._sanitize_identifier(bad_id)


def _make_record(time: datetime, field: str, value: float):
    record = MagicMock()
    record.get_time.return_value = time
    record.get_field.return_value = field
    record.get_value.return_value = value
    return record


def test_query_history_groups_value_and_value2_by_timestamp(monkeypatch):
    t1 = datetime(2026, 1, 1, 10, 0, 0, tzinfo=timezone.utc)
    t2 = datetime(2026, 1, 1, 10, 1, 0, tzinfo=timezone.utc)

    table_value = MagicMock()
    table_value.records = [_make_record(t1, "value", 21.5), _make_record(t2, "value", 22.0)]
    table_value2 = MagicMock()
    table_value2.records = [_make_record(t1, "value2", 63.0), _make_record(t2, "value2", 64.0)]

    fake_query_api = MagicMock()
    fake_query_api.query.return_value = [table_value, table_value2]

    fake_client = MagicMock()
    fake_client.query_api.return_value = fake_query_api

    monkeypatch.setattr(influx_client, "get_client", lambda: fake_client)

    result = influx_client.query_history("node-1", minutes=30)

    assert result == [
        {"t": t1.isoformat(), "value": 21.5, "value2": 63.0},
        {"t": t2.isoformat(), "value": 22.0, "value2": 64.0},
    ]
    # La requête Flux doit filtrer sur le bon node_id et respecter la fenêtre demandée.
    flux_query = fake_query_api.query.call_args.args[0]
    assert 'r.node_id == "node-1"' in flux_query
    assert "-30m" in flux_query


def test_query_history_rejects_invalid_node_id():
    with pytest.raises(ValueError):
        influx_client.query_history('node"; drop', minutes=10)


def test_query_history_clamps_minutes_range(monkeypatch):
    fake_query_api = MagicMock()
    fake_query_api.query.return_value = []
    fake_client = MagicMock()
    fake_client.query_api.return_value = fake_query_api
    monkeypatch.setattr(influx_client, "get_client", lambda: fake_client)

    influx_client.query_history("node-1", minutes=999999)

    flux_query = fake_query_api.query.call_args.args[0]
    assert f"-{60 * 24 * 7}m" in flux_query
