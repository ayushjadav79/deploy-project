import redis
import json
from core.config import REDIS_URL

# Create a connection pool - reused across requests
_redis_client = redis.from_url(REDIS_URL, decode_responses=True)

def get_redis():
    return _redis_client

def cache_set(key: str, value: dict, ttl_seconds: int = 60):
    """Store a dict in Redis with a TTL (time-to-live)"""
    _redis_client.setex(key, ttl_seconds, json.dumps(value))

def cache_get(key: str):
    """Retrieve a dict from Redis. Returns None if key missing/expired"""
    data = _redis_client.get(key)
    return json.loads(data) if data else None

def cache_delete(key: str):
    """Invalidate a cache entry (use on logout or user update)"""
    _redis_client.delete(key)
    