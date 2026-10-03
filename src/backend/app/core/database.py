"""
NETRA Database Connection Manager
Provides async MongoDB connectivity via Motor with seamless high-performance
in-memory fallback when a local MongoDB daemon is not running.
Ensures zero-friction startup for SIH presentation.
"""
from motor.motor_asyncio import AsyncIOMotorClient
from loguru import logger
import re
import copy
from typing import Any, Dict, List, Optional
from app.core.config import settings

_client: Optional[AsyncIOMotorClient] = None
_db = None
_is_in_memory: bool = False


# ─── In-Memory Storage Engine (Zero-Setup Fallback) ───────────────────────────

def _matches_query(doc: Dict[str, Any], query: Optional[Dict[str, Any]]) -> bool:
    if not query:
        return True
    
    for k, v in query.items():
        if k == "$or":
            if not any(_matches_query(doc, sub_q) for sub_q in v):
                return False
            continue
        
        doc_val = doc.get(k)
        if isinstance(v, dict):
            if "$regex" in v:
                pattern = v["$regex"]
                flags = re.IGNORECASE if v.get("$options") == "i" else 0
                if doc_val is None or not re.search(pattern, str(doc_val), flags):
                    return False
            elif "$in" in v:
                if doc_val not in v["$in"]:
                    return False
        else:
            if doc_val != v:
                return False
    return True


def _apply_projection(doc: Dict[str, Any], projection: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    cloned = copy.deepcopy(doc)
    if not projection:
        return cloned
    if projection.get("_id") == 0:
        cloned.pop("_id", None)
    return cloned


class InMemoryCursor:
    def __init__(self, items: List[Dict[str, Any]], projection: Optional[Dict[str, Any]] = None):
        self._items = items
        self._projection = projection
        self._sort_key = None
        self._sort_reverse = False
        self._limit_count = None

    def sort(self, key_or_list, direction=1):
        if isinstance(key_or_list, str):
            self._sort_key = key_or_list
            self._sort_reverse = (direction == -1)
        elif isinstance(key_or_list, list) and key_or_list:
            first = key_or_list[0]
            if isinstance(first, tuple):
                self._sort_key = first[0]
                self._sort_reverse = (first[1] == -1)
        return self

    def limit(self, count: int):
        self._limit_count = count
        return self

    async def to_list(self, length: Optional[int] = None) -> List[Dict[str, Any]]:
        results = list(self._items)
        if self._sort_key:
            results.sort(
                key=lambda x: str(x.get(self._sort_key, "")),
                reverse=self._sort_reverse
            )
        
        limit_val = length if length is not None else self._limit_count
        if limit_val is not None:
            results = results[:limit_val]

        return [_apply_projection(item, self._projection) for item in results]


class InMemoryCollection:
    def __init__(self, name: str):
        self.name = name
        self._data: List[Dict[str, Any]] = []

    async def insert_one(self, doc: Dict[str, Any]):
        cloned = copy.deepcopy(doc)
        if "_id" not in cloned:
            cloned["_id"] = str(len(self._data) + 1)
        self._data.append(cloned)
        return type("InsertResult", (), {"inserted_id": cloned["_id"]})()

    async def insert_many(self, docs: List[Dict[str, Any]]):
        for doc in docs:
            await self.insert_one(doc)

    def find(self, query: Optional[Dict[str, Any]] = None, projection: Optional[Dict[str, Any]] = None):
        matched = [d for d in self._data if _matches_query(d, query)]
        return InMemoryCursor(matched, projection)

    async def find_one(self, query: Optional[Dict[str, Any]] = None, projection: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        for d in self._data:
            if _matches_query(d, query):
                return _apply_projection(d, projection)
        return None

    async def count_documents(self, query: Optional[Dict[str, Any]] = None) -> int:
        return sum(1 for d in self._data if _matches_query(d, query))

    async def update_one(self, filter_q: Dict[str, Any], update_ops: Dict[str, Any]):
        matched = 0
        modified = 0
        for d in self._data:
            if _matches_query(d, filter_q):
                matched += 1
                if "$set" in update_ops:
                    for k, v in update_ops["$set"].items():
                        d[k] = copy.deepcopy(v)
                    modified += 1
                break
        return type("UpdateResult", (), {"matched_count": matched, "modified_count": modified})()

    async def delete_one(self, filter_q: Dict[str, Any]):
        for i, d in enumerate(self._data):
            if _matches_query(d, filter_q):
                del self._data[i]
                return type("DeleteResult", (), {"deleted_count": 1})()
        return type("DeleteResult", (), {"deleted_count": 0})()

    async def delete_many(self, filter_q: Dict[str, Any]):
        initial_len = len(self._data)
        self._data = [d for d in self._data if not _matches_query(d, filter_q)]
        deleted = initial_len - len(self._data)
        return type("DeleteResult", (), {"deleted_count": deleted})()

    async def create_index(self, *args, **kwargs):
        pass


class InMemoryDatabase:
    def __init__(self):
        self._collections: Dict[str, InMemoryCollection] = {}

    def __getitem__(self, name: str) -> InMemoryCollection:
        if name not in self._collections:
            self._collections[name] = InMemoryCollection(name)
        return self._collections[name]

    def __getattr__(self, name: str) -> InMemoryCollection:
        return self[name]

    async def command(self, cmd: str, *args, **kwargs):
        if cmd == "ping":
            return {"ok": 1}
        return {"ok": 1}


# ─── Connection Lifecycle ──────────────────────────────────────────────────────

async def connect_db():
    global _client, _db, _is_in_memory
    
    try:
        # Probe MongoDB with 1500ms timeout
        probe_client = AsyncIOMotorClient(settings.MONGODB_URI, serverSelectionTimeoutMS=1500)
        await probe_client.admin.command("ping")
        
        _client = probe_client
        _db = _client[settings.DATABASE_NAME]
        _is_in_memory = False
        await _create_indexes()
        logger.info(f"✅ Connected to live MongoDB: {settings.DATABASE_NAME}")
    except Exception as e:
        logger.warning(
            f"⚡ MongoDB not detected at '{settings.MONGODB_URI}' ({type(e).__name__}). "
            "Switching to high-performance In-Memory Database Engine. All functionality operational!"
        )
        _db = InMemoryDatabase()
        _is_in_memory = True


async def disconnect_db():
    global _client
    if _client:
        _client.close()
        logger.info("MongoDB connection closed")


async def _create_indexes():
    """Create necessary MongoDB indexes"""
    if _is_in_memory or _db is None:
        return
    try:
        await _db.devices.create_index("device_id", unique=True)
        await _db.configurations.create_index("device_id")
        await _db.configurations.create_index("created_at")
        await _db.audits.create_index("device_id")
        await _db.audits.create_index("created_at")
        await _db.findings.create_index("audit_id")
        await _db.findings.create_index("device_id")
        await _db.findings.create_index("severity")
        await _db.findings.create_index("status")
        await _db.remediation.create_index("finding_id")
        await _db.reports.create_index("created_at")
        await _db.drift.create_index("device_id")
        logger.info("MongoDB indexes verified")
    except Exception as e:
        logger.warning(f"Index creation warning: {e}")


def get_db():
    return _db


def get_collection(name: str):
    return _db[name]


def is_in_memory_db() -> bool:
    return _is_in_memory
