"""
test_auth.py — tests for /register, /login, and /logout endpoints.

Covers: routers/auth.py, services/auth_service.py, repositories/user_repo.py,
        core/security.py, schemas/user.py
"""
import pytest


# ── Helpers ───────────────────────────────────────────────────────────────
VALID_USER = {"username": "testuser1", "password": "Test@123"}
VALID_USER2 = {"username": "testuser2", "password": "Another@456"}


def register(client, payload=None):
    payload = payload or VALID_USER
    return client.post("/register", json=payload)


def login(client, payload=None):
    payload = payload or VALID_USER
    return client.post("/login", json=payload)


# ── Register ──────────────────────────────────────────────────────────────
class TestRegister:
    def test_register_success(self, client):
        res = register(client)
        assert res.status_code == 200
        data = res.json()
        assert data["username"] == VALID_USER["username"]
        assert "id" in data
        assert "password" not in data

    def test_register_duplicate_username(self, client):
        register(client)  # first call may already exist from a previous test
        res = register(client)
        assert res.status_code == 400
        assert "already registered" in res.json()["detail"]

    def test_register_invalid_password_too_short(self, client):
        res = register(client, {"username": "newuser_short", "password": "Ab1!"})
        assert res.status_code == 422  # pydantic validation error

    def test_register_invalid_password_no_special(self, client):
        res = register(client, {"username": "newuser_nospec", "password": "Password1"})
        assert res.status_code == 422

    def test_register_invalid_password_no_number(self, client):
        res = register(client, {"username": "newuser_nonum", "password": "Password!"})
        assert res.status_code == 422

    def test_register_invalid_password_no_uppercase(self, client):
        res = register(client, {"username": "newuser_noup", "password": "password1!"})
        assert res.status_code == 422

    def test_register_invalid_password_no_lowercase(self, client):
        res = register(client, {"username": "newuser_nolw", "password": "PASSWORD1!"})
        assert res.status_code == 422


# ── Login ─────────────────────────────────────────────────────────────────
class TestLogin:
    def test_login_success(self, client):
        register(client)
        res = login(client)
        assert res.status_code == 200
        assert res.json()["message"] == "Login successful"
        # Cookie should be set
        assert "access_token" in res.cookies

    def test_login_wrong_password(self, client):
        register(client)
        res = client.post("/login", json={"username": VALID_USER["username"], "password": "Wrong@999"})
        assert res.status_code == 401
        assert "Invalid credentials" in res.json()["detail"]

    def test_login_nonexistent_user(self, client):
        res = client.post("/login", json={"username": "nobody_here", "password": "Test@123"})
        assert res.status_code == 401

    def test_login_missing_body(self, client):
        res = client.post("/login", json={})
        assert res.status_code == 422


# ── Logout ────────────────────────────────────────────────────────────────
class TestLogout:
    def test_logout_authenticated(self, client):
        register(client)
        login(client)
        res = client.post("/logout")
        assert res.status_code == 200
        assert res.json()["message"] == "Logged out successfully"

    def test_logout_unauthenticated(self, client):
        res = client.post("/logout")
        assert res.status_code == 401
