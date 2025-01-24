from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from functools import lru_cache

class Settings(BaseSettings):

    milvus_host: str = "localhost"
    milvus_port: int = 19530
    milvus_collection: str = "documents"

    api_port: int = 8000
    cors_origins: list[str] = ["http://localhost:3000"]

    # MongoDB settings
    mongodb_url: str = "mongodb://admin:password@localhost:27017"
    mongodb_db_name: str = "localrag"

    milvus_uri: str = "localhost:19530"

    model_config = ConfigDict(env_file=".env", case_sensitive=False, extra="ignore")

@lru_cache()
def get_settings():
    return Settings()
