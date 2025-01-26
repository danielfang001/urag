from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from bson import ObjectId

class Source(BaseModel):
    content: str # source content
    score: float = Field(default=1.0)
    filename: str

class WebSource(BaseModel):
    score: Optional[float] = Field(default=1.0)
    title: str
    url: str
    text: str
    highlights: List[str] = Field(default_factory=list)

class Message(BaseModel):
    role: str
    content: str # response content
    sources: List[Source] = Field(default_factory=list)
    web_sources: List[WebSource] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Chat(BaseModel):
    id: str = Field(default_factory=lambda: str(ObjectId()))
    title: str
    messages: List[Message] = Field(default_factory=list)
    last_updated: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_encoders = {
            ObjectId: str
        } 