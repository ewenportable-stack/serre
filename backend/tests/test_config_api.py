from fastapi.testclient import TestClient

SAMPLE_CONFIG = {
    "version": 1,
    "greenhouse": {
        "name": "Ma serre de test",
        "grid": {"cellSize": 40, "columns": 24, "rows": 16, "snapToGrid": False, "metersPerCell": 0.5},
    },
    "zones": [
        {
            "id": "zone-1",
            "name": "Butte 1",
            "kind": "culture_bed",
            "x": 80,
            "y": 80,
            "width": 160,
            "height": 120,
            "rotation": 0,
            "color": "#84cc1633",
        }
    ],
    "nodes": [
        {
            "id": "node-1",
            "type": "sensor_soil_moisture",
            "category": "sensor",
            "label": "Capteur humidité sol 1",
            "x": 150,
            "y": 130,
            "rotation": 0,
            "zoneId": "zone-1",
            "mqtt": {"topic": "maserre/zone1/sol/humidite", "qos": 0, "retain": False, "payloadType": "float"},
            "size": 12,
        },
        {
            "id": "node-2",
            "type": "actuator_valve_watering",
            "category": "actuator",
            "label": "Vanne arrosage 1",
            "x": 200,
            "y": 130,
            "rotation": 0,
            "zoneId": "zone-1",
            "mqtt": {"topic": "maserre/zone1/arrosage/commande", "qos": 0, "retain": True, "payloadType": "bool"},
            "size": 12,
        },
    ],
    "doors": [],
    "plants": [],
    "pipes": [],
}


def get_client() -> TestClient:
    from app.main import app

    return TestClient(app)


def test_get_config_returns_404_when_nothing_saved():
    with get_client() as client:
        response = client.get("/api/config")
    assert response.status_code == 404


def test_put_then_get_roundtrips_config():
    with get_client() as client:
        put_response = client.put("/api/config", json=SAMPLE_CONFIG)
        assert put_response.status_code == 200
        assert put_response.json()["greenhouse"]["name"] == "Ma serre de test"

        get_response = client.get("/api/config")
        assert get_response.status_code == 200
        body = get_response.json()
        assert body["greenhouse"]["name"] == "Ma serre de test"
        assert len(body["zones"]) == 1
        assert len(body["nodes"]) == 2
        assert body["nodes"][0]["mqtt"]["topic"] == "maserre/zone1/sol/humidite"


def test_put_config_overwrites_previous():
    with get_client() as client:
        client.put("/api/config", json=SAMPLE_CONFIG)

        updated = dict(SAMPLE_CONFIG)
        updated["greenhouse"] = {**SAMPLE_CONFIG["greenhouse"], "name": "Nouveau nom"}
        client.put("/api/config", json=updated)

        response = client.get("/api/config")
        assert response.json()["greenhouse"]["name"] == "Nouveau nom"


def test_put_config_rejects_invalid_payload():
    with get_client() as client:
        response = client.put("/api/config", json={"version": 1})
    assert response.status_code == 422


def test_health_endpoint():
    with get_client() as client:
        response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
