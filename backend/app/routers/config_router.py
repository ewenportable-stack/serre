from fastapi import APIRouter, HTTPException

from .. import mqtt_bridge
from ..database import load_config, save_config
from ..schemas import HypervisionConfig

router = APIRouter(prefix="/api/config", tags=["config"])


@router.get("", response_model=HypervisionConfig)
def get_config() -> HypervisionConfig:
    config = load_config()
    if config is None:
        raise HTTPException(status_code=404, detail="Aucune configuration enregistrée.")
    return config


@router.put("", response_model=HypervisionConfig)
async def put_config(config: HypervisionConfig) -> HypervisionConfig:
    saved = save_config(config)
    await mqtt_bridge.resubscribe()
    return saved
