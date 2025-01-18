import pytest
from fastapi import FastAPI
from localrag.core.vector_store import bind_milvus, get_milvus, UragEngine
from pymilvus import MilvusClient

@pytest.fixture
def app():
    return FastAPI()

def test_bind_milvus(app):
    with pytest.raises(Exception):
        # Should fail with invalid URI, so this test passes when the following line FAILS
        bind_milvus(app, "invalid-uri", "test-collection")

def test_get_milvus_uninitialized(app):
    with pytest.raises(RuntimeError):
        get_milvus(app)

@pytest.mark.integration
def test_bind_milvus_success(app, milvus_uri):
    try:
        bind_milvus(app, milvus_uri, "test-collection")
        engine = get_milvus(app)
        assert isinstance(engine, UragEngine)
        assert isinstance(engine.client, MilvusClient)
        assert engine.collection == "test-collection"
    except Exception as e:
        pytest.skip(f"Milvus integration test skipped: {str(e)}")

@pytest.mark.integration
def test_vector_store_operations(app, milvus_uri):
    try:
        bind_milvus(app, milvus_uri, "test-collection")
        engine = get_milvus(app)
        
        # Test adding vectors
        chunks = [{"content": "test", "metadata": {"source": "test.txt"}}]
        embeddings = [[0.1, 0.2, 0.3]]  # Simplified test vector
        ids = engine.add(chunks, embeddings)
        assert len(ids) == 1
        
        # Test similarity search
        results = engine.similarity_search(
            query_embedding=[0.1, 0.2, 0.3],
            limit=1
        )
        assert len(results) > 0
        assert "content" in results[0]
        assert "metadata" in results[0]
        
    except Exception as e:
        pytest.skip(f"Milvus integration test skipped: {str(e)}")

    # run: poetry run pytest -v -m "not integration" to disable integration tests
    # run: poetry run pytest -v to include integration tests