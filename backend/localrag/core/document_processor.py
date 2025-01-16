from pathlib import Path
from typing import List, Dict
import pypdf
from docx import Document
from langchain_openai import OpenAIEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter

class DocumentProcessor:
    def __init__(self, openai_api_key: str):
        self.embeddings = OpenAIEmbeddings(
            model="text-embedding-3-small",
            openai_api_key=openai_api_key
        )
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
            separators=["\n\n", "\n", " ", ""]
        )

    def read_pdf(self, file_path: Path) -> List[Dict]:
        with open(file_path, 'rb') as file:
            pdf = pypdf.PdfReader(file)
            return [{
                'content': page.extract_text(),
                'page': i + 1
            } for i, page in enumerate(pdf.pages)]

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

    async def process_and_embed(self, file_path: Path) -> tuple[List[Dict], List[List[float]]]:
        chunks = self.load_document(file_path)
        texts = [chunk['content'] for chunk in chunks]
        embeddings = await self.embeddings.aembed_documents(texts)
        return chunks, embeddings