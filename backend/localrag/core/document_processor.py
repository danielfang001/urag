from pathlib import Path
from typing import List, Dict
import pypdf
from docx import Document
from langchain_openai import OpenAIEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from openai import OpenAI
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DocumentProcessor:
    def __init__(self, api_key: str):
        self.client = OpenAI(api_key=api_key)
        logger.info("DocumentProcessor initialized")
        self.embeddings = OpenAIEmbeddings(
            model="text-embedding-3-small",
            openai_api_key=api_key
        )
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
            separators=["\n\n", "\n", " ", ""]
        )
        

    def read_pdf(self, file_path: Path) -> List[Dict]:
        try:
            logger.info(f"Reading PDF file: {file_path}")
            with open(file_path, 'rb') as file:
                pdf = pypdf.PdfReader(file)
                pages = []
                for i, page in enumerate(pdf.pages):
                    text = page.extract_text()
                    if text.strip():  # Only add non-empty pages
                        pages.append({
                            'content': text,
                            'page': i + 1
                        })
                logger.info(f"Successfully read {len(pages)} pages from PDF")
                return pages
        except Exception as e:
            logger.error(f"Error reading PDF: {str(e)}")
            raise

    def read_docx(self, file_path: Path) -> List[Dict]:
        doc = Document(file_path)
        text = '\n'.join(paragraph.text for paragraph in doc.paragraphs)
        return [{'content': text, 'page': 1}]

    def read_txt(self, file_path: Path) -> List[Dict]:
        with open(file_path, 'r', encoding='utf-8') as file:
            return [{'content': file.read(), 'page': 1}]

    def load_document(self, file_path: Path) -> List[Dict]:
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")

        if file_path.suffix.lower() == '.pdf':
            pages = self.read_pdf(file_path)
        elif file_path.suffix.lower() == '.docx':
            pages = self.read_docx(file_path)
        elif file_path.suffix.lower() == '.txt':
            pages = self.read_txt(file_path)
        else:
            raise ValueError(f"Unsupported file type: {file_path.suffix}")

        all_chunks = []
        for page in pages:
            # Split the text into chunks
            # TODO: Add user defined chunk size and overlap
            text_chunks = self.text_splitter.split_text(page['content'])
            
            chunks = [{
                'content': chunk,
                'metadata': {
                    'source': file_path.name,
                    'page': page['page'],
                    'chunk_index': i
                }
            } for i, chunk in enumerate(text_chunks)]
            
            all_chunks.extend(chunks)
        return all_chunks
    
    async def get_embedding(self, text: str) -> List[float]:
        try:
            embedding = await self.embeddings.aembed_query(text)
            logger.info(f"Generated embedding for search query")
            return embedding
        except Exception as e:
            logger.error(f"Error generating embedding: {str(e)}")
            raise

    async def process_and_embed(self, file_path: Path):
        try:
            logger.info(f"Processing file: {file_path}")
            chunks = self.load_document(file_path)
            
            # Extract just the content for embedding
            texts = [chunk['content'] for chunk in chunks]
            
            # Get embeddings
            embeddings = await self.embeddings.aembed_documents(texts)
            
            logger.info(f"Generated {len(embeddings)} embeddings")
            return texts, embeddings
        except Exception as e:
            logger.error(f"Error in process_and_embed: {str(e)}")
            raise

    def _read_file(self, file_path: Path) -> str:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        except UnicodeDecodeError:
            # If UTF-8 fails, try another common encoding
            with open(file_path, 'r', encoding='latin-1') as f:
                return f.read()

    def _split_text(self, text: str, chunk_size: int = 1000) -> list[str]:
        words = text.split()
        chunks = []
        current_chunk = []
        current_size = 0
        
        for word in words:
            current_size += len(word) + 1  # +1 for space
            if current_size > chunk_size:
                chunks.append(' '.join(current_chunk))
                current_chunk = [word]
                current_size = len(word)
            else:
                current_chunk.append(word)
                
        if current_chunk:
            chunks.append(' '.join(current_chunk))
            
        return chunks