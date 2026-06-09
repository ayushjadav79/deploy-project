import redis
import json
import logging
from core.config import REDIS_URL

logger = logging.getLogger(__name__)

# Create a connection pool - reused across requests
try:
    _redis_client = redis.from_url(
        REDIS_URL,
        decode_responses=True,
        socket_connect_timeout=2,
        socket_timeout=2,
    )
    _redis_client.ping()
    _redis_available = True
    logger.info("Redis connected successfully at %s", REDIS_URL)
except Exception as e:
    _redis_client = None
    _redis_available = False
    logger.warning("Redis unavailable (%s). Caching disabled — app will work without cache.", e)


def get_redis():
    return _redis_client


def cache_set(key: str, value: dict, ttl_seconds: int = 60):
    """Store a dict in Redis with a TTL (time-to-live)"""
    if not _redis_available or _redis_client is None:
        return
    try:
        _redis_client.setex(key, ttl_seconds, json.dumps(value))
    except Exception as e:
        logger.warning("cache_set failed for key '%s': %s", key, e)


def cache_get(key: str):
    """Retrieve a dict from Redis. Returns None if key missing/expired or Redis unavailable"""
    if not _redis_available or _redis_client is None:
        return None
    try:
        data = _redis_client.get(key)
        return json.loads(data) if data else None
    except Exception as e:
        logger.warning("cache_get failed for key '%s': %s", key, e)
        return None


def cache_delete(key: str):
    """Invalidate a cache entry (use on logout or user update)"""
    if not _redis_available or _redis_client is None:
        return
    try:
        _redis_client.delete(key)
    except Exception as e:
        logger.warning("cache_delete failed for key '%s': %s", key, e)