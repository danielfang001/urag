from pymilvus import MilvusClient
from pymilvus import DataType
from typing import List, Dict
from pymilvus.client.types import LoadState

from fastapi import FastAPI
import json
import logging

logger = logging.getLogger(__name__)

class UragEngine:
    def __init__(self, client: MilvusClient, collection: str) -> None:
        self._client = client
        self._collection = collection
        try:
            collections = client.list_collections()
            if self.collection in collections:
                client.load_collection(collection_name=collection)
            else:
                create_personal_collection(client, collection)
        except Exception as e:
            logger.error(f"Error in UragEngine: {e}")
            raise

    @property
    def client(self) -> MilvusClient:
        return self._client

    @property
    def collection(self) -> str:
        return self._collection
    
    def add(self, filenames: List[str], texts: List[str], embeddings: List[List[float]], metadata: List[Dict]) -> List[int]:
        if not texts or not embeddings:
            return []
        
        ret = []
        for i in range(len(texts)):
            logger.info(f"current loading text: {texts[i]}")
            ret.append(self.client.insert(collection_name=self.collection, data={
                'filename': filenames[i],
                'content': texts[i],
                'embedding': embeddings[i],
                'metadata': json.dumps(metadata[i])
            })['ids'][0])
        return ret
    
    def similarity_search(self, query_embedding: List[float], limit: int = 5, metadata_filter: str = '', similarity_threshold: float = 0.3) -> List[Dict]:
        if not query_embedding:
            logger.warning("Empty query embedding received")
            return []
        
        try:
            state = self.client.get_load_state(self.collection)
            if not state or "state" not in state or state["state"] != LoadState.Loaded:
                logger.info(f"Loading collection: {self.collection}")
                self.client.load_collection(self.collection)

            logger.info(f"Searching with parameters: limit={limit}, threshold={similarity_threshold}")
            res = self.client.search(
                collection_name=self.collection,
                data=[query_embedding],
                filter=metadata_filter,
                limit=limit,
                output_fields=['filename', 'content'],
                search_params={
                    'metric_type': 'L2',
                    'params': {
                        'nprobe': 10,
                        'ef': 64,
                    }
                }
            )
            
            hits = []
            logger.info(f"Found {len(res[0])} results")
            
            for hit in res[0]:
                filename = hit['entity'].get('filename', '')
                content = hit['entity'].get('content', '')
                score = hit['distance']
                
                logger.info(f"Match found - File: {filename}, Score: {score}")
                logger.info(f"Content: {content[:200]}...")
                
                hits.append({
                    'content': content,
                    'score': score,
                    'filename': filename
                })
            
            hits.sort(key=lambda x: x['score'])
            return hits

        except Exception as e:
            logger.error(f"Error in similarity search: {str(e)}")
            raise
    
    def delete_by_id(self, id: int) -> bool:
        if not id:
            return False
        ret = self.client.delete(collection_name=self.collection, filter=f'id == {id}')
        return True if ret else False
    
    def delete_by_filename(self, filename: str) -> bool:
        if not filename:
            return False
        ret = self.client.delete(collection_name=self.collection, filter=f'filename == "{filename}"')
        return True if ret else False
    
def create_personal_collection(client: MilvusClient, collection_name: str):
    try:
        logger.info("Starting collection creation...")
        
        logger.info("Creating schema...")
        schema = MilvusClient.create_schema(auto_id=True, enable_dynamic_field=True)
        schema.add_field(field_name='id', datatype=DataType.INT64, is_primary=True)
        schema.add_field(field_name='filename', datatype=DataType.VARCHAR, max_length=512)
        schema.add_field(field_name='content', datatype=DataType.VARCHAR, max_length=65535)
        schema.add_field(field_name='embedding', datatype=DataType.FLOAT_VECTOR, dim=1536)
        schema.add_field(field_name='metadata', datatype=DataType.VARCHAR, max_length=512)
        logger.info("Schema created successfully")

        logger.info("Preparing index parameters...")
        index_params = MilvusClient.prepare_index_params()
        index_params.add_index(field_name='embedding', index_type='IVF_FLAT', metric_type='L2', nlist=1024)
        # index_params.add_index(field_name='filename')
        # index_params.add_index(field_name='metadata')
        logger.info("Index parameters prepared")

        logger.info(f"Creating collection '{collection_name}'...")
        client.create_collection(
            collection_name=collection_name, 
            schema=schema, 
            index_params=index_params
        )
        logger.info(f"Done creating collection: {collection_name}")
        
    except Exception as e:
        logger.error(f"Failed to create collection: {str(e)}")
        raise

def bind_milvus(app: FastAPI, uri: str, collection_name: str) -> UragEngine:
    try:
        client = MilvusClient(uri=uri)
        engine = UragEngine(client, collection_name)
        app.state.vector_db = engine
        return engine
    except Exception as e:
        raise Exception(f"Failed to bind Milvus: {e}")
    
def get_milvus(app: FastAPI) -> UragEngine:
    if not hasattr(app.state, "vector_db"):
        raise RuntimeError("Milvus not initialized. Bind Milvus first. app may not be initialized correctly")
    return app.state.vector_db

