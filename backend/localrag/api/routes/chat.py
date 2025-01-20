from fastapi import APIRouter, HTTPException, Query
from ...models.chat import Chat, Message
from ...database.mongodb import (
    create_chat,
    get_chat,
    get_chats,
    update_chat,
    delete_chat,
    search_chats
)

router = APIRouter()

@router.post("/")
async def create_new_chat(title: str):
    chat = Chat(title=title)
    chat_id = await create_chat(chat.dict())
    return {"id": chat_id}

@router.get("/")
async def get_chat_history():
    chats = await get_chats()
    return chats

@router.get("/{chat_id}")
async def get_chat_by_id(chat_id: str):
    chat = await get_chat(chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    return chat

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

@router.delete("/{chat_id}")
async def delete_chat(chat_id: str):
    chat = await get_chat(chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    await delete_chat(chat_id)
    return {"success": True}

@router.get("/search/")
async def search_chat_history(
    q: str = Query(..., description="Search query"),
    limit: int = Query(10, ge=1, le=50, description="Maximum number of results")
):
    """
    Search through chat history by title and message content.
    Returns matching chats with relevant message previews.
    """
    results = await search_chats(q, limit)
    return results 