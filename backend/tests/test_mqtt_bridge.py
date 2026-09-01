"""
Tests d'intégration du pont MQTT contre un vrai broker Mosquitto local
(voir README.md pour l'installer/le démarrer : `mosquitto -d -p 1883`).
Ces tests sont ignorés automatiquement si aucun broker n'écoute sur MQTT_HOST:MQTT_PORT.
"""

import asyncio
import socket

import pytest

from app.mqtt_bridge import _format_command_payload, _parse_sensor_payload
from app.schemas import DeviceNode, MqttConfig


def _broker_available(host: str = "localhost", port: int = 1883) -> bool:
    try:
        with socket.create_connection((host, port), timeout=0.5):
            return True
    except OSError:
        return False


requires_broker = pytest.mark.skipif(not _broker_available(), reason="Aucun broker MQTT local sur :1883")


def _make_node(**overrides) -> DeviceNode:
    base = dict(
        id="node-1",
        type="sensor_ds18b20",
        category="sensor",
        label="Sonde température",
        x=0,
        y=0,
        rotation=0,
        zoneId=None,
        mqtt=MqttConfig(topic="serre/test/temperature", qos=0, retain=False, payloadType="float"),
        deviceId=None,
        size=12,
    )
    base.update(overrides)
    return DeviceNode(**base)


def test_parse_sensor_payload_float():
    node = _make_node()
    assert _parse_sensor_payload(b"21.5", node) == (21.5, None)


def test_parse_sensor_payload_bool():
    node = _make_node(mqtt=MqttConfig(topic="t", qos=0, retain=False, payloadType="bool"))
    assert _parse_sensor_payload(b"true", node) == (1.0, None)
    assert _parse_sensor_payload(b"0", node) == (0.0, None)


def test_parse_sensor_payload_json_combined():
    node = _make_node(
        type="sensor_temp_humidity",
        mqtt=MqttConfig(topic="t", qos=0, retain=False, payloadType="json"),
    )
    assert _parse_sensor_payload(b'{"value": 21.5, "value2": 63}', node) == (21.5, 63.0)


def test_parse_sensor_payload_invalid_returns_none():
    node = _make_node()
    assert _parse_sensor_payload(b"not-a-number", node) is None


def test_format_command_payload_bool():
    node = _make_node(category="actuator", mqtt=MqttConfig(topic="t", qos=0, retain=True, payloadType="bool"))
    assert _format_command_payload(node, True) == "true"
    assert _format_command_payload(node, False) == "false"


def test_format_command_payload_json():
    node = _make_node(category="actuator", mqtt=MqttConfig(topic="t", qos=0, retain=True, payloadType="json"))
    assert _format_command_payload(node, True) == '{"value": true}'


@requires_broker
@pytest.mark.asyncio
async def test_publish_and_receive_round_trip():
    """Publie une commande actionneur sur le vrai broker et vérifie qu'un abonné externe la reçoit,
    avec le bon format de payload et le flag retain."""
    import aiomqtt

    node = _make_node(
        id="valve-1",
        category="actuator",
        mqtt=MqttConfig(topic="serre/test/valve", qos=0, retain=True, payloadType="bool"),
    )

    received: list[str] = []

    async def subscriber():
        async with aiomqtt.Client(hostname="localhost", port=1883) as client:
            await client.subscribe(node.mqtt.topic)
            async for message in client.messages:
                received.append(message.payload.decode())
                break

    from app import mqtt_bridge

    sub_task = asyncio.create_task(subscriber())
    await asyncio.sleep(0.3)  # laisse le temps à l'abonnement de s'établir
    await mqtt_bridge.publish_actuator_command(node, True)
    await asyncio.wait_for(sub_task, timeout=3)

    assert received == ["true"]
    assert mqtt_bridge.get_actuator_state("valve-1") is True
