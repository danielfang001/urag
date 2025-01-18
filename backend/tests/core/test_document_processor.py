import pytest
from pathlib import Path
from localrag.core.document_processor import DocumentProcessor
import os
from dotenv import load_dotenv

load_dotenv()

@pytest.fixture
def processor():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        pytest.skip("OPENAI_API_KEY is not set in the environment variables")
    return DocumentProcessor(api_key)

def test_text_splitter_configuration(processor):
    assert processor.text_splitter._chunk_size == 1000
    assert processor.text_splitter._chunk_overlap == 200

@pytest.mark.asyncio
async def test_process_and_embed(processor, tmp_path):
    # Create a test file
    test_file = tmp_path / "test.txt"
    test_file.write_text("This is a test document.")
    
    chunks, embeddings = await processor.process_and_embed(test_file)
    
    assert len(chunks) > 0
    assert len(embeddings) == len(chunks)
    assert all(isinstance(e, list) for e in embeddings)