from motor.motor_asyncio import AsyncIOMotorClient
from ..config import get_settings
from bson import ObjectId

settings = get_settings()

class MongoDB:
    client: AsyncIOMotorClient = None
    db = None

    async def connect_to_mongo(self):
        self.client = AsyncIOMotorClient(settings.mongodb_url)
        self.db = self.client[settings.mongodb_db_name]

    async def close_mongo_connection(self):
        if self.client:
            self.client.close()

db = MongoDB()

async def get_chat_collection():
    return db.db.chats

async def create_chat(chat_data: dict):
    collection = await get_chat_collection()
    result = await collection.insert_one(chat_data)
    return str(result.inserted_id)

async def get_chat(chat_id: str):
    collection = await get_chat_collection()
    return await collection.find_one({"_id": ObjectId(chat_id)})

async def get_user_chats(user_id: str):
    collection = await get_chat_collection()
    cursor = collection.find({"user_id": user_id}).sort("last_updated", -1)
    return await cursor.to_list(length=None)

async def update_chat(chat_id: str, update_data: dict):
    collection = await get_chat_collection()
    await collection.update_one(
        {"_id": ObjectId(chat_id)},
        {"$set": update_data}
    ) 