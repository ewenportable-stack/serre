from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # SQLite (configuration de la serre : zones, nœuds, portes, plantes, tuyaux)
    database_path: str = "serre.db"

    # MQTT (broker Mosquitto)
    mqtt_host: str = "localhost"
    mqtt_port: int = 1883
    mqtt_username: str | None = None
    mqtt_password: str | None = None
    mqtt_client_id: str = "serre-backend"

    # InfluxDB (historique des mesures)
    influx_url: str = "http://localhost:8086"
    influx_token: str = ""
    influx_org: str = "serre"
    influx_bucket: str = "serre"

    # CORS (origines autorisées à appeler l'API depuis le navigateur)
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:4173"]


settings = Settings()
