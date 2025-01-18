from pymilvus import MilvusClient
from pymilvus import DataType
from typing import List, Dict
from pymilvus.client.types import LoadState

from fastapi import FastAPI
import json

class UragEngine:
    def __init__(self, client: MilvusClient, collection: str) -> None:
        self._client = client
        self._collection = collection
        try:
            client.load_collection(collection_name=self._collection)
        except Exception:
            create_personal_collection(client, collection)

    @property
    def client(self) -> MilvusClient:
        return self._client

    @property
    def collection(self) -> str:
        return self._collection
    
    def add(self, chunks: List[Dict], embeddings: List[List[float]]) -> List[int]:
        if not chunks or not embeddings:
            return []
        
        ret = []
        for i in range(len(chunks)):
            ret.append(self.client.insert(collection_name=self.collection, data={
                'content': chunks[i]['content'],
                'embedding': embeddings[i],
                'metadata': json.dumps(chunks[i]['metadata'])
            })['ids'][0])
        return ret
    
    def similarity_search(self, query_embedding: List[float], limit: int = 5, metadata_filter: str = '', similarity_threshold: float = 0.3) -> List[Dict]:
        if not query_embedding:
            return []
        state = self.client.get_load_state(self.collection)
        if not state or "state" not in state or state["state"] != LoadState.Loaded:
            self.client.load_collection(self.collection)
        res = self.client.search(
            collection_name=self.collection,
            data=[query_embedding],
            filter=metadata_filter,
            limit=limit,
            output_fields=['content', 'metadata'],
            search_params={'params': {'range_filter': 0.0, 'radius': similarity_threshold}}
        )
        hits = []
        for hit in res[0]:
            metadata = json.loads(hit.entity.get('metadata'))
            hits.append({
                'content': hit.entity.get('content'),
                'metadata': metadata,
                'score': hit.distance
            })
        return hits
    
    def delete_by_id(self, id: int) -> bool:
        if not id:
            return False
        ret = self.client.delete(collection_name=self.collection, filter=f'id == {id}')
        return True if ret else False
    
def create_personal_collection(client: MilvusClient, collection_name: str):
    schema = MilvusClient.create_schema(auto_id=True, enable_dynamic_field=True)
    schema.add_field(field_name='id', datatype=DataType.INT64, is_primary=True)
    schema.add_field(field_name='content', datatype=DataType.VARCHAR, max_length=65535)
    schema.add_field(field_name='embedding', datatype=DataType.FLOAT_VECTOR, dim=1536)
    schema.add_field(field_name='metadata', datatype=DataType.JSON)

    index_params = MilvusClient.prepare_index_params()
    index_params.add_index(field_name='embedding', index_type='IVF_FLAT', metric_type='L2', nlist=1024)
    index_params.add_index(field_name='metadata')

    client.create_collection(collection_name=collection_name, schema=schema, index_params=index_params)

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
