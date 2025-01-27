from fastapi import APIRouter, HTTPException, Request, Header
from ...core.document_processor import DocumentProcessor
from ...config import get_settings
import logging
from datetime import datetime
import json
from ...database.mongodb import create_chat, get_chat, update_chat
from typing import Optional
from ...core.web_search import WebSearchEngine


router = APIRouter()

logger = logging.getLogger(__name__)


@router.post("/search")
async def search_documents(
    request: Request,
    query: dict,
    x_openai_key: Optional[str] = Header(None, alias="X-OpenAI-Key"),
    x_openai_model: Optional[str] = Header(None, alias="X-OpenAI-Model"),
    x_exa_key: Optional[str] = Header(None, alias="X-Exa-Key"),
    with_web: Optional[bool] = Header(None, alias="X-Enable-Web-Search")
):
    try:
        logger.info(f"Received search query: {query}, using model: {x_openai_model}")
        
        engine = request.app.state.vector_db
        processor = DocumentProcessor(x_openai_key)
        web_engine = WebSearchEngine(x_openai_key, x_exa_key)
        
        chat_history = ""
        chat_id = None
        if not query.get('initial', False) and 'chatId' in query and query['chatId']:
            try:
                chat = await get_chat(query['chatId'])
                chat_id = query['chatId']
                for msg in chat["messages"]:
                    role = "User" if msg["role"] == "user" else "Assistant"
                    chat_history += f"{role}: {msg['content']}\n"
                chat_history = f"\nPrevious conversation:\n{chat_history}\n"
            except Exception as e:
                logger.error(f"Error getting chat history: {e}")
                pass
        
        query_embedding = await processor.get_embedding(query["query"])
        search_results = engine.similarity_search(query_embedding, limit=5)
        context = "\n\n".join([result["content"] for result in search_results])
        
        web_results = []
        web_need = False
        if with_web:
            web_need = web_engine.web_needed(query["query"], context)
            logger.info(f"web_need: {web_need}")
            if web_need:
                web_results = web_engine.search_web(query["query"])
                logger.info(f"web_results: {web_results}")
                web_ctx = "\n\n".join([result["text"] for result in web_results])

        if query.get('initial', False):
            if web_need:
                 messages = [
                    {"role": "system", "content": """You are a helpful assistant. You have access to some web sources, which you can assume are part of your internal knowledge. 
                    Analyze if the additional context is needed to answer the question. If the question can be answered without addiitonal context (like greetings or general queries), 
                    ignore the context completely.
                    
                    Your response should be in JSON format:
                    {
                        "answer": "your response to the user, answer should be a string/plain text, not dictionary or json format, you should always take advantage of markdown formatting for better readability",
                        "used_context": boolean (true/false) indicating if you used the additional context,
                    }"""},
                    {"role": "user", "content": f"Web context:\n{web_ctx}\n\nAdditional context:\n{context}\n\nQuestion: {query['query']}\n\nAnswer in the specified JSON format:"}
                ]
            else:
                messages = [
                    {"role": "system", "content": """You are a helpful assistant. Analyze if the provided context is needed to answer the question.
                    If the question can be answered without the context (like greetings or general queries), ignore the context completely.
                    
                    Your response should be in JSON format:
                    {
                        "answer": "your response to the user, answer should be a string/plain text, not dictionary or json format, you should always take advantage of markdown formatting for better readability",
                        "used_context": boolean (true/false) indicating if you used the context
                    }"""},
                    {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {query['query']}\n\nAnswer in the specified JSON format:"}
                ]
        else:
            if web_need:
                messages = [
                    {"role": "system", "content": """You are a helpful assistant. You have access to both previous conversation history and some web sources, 
                    which you can assume are part of your internal knowledge. Use the conversation history to maintain continuity in the discussion.
                    Analyze if the additional context is needed to answer the question and indicate this in your response.
                    If the question can be answered without additional context (like greetings or general queries), ignore the context completely.
                    
                    Your response should be in JSON format:
                    {
                        "answer": "your response to the user, answer should be a string/plain text, not dictionary or json format, you should always take advantage of markdown formatting for better readability",
                        "used_context": boolean (true/false) indicating if you used the additional context,
                    }"""},
                    {"role": "user", "content": f"Conversation history:\n{chat_history}\n\nWeb context:\n{web_ctx}\n\nAdditional context:\n{context}\n\nQuestion: {query['query']}\n\nAnswer in the specified JSON format:"}
                ]
            else:
                messages = [
                    {"role": "system", "content": """You are a helpful assistant. You have access to both previous conversation history and additional context.
                    Use the conversation history to maintain continuity in the discussion and you can assume this is your knowledge.
                    For the additional context, analyze if it is needed to answer the question and indicate this in your response.
                    
                Your response should be in JSON format:
                {
                    "answer": "your response to the user, answer should be a string/plain text, not dictionary or json format, you should always take advantage of markdown formatting for better readability",
                    "used_context": boolean (true/false) indicating if you used the additional context (not the conversation history, if you used the conversation history, it should be false)
                }"""},
                {"role": "user", "content": f"Conversation history:\n{chat_history}\n\nAdditional context:\n{context}\n\nQuestion: {query['query']}\n\nAnswer in the specified JSON format:"}
            ]
        
        completion = processor.client.chat.completions.create(
            model=x_openai_model,
            messages=messages,
            temperature=0.7,
            response_format={ "type": "json_object" }
        )
        
        response_content = json.loads(completion.choices[0].message.content)
        
        logger.info(f"Response content: {response_content}")
        
        # For initial queries, create new chat
        if query.get('initial', False):
            chat = {
                "title": query["query"][:50] + "...",
                "messages": [
                    {
                        "role": "user",
                        "content": query["query"],
                        "created_at": datetime.utcnow()
                    },
                    {
                        "role": "assistant",
                        "content": response_content["answer"],
                        "sources": search_results if response_content.get("used_context", False) else [],
                        "web_sources": web_results if web_need else [],
                        "created_at": datetime.utcnow()
                    }
                ],
                "last_updated": datetime.utcnow()
            }
            logger.info(f"HERE IS THE CHAT before creating: {chat}")
            chat_id = await create_chat(chat)
        # For follow-up questions, update existing chat
        elif 'chatId' in query and query['chatId']:
            chat_id = query['chatId']
            new_messages = [
                {
                    "role": "user",
                    "content": query["query"],
                    "created_at": datetime.utcnow()
                },
                {
                    "role": "assistant",
                    "content": response_content["answer"],
                    "sources": search_results if response_content.get("used_context", False) else [],
                    "web_sources": web_results if web_need else [],
                    "created_at": datetime.utcnow()
                }
            ]
            await update_chat(chat_id, new_messages)
        else:
            raise HTTPException(status_code=400, detail="Missing chatId for follow-up question")
        
        logger.info(f"web_need: {web_need}")
        logger.info(f"web_results: {web_results}")
        
        return {
            "chat_id": str(chat_id),
            "answer": response_content["answer"].strip(),
            "sources": search_results if response_content.get("used_context", False) else [],
            "web_sources": web_results if web_need else []
        }
        
    except Exception as e:
        logger.error(f"Search error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))