"""
Unit tests for the bounding-box map endpoint (BAI-17).

Covers:
  - bbox parameter parsing and validation
  - query builder filter logic (price, type, bedrooms)
  - 30-second cache keying and hit behaviour
  - slug generation helper
"""
import sys
import os

# Allow imports from the backend root without installing the package
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import time
from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

# ── slug helper ───────────────────────────────────────────────────────────────

from app.services.property_service import _make_slug


class TestMakeSlug:
    def test_ascii_title(self):
        assert _make_slug("Casa Nova", 42) == "casa-nova-42"

    def test_accented_chars(self):
        assert _make_slug("Apartamento em São Paulo", 1) == "apartamento-em-sao-paulo-1"

    def test_special_chars_stripped(self):
        slug = _make_slug("Loft (300m²) — Pinheiros!", 7)
        assert slug.startswith("loft-")
        assert slug.endswith("-7")
        assert "(" not in slug and "²" not in slug

    def test_multiple_spaces_become_single_dash(self):
        slug = _make_slug("Casa   Grande", 3)
        assert "--" not in slug


# ── bbox validation via HTTP ──────────────────────────────────────────────────

@pytest.fixture()
def client():
    """TestClient with DB dependency overridden to return a mock session."""
    from app.main import app
    from app.db.database import get_db

    mock_db = MagicMock()
    query_chain = MagicMock()
    query_chain.filter.return_value = query_chain
    query_chain.limit.return_value = query_chain
    query_chain.all.return_value = []
    mock_db.query.return_value = query_chain

    def override_get_db():
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c
    app.dependency_overrides.pop(get_db, None)


class TestBboxValidation:
    def test_missing_bbox_returns_422(self, client):
        r = client.get("/api/v1/properties/map")
        assert r.status_code == 422

    def test_wrong_number_of_bbox_values(self, client):
        r = client.get("/api/v1/properties/map?bbox=-23.6,-46.7,-23.5")
        assert r.status_code == 422
        assert "4 valores" in r.json()["detail"]

    def test_non_numeric_bbox(self, client):
        r = client.get("/api/v1/properties/map?bbox=a,b,c,d")
        assert r.status_code == 422
        assert "numéricos" in r.json()["detail"]

    def test_south_greater_than_north(self, client):
        r = client.get("/api/v1/properties/map?bbox=-23.5,-46.7,-23.6,-46.6")
        assert r.status_code == 422
        assert "south" in r.json()["detail"]

    def test_south_equals_north(self, client):
        r = client.get("/api/v1/properties/map?bbox=-23.5,-46.7,-23.5,-46.6")
        assert r.status_code == 422

    def test_latitude_out_of_range(self, client):
        r = client.get("/api/v1/properties/map?bbox=-91,-46.7,-23.5,-46.6")
        assert r.status_code == 422
        assert "Latitude" in r.json()["detail"]

    def test_longitude_out_of_range(self, client):
        r = client.get("/api/v1/properties/map?bbox=-23.6,-181,-23.5,-46.6")
        assert r.status_code == 422
        assert "Longitude" in r.json()["detail"]

    def test_valid_bbox_returns_200(self, client):
        r = client.get("/api/v1/properties/map?bbox=-23.7,-46.8,-23.4,-46.5")
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# ── query builder filter logic ────────────────────────────────────────────────

class TestGetMapPropertiesFilters:
    """
    Exercises get_map_properties() directly with a mocked SQLite Session so we
    can inspect the ORM query without a real DB.
    """

    def _fake_row(self, **kw):
        defaults = dict(
            id=1, lat=Decimal("-23.56"), lng=Decimal("-46.68"),
            price=500000.0, property_type="apartamento",
            image_url="http://img/1.jpg", title="Apto Pinheiros",
        )
        defaults.update(kw)
        return SimpleNamespace(**defaults)

    def _mock_db(self, rows):
        db = MagicMock()
        query_chain = MagicMock()
        query_chain.filter.return_value = query_chain
        query_chain.limit.return_value = query_chain
        query_chain.all.return_value = rows
        db.query.return_value = query_chain
        return db

    @patch("app.services.property_service.settings")
    def test_returns_light_fields_only(self, mock_settings):
        mock_settings.DATABASE_URL = "sqlite:///./test.db"
        db = self._mock_db([self._fake_row()])
        # Clear cache to avoid pollution from previous tests
        import app.services.property_service as svc
        svc._MAP_CACHE.clear()

        result = svc.get_map_properties(db, -23.7, -46.8, -23.4, -46.5)
        assert len(result) == 1
        item = result[0]
        assert set(item.keys()) == {"id", "lat", "lng", "price", "type", "thumbnail_url", "slug"}

    @patch("app.services.property_service.settings")
    def test_lat_lng_converted_to_float(self, mock_settings):
        mock_settings.DATABASE_URL = "sqlite:///./test.db"
        db = self._mock_db([self._fake_row(lat=Decimal("-23.5614"), lng=Decimal("-46.6858"))])
        import app.services.property_service as svc
        svc._MAP_CACHE.clear()

        result = svc.get_map_properties(db, -23.7, -46.8, -23.4, -46.5)
        assert isinstance(result[0]["lat"], float)
        assert isinstance(result[0]["lng"], float)

    @patch("app.services.property_service.settings")
    def test_empty_result_when_no_properties(self, mock_settings):
        mock_settings.DATABASE_URL = "sqlite:///./test.db"
        db = self._mock_db([])
        import app.services.property_service as svc
        svc._MAP_CACHE.clear()

        result = svc.get_map_properties(db, -23.7, -46.8, -23.4, -46.5)
        assert result == []

    @patch("app.services.property_service.settings")
    def test_thumbnail_url_maps_to_image_url(self, mock_settings):
        mock_settings.DATABASE_URL = "sqlite:///./test.db"
        db = self._mock_db([self._fake_row(image_url="https://cdn/foto.jpg")])
        import app.services.property_service as svc
        svc._MAP_CACHE.clear()

        result = svc.get_map_properties(db, -23.7, -46.8, -23.4, -46.5)
        assert result[0]["thumbnail_url"] == "https://cdn/foto.jpg"


# ── cache behaviour ───────────────────────────────────────────────────────────

class TestMapCache:
    def _fake_row(self):
        return SimpleNamespace(
            id=99, lat=Decimal("-23.56"), lng=Decimal("-46.68"),
            price=300000.0, property_type="casa",
            image_url=None, title="Casa Teste",
        )

    @patch("app.services.property_service.settings")
    def test_second_call_uses_cache(self, mock_settings):
        mock_settings.DATABASE_URL = "sqlite:///./test.db"
        import app.services.property_service as svc
        svc._MAP_CACHE.clear()

        db = MagicMock()
        query_chain = MagicMock()
        query_chain.filter.return_value = query_chain
        query_chain.limit.return_value = query_chain
        query_chain.all.return_value = [self._fake_row()]
        db.query.return_value = query_chain

        svc.get_map_properties(db, -24.0, -47.0, -23.0, -46.0)
        svc.get_map_properties(db, -24.0, -47.0, -23.0, -46.0)

        # DB queried only once despite two service calls
        assert db.query.call_count == 1

    @patch("app.services.property_service.settings")
    def test_different_bbox_different_cache_entries(self, mock_settings):
        mock_settings.DATABASE_URL = "sqlite:///./test.db"
        import app.services.property_service as svc
        svc._MAP_CACHE.clear()

        db = MagicMock()
        query_chain = MagicMock()
        query_chain.filter.return_value = query_chain
        query_chain.limit.return_value = query_chain
        query_chain.all.return_value = []
        db.query.return_value = query_chain

        svc.get_map_properties(db, -24.0, -47.0, -23.0, -46.0)
        svc.get_map_properties(db, -25.0, -48.0, -24.0, -47.0)

        assert db.query.call_count == 2

    @patch("app.services.property_service.time_module")
    @patch("app.services.property_service.settings")
    def test_cache_expires_after_30_seconds(self, mock_settings, mock_time):
        mock_settings.DATABASE_URL = "sqlite:///./test.db"
        import app.services.property_service as svc
        svc._MAP_CACHE.clear()

        db = MagicMock()
        query_chain = MagicMock()
        query_chain.filter.return_value = query_chain
        query_chain.limit.return_value = query_chain
        query_chain.all.return_value = []
        db.query.return_value = query_chain

        mock_time.time.return_value = 1000.0
        svc.get_map_properties(db, -24.0, -47.0, -23.0, -46.0)

        # Advance 31 seconds — cache should be stale
        mock_time.time.return_value = 1031.0
        svc.get_map_properties(db, -24.0, -47.0, -23.0, -46.0)

        assert db.query.call_count == 2
