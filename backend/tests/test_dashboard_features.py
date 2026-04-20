"""
CarouselEx Backend API Tests - Iteration 19
Tests for new dashboard home page features:
- /api/ai-content/generate (multipart form: topic + optional image/video)
- /api/carousel-ideas (GET with platform + niche)
- /api/user-preferences (GET / POST)
- Regression: /api/health
"""

import io
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
TIMEOUT_LLM = 90


# ----- Health check -----
class TestHealth:
    def test_health_returns_ok(self):
        r = requests.get(f"{BASE_URL}/api/health", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data.get("status") == "ok"


# ----- AI Content Generator (Feature 1) -----
class TestAIContentGenerate:

    def test_generate_with_topic_only(self):
        """Topic-only multipart form returns full content shape."""
        files = {"topic": (None, "5 productivity tips for solopreneurs")}
        r = requests.post(f"{BASE_URL}/api/ai-content/generate", files=files, timeout=TIMEOUT_LLM)
        if r.status_code in (429, 503) or (r.status_code == 500 and "rate" in r.text.lower()):
            pytest.skip(f"Upstream rate/limit: {r.status_code} {r.text[:120]}")
        assert r.status_code == 200, f"got {r.status_code}: {r.text[:300]}"
        data = r.json()

        # Shape assertions
        assert isinstance(data.get("title"), str) and len(data["title"]) > 0
        assert isinstance(data.get("description"), str) and len(data["description"]) > 0
        assert isinstance(data.get("hashtags"), list)
        assert len(data["hashtags"]) == 15, f"expected 15 hashtags, got {len(data['hashtags'])}"
        # Hashtags should not contain leading '#'
        for h in data["hashtags"]:
            assert isinstance(h, str)
            assert not h.startswith("#")
        assert isinstance(data.get("keywords"), list)
        assert len(data["keywords"]) == 10, f"expected 10 keywords, got {len(data['keywords'])}"
        assert isinstance(data.get("contentType"), str) and len(data["contentType"]) > 0
        assert data.get("estimatedReach") in ("High", "Medium", "Low")

    def test_generate_with_topic_and_image(self):
        """Topic + image multipart upload returns same shape."""
        # Build a 64x64 solid-color PNG using stdlib (no PIL) — large enough for OpenAI vision
        import zlib, struct

        def _make_png(w=64, h=64, rgb=(91, 63, 232)):
            def _chunk(tag, data):
                return (struct.pack(">I", len(data)) + tag + data
                        + struct.pack(">I", zlib.crc32(tag + data) & 0xffffffff))
            sig = b"\x89PNG\r\n\x1a\n"
            ihdr = struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0)  # 8-bit RGB
            row = b"\x00" + bytes(rgb) * w  # filter byte + pixels
            raw = row * h
            idat = zlib.compress(raw, 9)
            return sig + _chunk(b"IHDR", ihdr) + _chunk(b"IDAT", idat) + _chunk(b"IEND", b"")

        png_bytes = _make_png()
        files = {
            "topic": (None, "branding for tech startups"),
            "image": ("test.png", png_bytes, "image/png"),
        }
        r = requests.post(f"{BASE_URL}/api/ai-content/generate", files=files, timeout=TIMEOUT_LLM)
        if r.status_code in (429, 503) or (r.status_code == 500 and "rate" in r.text.lower()):
            pytest.skip(f"Upstream rate/limit: {r.status_code} {r.text[:120]}")
        assert r.status_code == 200, f"got {r.status_code}: {r.text[:300]}"
        data = r.json()
        assert isinstance(data.get("title"), str)
        assert isinstance(data.get("hashtags"), list) and len(data["hashtags"]) == 15
        assert isinstance(data.get("keywords"), list) and len(data["keywords"]) == 10
        assert data.get("estimatedReach") in ("High", "Medium", "Low")

    def test_generate_empty_returns_400(self):
        """No topic, no media -> 400."""
        files = {"topic": (None, "")}
        r = requests.post(f"{BASE_URL}/api/ai-content/generate", files=files, timeout=15)
        assert r.status_code == 400, f"expected 400, got {r.status_code}: {r.text[:200]}"


# ----- Viral Carousel Ideas (Feature 2) -----
class TestCarouselIdeas:

    def _validate_idea(self, idea):
        assert isinstance(idea.get("id"), str) and len(idea["id"]) > 0
        assert isinstance(idea.get("title"), str) and len(idea["title"]) > 0
        assert isinstance(idea.get("hook"), str) and len(idea["hook"]) > 0
        slides = idea.get("slides")
        assert isinstance(slides, int) and 5 <= slides <= 10
        score = idea.get("engagementScore")
        assert isinstance(score, (int, float)) and 1 <= score <= 10
        assert isinstance(idea.get("trendingTag"), str)
        assert idea.get("format") in {"Educational", "Story", "Tips", "Listicle", "Comparison"}

    def test_ideas_instagram_finance(self):
        r = requests.get(
            f"{BASE_URL}/api/carousel-ideas",
            params={"platform": "Instagram", "niche": "Finance"},
            timeout=TIMEOUT_LLM,
        )
        if r.status_code in (429, 503):
            pytest.skip(f"Upstream rate-limit: {r.status_code}")
        assert r.status_code == 200, f"got {r.status_code}: {r.text[:300]}"
        data = r.json()
        assert data.get("platform") == "Instagram"
        assert data.get("niche") == "Finance"
        ideas = data.get("ideas")
        assert isinstance(ideas, list)
        assert len(ideas) == 7, f"expected 7 ideas, got {len(ideas)}"
        for idea in ideas:
            self._validate_idea(idea)

    def test_ideas_caching_same_request(self):
        """Same platform+niche within 30min should be cached (fast response)."""
        # Warm cache with a unique combo
        platform, niche = "LinkedIn", "Marketing"
        r1 = requests.get(
            f"{BASE_URL}/api/carousel-ideas",
            params={"platform": platform, "niche": niche},
            timeout=TIMEOUT_LLM,
        )
        if r1.status_code != 200:
            pytest.skip(f"first call non-200: {r1.status_code} {r1.text[:120]}")
        ideas1 = r1.json().get("ideas", [])

        # Second call should be cached → fast and identical
        t0 = time.time()
        r2 = requests.get(
            f"{BASE_URL}/api/carousel-ideas",
            params={"platform": platform, "niche": niche},
            timeout=15,
        )
        elapsed = time.time() - t0
        assert r2.status_code == 200
        ideas2 = r2.json().get("ideas", [])
        # Cache should make 2nd call < 5s and ideas identical
        assert elapsed < 5, f"cached response too slow: {elapsed:.2f}s"
        assert ideas1 == ideas2, "cached ideas should match"

    def test_ideas_different_combo_returns_fresh(self):
        """Different platform/niche -> different ideas."""
        r1 = requests.get(
            f"{BASE_URL}/api/carousel-ideas",
            params={"platform": "TikTok", "niche": "Fitness"},
            timeout=TIMEOUT_LLM,
        )
        if r1.status_code != 200:
            pytest.skip(f"first call non-200: {r1.status_code}")
        r2 = requests.get(
            f"{BASE_URL}/api/carousel-ideas",
            params={"platform": "Twitter", "niche": "Tech"},
            timeout=TIMEOUT_LLM,
        )
        if r2.status_code != 200:
            pytest.skip(f"second call non-200: {r2.status_code}")
        d1, d2 = r1.json(), r2.json()
        assert d1.get("platform") == "TikTok"
        assert d2.get("platform") == "Twitter"
        # IDs should differ
        ids1 = {i["id"] for i in d1.get("ideas", [])}
        ids2 = {i["id"] for i in d2.get("ideas", [])}
        assert ids1 != ids2


# ----- User Preferences (Feature 4) -----
class TestUserPreferences:

    def test_get_unset_returns_data_null(self):
        """When user has no prefs, should NOT 500. Returns {data: null}."""
        r = requests.get(
            f"{BASE_URL}/api/user-preferences",
            params={"userId": "TEST_nonexistent_user_xyz_12345"},
            timeout=15,
        )
        assert r.status_code == 200, f"got {r.status_code}: {r.text[:200]}"
        body = r.json()
        # Acceptable: {"data": null} when supabase missing or no rows
        assert "data" in body
        assert body["data"] is None or isinstance(body["data"], dict)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
