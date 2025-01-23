from fastapi import APIRouter, HTTPException, Request
from ...core.document_processor import DocumentProcessor
from ...config import get_settings
import logging
from datetime import datetime
import json
from ...database.mongodb import create_chat



router = APIRouter()

logger = logging.getLogger(__name__)

@router.post("/search")
async def search_documents(
    request: Request,
    query: dict
):
    try:
        logger.info(f"Received search query: {query}")
        
        engine = request.app.state.vector_db
        processor = DocumentProcessor(get_settings().openai_api_key)
        
        query_embedding = await processor.get_embedding(query["query"])
        search_results = engine.similarity_search(query_embedding, limit=5)
        context = "\n\n".join([result["content"] for result in search_results])
        
        messages = [
            {"role": "system", "content": """You are a helpful assistant. Analyze if the provided context is needed to answer the question.
            If the question can be answered without the context (like greetings or general queries), ignore the context completely.
            
            Your response should be in JSON format:
            {
                "answer": "your response to the user, answer should be a string/plain text, not dictionary or json format",
                "used_context": boolean (true/false) indicating if you used the context to answer
            }"""},
            {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {query['query']}\n\nAnswer in the specified JSON format:"}
        ]
        
        completion = processor.client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages,
            temperature=0.7,
            response_format={ "type": "json_object" }
        )
        
        response_content = json.loads(completion.choices[0].message.content)
        
        # Add logging to debug the response
        logger.info(f"Response content: {response_content}")
        
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
                    "created_at": datetime.utcnow()
                }
            ],
            "last_updated": datetime.utcnow()
        }
        
        chat_id = await create_chat(chat)
        
        # Make sure we're sending the answer
        return {
            "chat_id": str(chat_id),  # Ensure chat_id is a string
            "answer": response_content["answer"].strip(),
            "sources": search_results if response_content.get("used_context", False) else []
        }
        
    except Exception as e:
        logger.error(f"Search error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))