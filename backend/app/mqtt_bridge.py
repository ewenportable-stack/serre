import asyncio
import json
import logging
from datetime import datetime, timezone

import aiomqtt

from .config import settings
from .database import load_config
from .influx_client import write_sensor_reading
from .schemas import DeviceNode

logger = logging.getLogger("serre.mqtt")

_client: aiomqtt.Client | None = None
_latest_readings: dict[str, dict] = {}
_actuator_states: dict[str, bool] = {}
_resubscribe_event = asyncio.Event()


def get_latest_reading(node_id: str) -> dict | None:
    return _latest_readings.get(node_id)


def get_actuator_state(node_id: str) -> bool:
    return _actuator_states.get(node_id, False)


def _parse_sensor_payload(raw: bytes, node: DeviceNode) -> tuple[float, float | None] | None:
    text = raw.decode("utf-8", errors="ignore").strip()
    try:
        if node.mqtt.payloadType == "json":
            data = json.loads(text)
            if isinstance(data, dict):
                value = float(data.get("value", data.get("temperature", 0)))
                raw_value2 = data.get("value2", data.get("humidity"))
                return value, (float(raw_value2) if raw_value2 is not None else None)
            return float(data), None
        if node.mqtt.payloadType == "bool":
            return (1.0 if text.lower() in ("1", "true", "on") else 0.0), None
        return float(text), None
    except (ValueError, TypeError, json.JSONDecodeError):
        logger.warning("Payload MQTT illisible pour le nœud %s (topic %s): %r", node.id, node.mqtt.topic, raw)
        return None


def _format_command_payload(node: DeviceNode, on: bool) -> str:
    if node.mqtt.payloadType == "json":
        return json.dumps({"value": on})
    if node.mqtt.payloadType == "bool":
        return "true" if on else "false"
    return "1" if on else "0"


async def _handle_message(topic: str, payload: bytes) -> None:
    config = load_config()
    if config is None:
        return
    for node in config.nodes:
        if node.mqtt.topic != topic:
            continue
        if node.category == "sensor":
            parsed = _parse_sensor_payload(payload, node)
            if parsed is None:
                continue
            value, value2 = parsed
            now = datetime.now(timezone.utc).isoformat()
            _latest_readings[node.id] = {"t": now, "value": value, "value2": value2}
            write_sensor_reading(node.id, node.type, value, value2)
        else:
            text = payload.decode("utf-8", errors="ignore").strip().lower()
            _actuator_states[node.id] = text in ("1", "true", "on")


async def _subscribe_all(client: aiomqtt.Client) -> None:
    config = load_config()
    if config is None:
        return
    for node in config.nodes:
        if node.category == "sensor":
            await client.subscribe(node.mqtt.topic, qos=node.mqtt.qos)


async def resubscribe() -> None:
    """À appeler après une sauvegarde de config pour prendre en compte les topics ajoutés/modifiés.

    Ne touche jamais le client MQTT directement : seule la tâche run_mqtt_loop()
    est autorisée à l'utiliser (cf. note dans publish_actuator_command). On se
    contente de signaler l'événement ; c'est run_mqtt_loop() qui re-souscrira.
    """
    _resubscribe_event.set()


async def publish_actuator_command(node: DeviceNode, on: bool) -> None:
    """Ouvre une connexion dédiée et courte pour publier la commande.

    Réutiliser le client abonné de run_mqtt_loop() pour publier depuis une autre
    tâche asyncio s'est révélé fragile (l'état interne de paho-mqtt peut se
    désynchroniser, provoquant un rc=4 "not currently connected" alors que la
    connexion est bien active côté abonnement). Une commande d'actionneur reste
    peu fréquente : le coût d'une nouvelle connexion à chaque appel est négligeable.
    """
    payload = _format_command_payload(node, on)
    async with aiomqtt.Client(
        hostname=settings.mqtt_host,
        port=settings.mqtt_port,
        username=settings.mqtt_username,
        password=settings.mqtt_password,
    ) as client:
        await client.publish(node.mqtt.topic, payload=payload, qos=node.mqtt.qos, retain=node.mqtt.retain)
    _actuator_states[node.id] = on


async def run_mqtt_loop() -> None:
    """Boucle de connexion au broker avec reconnexion automatique.

    Seule cette tâche appelle des méthodes sur le client MQTT (subscribe, itération
    des messages) : on évite ainsi tout accès concurrent depuis une autre tâche
    asyncio (ex. une requête FastAPI), qui s'est montré fragile avec aiomqtt/paho.
    """
    global _client
    while True:
        try:
            async with aiomqtt.Client(
                hostname=settings.mqtt_host,
                port=settings.mqtt_port,
                username=settings.mqtt_username,
                password=settings.mqtt_password,
                identifier=settings.mqtt_client_id,
            ) as client:
                _client = client
                _resubscribe_event.clear()
                await _subscribe_all(client)
                logger.info("Connecté au broker MQTT %s:%s", settings.mqtt_host, settings.mqtt_port)

                messages = client.messages.__aiter__()
                while True:
                    if _resubscribe_event.is_set():
                        _resubscribe_event.clear()
                        await _subscribe_all(client)
                    try:
                        message = await asyncio.wait_for(messages.__anext__(), timeout=1.0)
                    except asyncio.TimeoutError:
                        continue
                    payload = message.payload if isinstance(message.payload, bytes) else bytes(message.payload)
                    await _handle_message(str(message.topic), payload)
        except aiomqtt.MqttError as exc:
            logger.warning("Connexion MQTT perdue (%s) — nouvelle tentative dans 5s", exc)
            _client = None
            await asyncio.sleep(5)
