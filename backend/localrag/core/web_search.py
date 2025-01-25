from exa_py import Exa
import os
from openai import OpenAI



exa = Exa(os.getenv("EXA_API_KEY"))

def search_web(query: str):
    return exa.search_and_content(query, type="auto", num_results=5, text=True)

def web_or_rag(query: str, x_openai_key: str):
    messages = [
        {"role": "system", "content": """You are a helpful assistant who can choose between using web search or RAG to answer the user's question. 
         You should always use web search if the question or its presumed answer is related to the web, specifically in these catogories: Research papers, Personal pages, 
         Wikipedia, News, LinkedIn profiles, Company home-pages, Financial Reports, GitHub repos, Blogs, Places and things, Legal and policy sources, 
         Government and international organization sources, Events, Jobs. If the question is not related to the web, and it requires a niche knowledge base, you should use RAG.
         
         Your response should be in JSON format:
        {
            "answer": "search type: web/rag",
            "reason": "concise justification for the search type"
        } """},
        {"role": "user", "content": f"Question: {query}\n\nAnswer in the specified JSON format:"}
    ]
    client = OpenAI(api_key=x_openai_key)
    response = client.chat.completions.create(
        model="gpt-4o-mini-2024-07-18",
        messages=messages,
        response_format={"type": "json_object"}
    )
    return response.choices[0].message.content
