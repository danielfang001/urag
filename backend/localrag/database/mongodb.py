from motor.motor_asyncio import AsyncIOMotorClient
from ..config import get_settings
from bson import ObjectId
from datetime import datetime

settings = get_settings()

class MongoDB:
    client: AsyncIOMotorClient = None
    db = None

    async def connect_to_mongo(self):
        self.client = AsyncIOMotorClient(settings.mongodb_url)
        self.db = self.client[settings.mongodb_db_name]
        
        collection = await get_chat_collection()
        await collection.create_index([
            ("title", "text"),
            ("messages.content", "text")
        ])

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

async def get_chats():
    collection = await get_chat_collection()
    cursor = collection.find().sort("last_updated", -1)
    return await cursor.to_list(length=None)

async def update_chat(chat_id: str, new_messages: list):
    collection = await get_chat_collection()
    await collection.update_one(
        {"_id": ObjectId(chat_id)},
        {
            "$push": {"messages": {"$each": new_messages}},
            "$set": {"last_updated": datetime.utcnow()}
        }
    )

async def delete_chat(chat_id: str):
    collection = await get_chat_collection()
    await collection.delete_one({"_id": ObjectId(chat_id)})

async def search_chats(query: str, limit: int = 10):
    collection = await get_chat_collection()
    
    pipeline = [
        {
            "$match": {
                "$or": [
                    {"title": {"$regex": query, "$options": "i"}},
                    {"messages.content": {"$regex": query, "$options": "i"}}
                ]
            }
        },
        {
            "$addFields": {
                "relevantMessages": {
                    "$filter": {
                        "input": "$messages",
                        "as": "message",
                        "cond": {
                            "$regexMatch": {
                                "input": "$$message.content",
                                "regex": query,
                                "options": "i"
                            }
                        }
                    }
                }
            }
        },
        {
            "$project": {
                "_id": 1,
                "title": 1,
                "last_updated": 1,
                "matchedMessages": {
                    "$slice": ["$relevantMessages", 2]  
                },
                "messageCount": {"$size": "$messages"},
                "matchCount": {"$size": "$relevantMessages"}
            }
        },
        {"$sort": {"last_updated": -1}},
        {"$limit": limit}
    ]
    
    cursor = collection.aggregate(pipeline)
    results = await cursor.to_list(length=None)
    
    # Format results
    formatted_results = []
    for result in results:
        formatted_result = {
            "id": str(result["_id"]),
            "title": result["title"],
            "last_updated": result["last_updated"],
            "total_messages": result["messageCount"],
            "match_count": result["matchCount"],
            "preview_messages": [
                {
                    "content": msg["content"],
                    "created_at": msg["created_at"]
                }
                for msg in result.get("matchedMessages", [])
            ]
        }
        formatted_results.append(formatted_result)
    
    return formatted_results 