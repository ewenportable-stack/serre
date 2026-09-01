from fastapi import APIRouter, HTTPException

from .. import mqtt_bridge
from ..database import load_config
from ..influx_client import query_history
from ..schemas import ActuatorCommand, DeviceNode, SensorReadingOut

router = APIRouter(prefix="/api/live", tags=["live"])


def _find_node(node_id: str) -> DeviceNode:
    config = load_config()
    if config is None:
        raise HTTPException(status_code=404, detail="Aucune configuration enregistrée.")
    for node in config.nodes:
        if node.id == node_id:
            return node
    raise HTTPException(status_code=404, detail=f"Nœud introuvable: {node_id}")


@router.get("/sensors/{node_id}/latest")
def get_latest(node_id: str) -> dict:
    node = _find_node(node_id)
    if node.category != "sensor":
        raise HTTPException(status_code=400, detail="Ce nœud n'est pas un capteur.")
    reading = mqtt_bridge.get_latest_reading(node_id)
    return reading or {"t": None, "value": None, "value2": None}


@router.get("/sensors/{node_id}/history", response_model=list[SensorReadingOut])
def get_history(node_id: str, minutes: int = 60) -> list[SensorReadingOut]:
    node = _find_node(node_id)
    if node.category != "sensor":
        raise HTTPException(status_code=400, detail="Ce nœud n'est pas un capteur.")
    return query_history(node_id, minutes=minutes)


@router.get("/actuators/{node_id}/state")
def get_actuator_state(node_id: str) -> dict:
    node = _find_node(node_id)
    if node.category != "actuator":
        raise HTTPException(status_code=400, detail="Ce nœud n'est pas un actionneur.")
    return {"on": mqtt_bridge.get_actuator_state(node_id)}


@router.post("/actuators/{node_id}/command")
async def send_command(node_id: str, command: ActuatorCommand) -> dict:
    node = _find_node(node_id)
    if node.category != "actuator":
        raise HTTPException(status_code=400, detail="Ce nœud n'est pas un actionneur.")
    await mqtt_bridge.publish_actuator_command(node, command.on)
    return {"on": command.on}
