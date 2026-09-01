"""
Modèles Pydantic miroir exact de src/types/hypervision.ts (frontend).
Toute évolution du schéma JSON exporté par l'éditeur doit être répercutée ici.
"""

from typing import Literal, Optional

from pydantic import BaseModel, Field

DeviceCategory = Literal["sensor", "actuator"]

DeviceType = Literal[
    "sensor_soil_moisture",
    "sensor_ds18b20",
    "sensor_light",
    "sensor_temp_humidity",
    "actuator_relay_heating",
    "actuator_valve_watering",
]

MqttPayloadType = Literal["float", "int", "bool", "json", "string"]

ZoneKind = Literal["culture_bed", "walkway", "technical_area"]

Wall = Literal["north", "south", "east", "west"]

PlantSpecies = Literal[
    "tomato",
    "pepper",
    "eggplant",
    "cucumber",
    "zucchini",
    "potato",
    "bean",
]


class MqttConfig(BaseModel):
    topic: str
    qos: Literal[0, 1, 2]
    retain: bool
    payloadType: MqttPayloadType


class Point(BaseModel):
    x: float
    y: float


class Zone(BaseModel):
    id: str
    name: str
    kind: ZoneKind
    x: float
    y: float
    width: float
    height: float
    rotation: float
    color: str
    notes: Optional[str] = None


class DeviceNode(BaseModel):
    id: str
    type: DeviceType
    category: DeviceCategory
    label: str
    x: float
    y: float
    rotation: float
    zoneId: Optional[str] = None
    mqtt: MqttConfig
    deviceId: Optional[str] = None
    size: float


class GridSettings(BaseModel):
    cellSize: float
    columns: int
    rows: int
    snapToGrid: bool
    metersPerCell: float


class GreenhouseMeta(BaseModel):
    name: str
    grid: GridSettings


class Door(BaseModel):
    id: str
    wall: Wall
    offsetMeters: float
    widthMeters: float
    label: Optional[str] = None


class Plant(BaseModel):
    id: str
    species: PlantSpecies
    variety: Optional[str] = None
    x: float
    y: float
    zoneId: Optional[str] = None
    plantedAt: Optional[str] = None
    notes: Optional[str] = None


class Pipe(BaseModel):
    id: str
    points: list[Point]
    diameterMm: Optional[float] = None
    label: Optional[str] = None
    notes: Optional[str] = None


class HypervisionConfig(BaseModel):
    version: Literal[1] = 1
    greenhouse: GreenhouseMeta
    zones: list[Zone] = Field(default_factory=list)
    nodes: list[DeviceNode] = Field(default_factory=list)
    doors: list[Door] = Field(default_factory=list)
    plants: list[Plant] = Field(default_factory=list)
    pipes: list[Pipe] = Field(default_factory=list)


class ActuatorCommand(BaseModel):
    """Commande envoyée depuis la Vue live pour piloter un actionneur."""

    on: bool


class SensorReadingOut(BaseModel):
    t: str
    """Horodatage ISO 8601."""
    value: float
    value2: Optional[float] = None
