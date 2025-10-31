"""
Functional API tests for ScoutzOS endpoints.

This suite uses an in-memory SQLite database and overrides the dependency to
provide isolated sessions for each test.
"""

from typing import Any

from fastapi.testclient import TestClient


def test_create_and_list_owners(client: TestClient) -> None:
    # Create an organization
    resp = client.post("/orgs", json={"name": "Acme Corp", "slug": "acme"})
    assert resp.status_code == 201
    org = resp.json()
    org_id = org["id"]

    # Create owner in organization
    owner_payload = {
        "legal_name": "John Doe LLC",
        "contact_email": "john@example.com",
        "phone": "1234567890",
        "notes": "Test owner",
    }
    resp2 = client.post("/owners", json=owner_payload, headers={"X-Org-Id": org_id})
    assert resp2.status_code == 201
    owner = resp2.json()
    assert owner["legal_name"] == owner_payload["legal_name"]

    # List owners
    list_resp = client.get("/owners", headers={"X-Org-Id": org_id})
    assert list_resp.status_code == 200
    data = list_resp.json()
    assert data["total"] == 1
    assert data["items"][0]["id"] == owner["id"]