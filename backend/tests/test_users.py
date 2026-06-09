"""
test_users.py — tests for the /home endpoint.

Covers: routers/users.py (cache_get/cache_set paths)
"""
import pytest

VALID_USER = {"username": "homeuser1", "password": "Test@123"}


def register_and_login(client, user=None):
    user = user or VALID_USER
    client.post("/register", json=user)
    client.post("/login", json=user)


class TestHome:
    def test_home_authenticated(self, client):
        register_and_login(client)
        res = client.get("/home")
        assert res.status_code == 200
        data = res.json()
        assert data["username"] == VALID_USER["username"]
        assert "id" in data

    def test_home_unauthenticated(self, client):
        res = client.get("/home")
        assert res.status_code == 401

    def test_home_cache_hit(self, client):
        """Call /home twice to exercise both cache-miss and cache-hit paths."""
        register_and_login(client)
        res1 = client.get("/home")
        res2 = client.get("/home")
        assert res1.status_code == 200
        assert res2.status_code == 200
        assert res1.json()["username"] == res2.json()["username"]

    def test_home_returns_correct_user(self, client):
        user = {"username": "specific_home_user", "password": "Specific@1"}
        client.post("/register", json=user)
        client.post("/login", json=user)
        res = client.get("/home")
        assert res.json()["username"] == "specific_home_user"
