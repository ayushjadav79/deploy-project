"""
test_todos.py — tests for /todos/ CRUD endpoints.

Covers: routers/todos.py, repositories/todo_repo.py
"""
import pytest

VALID_USER = {"username": "todouser1", "password": "Test@123"}


def register_and_login(client, user=None):
    user = user or VALID_USER
    client.post("/register", json=user)
    client.post("/login", json=user)


class TestTodos:
    def test_get_todos_empty(self, client):
        register_and_login(client)
        res = client.get("/todos/")
        assert res.status_code == 200
        assert res.json() == []

    def test_create_todo(self, client):
        register_and_login(client)
        res = client.post("/todos/", json={"title": "Buy groceries"})
        assert res.status_code == 201
        data = res.json()
        assert data["title"] == "Buy groceries"
        assert data["completed"] is False
        assert "id" in data

    def test_create_todo_appears_in_list(self, client):
        register_and_login(client)
        client.post("/todos/", json={"title": "Walk the dog"})
        res = client.get("/todos/")
        assert res.status_code == 200
        titles = [t["title"] for t in res.json()]
        assert "Walk the dog" in titles

    def test_update_todo_title(self, client):
        register_and_login(client)
        create_res = client.post("/todos/", json={"title": "Original title"})
        todo_id = create_res.json()["id"]
        res = client.patch(f"/todos/{todo_id}", json={"title": "Updated title"})
        assert res.status_code == 200
        assert res.json()["title"] == "Updated title"

    def test_update_todo_completed(self, client):
        register_and_login(client)
        create_res = client.post("/todos/", json={"title": "Task to complete"})
        todo_id = create_res.json()["id"]
        res = client.patch(f"/todos/{todo_id}", json={"completed": True})
        assert res.status_code == 200
        assert res.json()["completed"] is True

    def test_update_nonexistent_todo(self, client):
        register_and_login(client)
        res = client.patch("/todos/99999", json={"title": "Ghost"})
        assert res.status_code == 404

    def test_delete_todo(self, client):
        register_and_login(client)
        create_res = client.post("/todos/", json={"title": "Delete me"})
        todo_id = create_res.json()["id"]
        res = client.delete(f"/todos/{todo_id}")
        assert res.status_code == 204

    def test_delete_nonexistent_todo(self, client):
        register_and_login(client)
        res = client.delete("/todos/99999")
        assert res.status_code == 404

    def test_todos_require_auth(self, client):
        # No login — should get 401
        res = client.get("/todos/")
        assert res.status_code == 401

    def test_create_todo_requires_auth(self, client):
        res = client.post("/todos/", json={"title": "Unauthorized"})
        assert res.status_code == 401

    def test_todo_isolation_between_users(self, client):
        """User A's todos should not appear for User B."""
        user_a = {"username": "user_a_iso", "password": "Test@123"}
        user_b = {"username": "user_b_iso", "password": "Test@456"}

        # User A creates a todo
        client.post("/register", json=user_a)
        client.post("/login", json=user_a)
        client.post("/todos/", json={"title": "User A secret"})

        # User B logs in and checks their todos
        client.post("/register", json=user_b)
        client.post("/login", json=user_b)
        res = client.get("/todos/")
        titles = [t["title"] for t in res.json()]
        assert "User A secret" not in titles
