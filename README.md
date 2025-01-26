# URAG - Personal Information Search and Query Engine

URAG is a desktop application that enables users to create their personal document knowledge base with semantic search capabilities. Users can add documents, search through them semantically, and ask questions about their content using natural language.

## Features

- 🔒 **Fully Local Operation**: All data stays on your machine
- 💬 **Natural Language Queries**: Ask questions about your documents
- 🔑 **BYO API Key**: Use your own API keys
- 📊 **Vector Database**: Efficient similarity search using Milvus
- 🔍 **Web Enhanced**: Use web search results to render your knowledge base
- 🎯 **Source Citations**: Get references to specific documents and websites
- 📓 **Easy Use**: Runs like Jupyter Notebook

## Tech Stack

### Backend
- **FastAPI**: Modern, fast web framework for building APIs
- **Python 3.12+**: Core application logic
- **LangChain**: Document processing
- **Milvus**: Vector database for semantic search
- **Exa.ai**: Web search engine
- **OpenAI API**: For embeddings and query processing
- **PyPDF2**: PDF processing
- **python-docx**: DOCX processing

### Document Processing Pipeline
- Text extraction and chunking
- Embedding generation using embedding model
- Vector storage and retrieval using Milvus
- Web search rendering when automatically decided necessary

## Installation

### Prerequisites
- Python 3.12 or higher
- Docker (for running Milvus)
- Poetry (for dependency management)

### Setup

1. Clone the repository