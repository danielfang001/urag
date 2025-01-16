# URAG - Personal Information Search and Query Engine

URAG is a desktop application that enables users to create their personal document knowledge base with semantic search capabilities. Users can add documents, search through them semantically, and ask questions about their content using natural language.

## Features

- 🔒 **Fully Local Operation**: All data stays on your machine
- 📄 **Multi-Format Support**: Import PDF, TXT, DOCX, and Markdown files
- 🔍 **Semantic Search**: Find documents based on meaning, not just keywords
- 💬 **Natural Language Queries**: Ask questions about your documents
- 🔑 **BYO API Key**: Use your own OpenAI API key
- 📊 **Vector Database**: Efficient similarity search using Milvus
- 🎯 **Source Citations**: Get references to specific documents and passages

## Tech Stack

### Backend
- **FastAPI**: Modern, fast web framework for building APIs
- **Python 3.12+**: Core application logic
- **LangChain**: Document processing and LLM integration
- **Milvus**: Vector database for semantic search
- **OpenAI API**: For embeddings and query processing
- **PyPDF2**: PDF processing
- **python-docx**: DOCX processing

### Document Processing Pipeline
- Text extraction and chunking
- Embedding generation using OpenAI's text-embedding-3-small model
- Vector storage and retrieval using Milvus

## Installation

### Prerequisites
- Python 3.12 or higher
- Docker (for running Milvus)
- Poetry (for dependency management)

### Setup

1. Clone the repository