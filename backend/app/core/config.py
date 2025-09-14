from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    APP_NAME: str = "Minha primeira API"
    DEBUG: bool = True

    model_config = SettingsConfigDict(
        env_file=".env", extra="ignore", env_file_encoding="utf-8")
    
settings = Settings()