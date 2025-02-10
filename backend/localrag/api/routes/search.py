from fastapi import APIRouter, HTTPException, Request, Header
from ...core.document_processor import DocumentProcessor
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
        references = query.get('references', [])
        logger.info(f"References: {references}")
        web_results = []
        search_results = []
        
        engine = request.app.state.vector_db
        web_search = WebSearchEngine(x_openai_key, x_exa_key) if with_web or any(ref['type'] == 'web' for ref in references) else None
        processor = DocumentProcessor(x_openai_key)
        query_embedding = await processor.get_embedding(query['query'])
        exclude = []
        web_need = False

        if references:
            for ref in references:
                if ref['type'] == 'web' and web_search:
                    web_result = await web_search.search_url([ref['source']])
                    if web_result:
                        web_results.extend(web_result)
                elif ref['type'] == 'file':
                    file_results = engine.similarity_search(
                        query_embedding=query_embedding,
                        metadata_filter=f'filename == "{ref["source"]}"'
                    )
                    exclude.extend(ref['source'])
                    if file_results:
                        search_results.extend(file_results)


        if not references or len(search_results) < 3:
            additional_results = engine.similarity_search(query_embedding=query_embedding)
            search_results.extend(additional_results)



        context = "\n\n".join([result["content"] for result in search_results])
        user_defined_web_context = "\n\n".join([result["text"] for result in web_results])

        if with_web and not any(ref['type'] == 'web' for ref in references):
            web_need = await web_search.web_needed(query['query'], context, user_defined_web_context)
            if web_need:
                additional_web_results = await web_search.search_web(query['query'])
                web_results.extend(additional_web_results)

        web_ctx = "\n\n".join([result["text"] for result in web_results])
        
        
        
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
        
        
        context = "\n\n".join([result["content"] for result in search_results])
        
        web_ctx = "\n\n".join([result["text"] for result in web_results])

        if query.get('initial', False):
            if web_results:
                 messages = [
                    {"role": "system", "content": """You are a helpful assistant who give credit to the sources you used to answer the question. You have access to some web sources, which you can assume are part of your internal knowledge. 
                    Analyze if the additional context is needed to answer the question. If the question can be answered without addiitonal context (like greetings or general queries), 
                    ignore the context completely.
                    
                    Your response should be in JSON format:
                    {
                        "answer": "your response to the user, answer should be a string/plain text, not dictionary or json format, you should always take advantage of markdown formatting for better readability",
                        "used_web": boolean (true/false) indicating if you used the web context for your answer
                        "used_context": boolean (true/false) indicating if you used the document context for your answer
                        
                    }"""},
                    {"role": "user", "content": f"Web context:\n{web_ctx}\n\nDocument context:\n{context}\n\nQuestion: {query['query']}\n\nAnswer in the specified JSON format:"}
                ]
            else:
                messages = [
                    {"role": "system", "content": """You are a helpful assistant who give credit to the sources you used to answer the question. Analyze if the provided context is needed to answer the question.
                    If the question can be answered without the context (like greetings or general queries), ignore the context completely.
                    
                    Your response should be in JSON format:
                    {
                        "answer": "your response to the user, answer should be a string/plain text, not dictionary or json format, you should always take advantage of markdown formatting for better readability",
                        "used_context": boolean (true/false) indicating if you used the context for your answer
                    }"""},
                    {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {query['query']}\n\nAnswer in the specified JSON format:"}
                ]
        else:
            if web_results:
                messages = [
                    {"role": "system", "content": """You are a helpful assistant who give credit to the sources (not the conversation history) you used to answer the question. You have access to both previous conversation history and some web sources, 
                    which you can assume are part of your internal knowledge. Use the conversation history to maintain continuity in the discussion.
                    Analyze if the additional context is needed to answer the question and indicate this in your response.
                    If the question can be answered without additional context (like greetings or general queries), ignore the context completely.
                    
                    Your response should be in JSON format:
                    {
                        "answer": "your response to the user, answer should be a string/plain text, not dictionary or json format, you should always take advantage of markdown formatting for better readability",
                        "used_web": boolean (true/false) indicating if you used the web context for your answer
                        "used_context": boolean (true/false) indicating if you used the document context for your answer
                    }"""},
                    {"role": "user", "content": f"Conversation history:\n{chat_history}\n\nWeb context:\n{web_ctx}\n\nDocument context:\n{context}\n\nQuestion: {query['query']}\n\nAnswer in the specified JSON format:"}
                ]
            else:
                messages = [
                    {"role": "system", "content": """You are a helpful assistant who give credit to the sources (not the conversation history) you used to answer the question. You have access to both previous conversation history and additional context.
                    Use the conversation history to maintain continuity in the discussion and you can assume this is your knowledge.
                    For the additional context, analyze if it is needed to answer the question and indicate this in your response.
                    
                Your response should be in JSON format:
                {
                    "answer": "your response to the user, answer should be a string/plain text, not dictionary or json format, you should always take advantage of markdown formatting for better readability",
                    "used_context": boolean (true/false) indicating if you used the additional context for your answer (not the conversation history, if you used the conversation history, it should be false)
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
                        "web_sources": web_results if response_content.get("used_web", False) else [],
                        "created_at": datetime.utcnow()
                    }
                ],
                "last_updated": datetime.utcnow()
            }
            logger.info(f"HERE IS THE CHAT before creating: {chat}")
            chat_id = await create_chat(chat)
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
                    "web_sources": web_results if response_content.get("used_web", False) else [],
                    "created_at": datetime.utcnow()
                }
            ]
            await update_chat(chat_id, new_messages)
        else:
            raise HTTPException(status_code=400, detail="Missing chatId for follow-up question")
        
        return {
            "chat_id": str(chat_id),
            "answer": response_content["answer"].strip(),
            "sources": search_results if response_content.get("used_context", False) else [],
            "web_sources": web_results if response_content.get("used_web", False) else []
        }
        
    except Exception as e:
        logger.error(f"Search error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))