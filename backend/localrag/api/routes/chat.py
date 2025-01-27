from fastapi import APIRouter, HTTPException, Query
from ...models.chat import Chat, Message
from ...database.mongodb import (
    create_chat,
    get_chat,
    get_chats,
    update_chat,
    delete_chat,
    search_chats,
    get_chat_collection
)
import logging
from bson import ObjectId
import json

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/")
async def create_new_chat(title: str):
    chat = Chat(title=title)
    chat_id = await create_chat(chat.dict())
    return {"id": chat_id}

@router.get("/")
async def get_chat_history():
    logger.info("Starting get_chat_history endpoint")
    try:
        raw_chats = await get_chats()
        chats = []
        for chat_doc in raw_chats:
            try:
                chat_doc['id'] = str(chat_doc.pop('_id'))
                if 'messages' in chat_doc:
                    for msg in chat_doc['messages']:
                        if isinstance(msg.get('content'), dict):
                            msg['content'] = json.dumps(msg['content'])
                
                chat = Chat(**chat_doc)
                chats.append(chat.dict())
                
            except Exception as e:
                logger.error(f"Error processing chat document: {str(e)}")
                logger.debug(f"Problematic chat doc: {chat_doc}")
                continue
        return chats
    except Exception as e:
        logger.error(f"Error in get_chat_history: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/search")
async def search_chat_history(
    q: str = Query(..., description="Search query"),
    limit: int = Query(10, ge=1, le=50, description="Maximum number of results")
):
    results = await search_chats(q, limit)
    return results

@router.get("/{chat_id}")
async def get_chat_by_id(chat_id: str):
    try:
        chat_doc = await get_chat(chat_id)
        if not chat_doc:
            raise HTTPException(status_code=404, detail="Chat not found")

        chat_doc['id'] = str(chat_doc.pop('_id'))

        if 'messages' in chat_doc:
            for msg in chat_doc['messages']:
                if isinstance(msg.get('content'), dict):
                    msg['content'] = json.dumps(msg['content'])
        
        chat = Chat(**chat_doc)
        return chat.dict()
        
    except Exception as e:
        logger.error(f"Error getting chat {chat_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{chat_id}/messages")
async def add_message(chat_id: str, message: Message):
    chat = await get_chat(chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    chat["messages"].append(message.dict())
    chat["last_updated"] = message.created_at
    
    await update_chat(chat_id, {
        "messages": chat["messages"],
        "last_updated": chat["last_updated"]
    })
    return {"success": True}

@router.delete("/all")
async def delete_all_chats():
    try:
        logger.info("Deleting all chats")
        collection = await get_chat_collection()
        await collection.delete_many({})
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 
    


@router.delete("/{chat_id}")
async def delete_chat_by_id(chat_id: str):
    try:
        await delete_chat(chat_id)
        return {"success": True}
    except Exception as e:
        logger.error(f"Error deleting chat: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))



