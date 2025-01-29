from exa_py import Exa
from openai import OpenAI
import json
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)

class WebSearchEngine:
    def __init__(self, x_openai_key: str, x_exa_key: str):
        self.client = OpenAI(api_key=x_openai_key)
        self.exa = Exa(api_key=x_exa_key)

    async def search_web(self, query: str) -> List[Dict]:
        response = self.exa.search_and_contents(
            query,
            type="auto", 
            num_results=5,
            text=True,
            use_autoprompt=True,
            highlights=True
        )
        formatted_results = []
        for result in response.results:
            result_dict = {
                "score": result.score,
                "title": result.title,
                "url": result.url,
                "text": result.text,
                "highlights": result.highlights
            }
            formatted_results.append(result_dict)
        return formatted_results

    async def web_needed(self, query: str, context: str, user_defined_web_context: Optional[str] = None):
        messages = [
            {"role": "system", "content": """You are a helpful assistant have access to an advanced web search engine for searching in these catogories: Research papers, Personal pages, 
         Wikipedia, News, LinkedIn profiles, Company home-pages, Financial Reports, GitHub repos, Blogs, Places and things, Legal and policy sources, Government and international 
         organization sources, Events, Jobs. Decide whether the question can be sufficiently answered using the provided context, or does it require a web search to fully answer the question.
         You are not required to answer the question, just decide whether a web search is needed over the provided context.
         
         Your response should be in JSON format:
        {
            "need_web": "boolean (true/false) indicating if a web search is needed",
            "reason": "concise justification for your decision"
        } """},
        {"role": "user", "content": f"Question:\n{query}\n\nContext:\n{context}\n\n{user_defined_web_context}\n\nAnswer in the specified JSON format:"}
        ]
        response = self.client.chat.completions.create(
            model="gpt-4o-mini-2024-07-18",
            messages=messages,
            temperature=0.7,
            response_format={"type": "json_object"}
        )
        response_content = json.loads(response.choices[0].message.content)
        return response_content.get("need_web", False)
    
    async def search_url(self, urls: List[str]) -> List[Dict]:
        response = self.exa.get_contents(urls, text=True, highlights=True)
        formatted_results = []
        for result in response.results:
            result_dict = {
                "score": None,
                "title": result.title,
                "url": result.url,
                "text": result.text,
                "highlights": result.highlights
            }
            formatted_results.append(result_dict)
        return formatted_results
