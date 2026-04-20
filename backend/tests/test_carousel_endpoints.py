"""
CarouselEx Backend API Tests - Iteration 14
Tests for new carousel builder endpoints and existing regression tests.

Key endpoints:
- /api/carousel/generate - Generate typed slides from topic
- /api/carousel/regenerate-slide - Regenerate one slide
- /api/carousel/hook-switch - Switch hook style
- /api/carousel/flow-optimize - Optimize slide flow
- /api/carousel/balance-text - Balance text across slides
- /api/slide-strength - Heuristic slide strength (NO LLM)
- /api/slide-assist - Extended with viral/simplify/rewrite-hook actions
- /api/generate-image - GPT Image 1 image generation
- Regression: /api/cic, /api/generate-poll, /api/adapt-platform
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://content-canvas-grid.preview.emergentagent.com").rstrip("/")


class TestHealthEndpoint:
    """Health check - should always work"""
    
    def test_health_returns_ok(self):
        response = requests.get(f"{BASE_URL}/api/health", timeout=10)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        print(f"✓ Health check passed: {data}")


class TestSlideStrengthHeuristic:
    """
    /api/slide-strength - Heuristic-based (NO LLM call)
    MUST work regardless of budget status
    """
    
    def test_slide_strength_hook_strong(self):
        """Test hook slide with strong characteristics"""
        response = requests.post(
            f"{BASE_URL}/api/slide-strength",
            json={
                "title": "Stop posting content nobody reads",
                "body": "Here is the truth",
                "slideType": "hook"
            },
            timeout=10
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "score" in data["data"]
        assert "strength" in data["data"]
        assert "hint" in data["data"]
        assert isinstance(data["data"]["score"], int)
        assert data["data"]["strength"] in ["Strong", "Medium", "Weak"]
        print(f"✓ Slide strength (hook): score={data['data']['score']}, strength={data['data']['strength']}, hint={data['data']['hint']}")
    
    def test_slide_strength_value_with_numbers(self):
        """Test value slide with numbers (should boost score)"""
        response = requests.post(
            f"{BASE_URL}/api/slide-strength",
            json={
                "title": "3 ways to grow your audience",
                "body": "These 5 strategies helped me gain 10K followers in 90 days",
                "slideType": "value"
            },
            timeout=10
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["score"] >= 50  # Numbers should boost score
        print(f"✓ Slide strength (value with numbers): score={data['data']['score']}, strength={data['data']['strength']}")
    
    def test_slide_strength_weak_slide(self):
        """Test slide with weak characteristics"""
        response = requests.post(
            f"{BASE_URL}/api/slide-strength",
            json={
                "title": "",
                "body": "Hi",
                "slideType": "value"
            },
            timeout=10
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["strength"] == "Weak"  # Too short, no title
        print(f"✓ Slide strength (weak): score={data['data']['score']}, strength={data['data']['strength']}, hint={data['data']['hint']}")
    
    def test_slide_strength_engagement_words(self):
        """Test slide with engagement words"""
        response = requests.post(
            f"{BASE_URL}/api/slide-strength",
            json={
                "title": "Why you should never ignore this",
                "body": "The truth about your content strategy",
                "slideType": "value"
            },
            timeout=10
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        # Should have higher score due to engagement words: why, you, never, truth
        print(f"✓ Slide strength (engagement words): score={data['data']['score']}, strength={data['data']['strength']}")


class TestCarouselGenerate:
    """
    /api/carousel/generate - Generate typed slides from topic
    Uses LLM - may fail with budget exceeded (acceptable)
    """
    
    def test_carousel_generate_basic(self):
        """Test carousel generation with topic"""
        response = requests.post(
            f"{BASE_URL}/api/carousel/generate",
            json={
                "topic": "Personal branding tips",
                "platform": "linkedin",
                "slideCount": 5,
                "userId": "demo-user-001"
            },
            timeout=60
        )
        
        if response.status_code == 500 and "Budget" in response.text:
            pytest.skip("LLM budget exceeded - endpoint signature correct")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "slides" in data["data"]
        slides = data["data"]["slides"]
        assert len(slides) >= 4
        
        # First slide should be hook type
        assert slides[0]["type"] == "hook"
        # Last slide should be cta type
        assert slides[-1]["type"] == "cta"
        
        # Each slide should have required fields
        for slide in slides:
            assert "type" in slide
            assert "title" in slide
            assert "body" in slide
            assert slide["type"] in ["hook", "value", "story", "data", "cta"]
        
        print(f"✓ Carousel generate: {len(slides)} slides, first={slides[0]['type']}, last={slides[-1]['type']}")
    
    def test_carousel_generate_validation_empty_topic(self):
        """Test validation - empty topic should fail"""
        response = requests.post(
            f"{BASE_URL}/api/carousel/generate",
            json={
                "topic": "",
                "pastedContent": "",
                "platform": "linkedin",
                "slideCount": 5
            },
            timeout=10
        )
        assert response.status_code == 400
        print("✓ Carousel generate validation: empty topic rejected")


class TestCarouselRegenerateSlide:
    """
    /api/carousel/regenerate-slide - Regenerate one slide
    Uses LLM - may fail with budget exceeded (acceptable)
    """
    
    def test_regenerate_slide_basic(self):
        """Test slide regeneration"""
        response = requests.post(
            f"{BASE_URL}/api/carousel/regenerate-slide",
            json={
                "slideType": "value",
                "slideTitle": "Ship in public",
                "slideBody": "Quiet work rarely compounds.",
                "context": "",
                "platform": "linkedin",
                "topic": "personal branding"
            },
            timeout=60
        )
        
        if response.status_code == 500 and "Budget" in response.text:
            pytest.skip("LLM budget exceeded - endpoint signature correct")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "title" in data["data"]
        assert "body" in data["data"]
        # tagline is optional but should be present
        assert "tagline" in data["data"]
        print(f"✓ Regenerate slide: title='{data['data']['title'][:50]}...'")


class TestHookSwitch:
    """
    /api/carousel/hook-switch - Switch hook style
    Uses LLM - may fail with budget exceeded (acceptable)
    """
    
    def test_hook_switch_bold(self):
        """Test hook switch to bold style"""
        response = requests.post(
            f"{BASE_URL}/api/carousel/hook-switch",
            json={
                "currentHook": "3 things I wish I knew",
                "style": "bold",
                "topic": "branding",
                "platform": "linkedin"
            },
            timeout=60
        )
        
        if response.status_code == 500 and "Budget" in response.text:
            pytest.skip("LLM budget exceeded - endpoint signature correct")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "title" in data["data"]
        assert "body" in data["data"]
        print(f"✓ Hook switch (bold): title='{data['data']['title'][:50]}...'")
    
    def test_hook_switch_story(self):
        """Test hook switch to story style"""
        response = requests.post(
            f"{BASE_URL}/api/carousel/hook-switch",
            json={
                "currentHook": "3 things I wish I knew",
                "style": "story",
                "topic": "branding",
                "platform": "linkedin"
            },
            timeout=60
        )
        
        if response.status_code == 500 and "Budget" in response.text:
            pytest.skip("LLM budget exceeded - endpoint signature correct")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        print(f"✓ Hook switch (story): title='{data['data']['title'][:50]}...'")


class TestFlowOptimize:
    """
    /api/carousel/flow-optimize - Optimize slide flow
    Uses LLM - may fail with budget exceeded (acceptable)
    """
    
    def test_flow_optimize_basic(self):
        """Test flow optimization with slides array"""
        response = requests.post(
            f"{BASE_URL}/api/carousel/flow-optimize",
            json={
                "slides": [
                    {"type": "hook", "title": "Hook", "body": "intro"},
                    {"type": "value", "title": "Point 1", "body": "detail"},
                    {"type": "value", "title": "Point 2", "body": "detail"},
                    {"type": "cta", "title": "Follow", "body": ""}
                ],
                "topic": "test",
                "platform": "linkedin"
            },
            timeout=60
        )
        
        if response.status_code == 500 and "Budget" in response.text:
            pytest.skip("LLM budget exceeded - endpoint signature correct")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "slides" in data["data"]
        assert isinstance(data["data"]["slides"], list)
        print(f"✓ Flow optimize: {len(data['data']['slides'])} slides returned")
    
    def test_flow_optimize_validation_too_few_slides(self):
        """Test validation - need at least 3 slides"""
        response = requests.post(
            f"{BASE_URL}/api/carousel/flow-optimize",
            json={
                "slides": [
                    {"type": "hook", "title": "Hook", "body": "intro"},
                    {"type": "cta", "title": "CTA", "body": ""}
                ],
                "topic": "test",
                "platform": "linkedin"
            },
            timeout=10
        )
        assert response.status_code == 400
        print("✓ Flow optimize validation: too few slides rejected")


class TestBalanceText:
    """
    /api/carousel/balance-text - Balance text across slides
    Uses LLM - may fail with budget exceeded (acceptable)
    """
    
    def test_balance_text_basic(self):
        """Test text balancing with slides array"""
        response = requests.post(
            f"{BASE_URL}/api/carousel/balance-text",
            json={
                "slides": [
                    {"type": "hook", "title": "Hook", "body": "intro"},
                    {"type": "value", "title": "Point 1", "body": "detail"},
                    {"type": "value", "title": "Point 2", "body": "detail"},
                    {"type": "cta", "title": "Follow", "body": ""}
                ],
                "platform": "linkedin"
            },
            timeout=60
        )
        
        if response.status_code == 500 and "Budget" in response.text:
            pytest.skip("LLM budget exceeded - endpoint signature correct")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "slides" in data["data"]
        assert isinstance(data["data"]["slides"], list)
        print(f"✓ Balance text: {len(data['data']['slides'])} slides returned")


class TestSlideAssistExtended:
    """
    /api/slide-assist - Extended with viral/simplify/rewrite-hook actions
    Uses LLM - may fail with budget exceeded (acceptable)
    """
    
    def test_slide_assist_viral(self):
        """Test slide assist with viral action"""
        response = requests.post(
            f"{BASE_URL}/api/slide-assist",
            json={
                "slideText": "Ship in public",
                "action": "viral"
            },
            timeout=60
        )
        
        if response.status_code == 500 and "Budget" in response.text:
            pytest.skip("LLM budget exceeded - endpoint signature correct")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "text" in data["data"]
        print(f"✓ Slide assist (viral): '{data['data']['text'][:50]}...'")
    
    def test_slide_assist_simplify(self):
        """Test slide assist with simplify action"""
        response = requests.post(
            f"{BASE_URL}/api/slide-assist",
            json={
                "slideText": "The implementation of strategic content marketing initiatives requires a comprehensive understanding of audience segmentation methodologies.",
                "action": "simplify"
            },
            timeout=60
        )
        
        if response.status_code == 500 and "Budget" in response.text:
            pytest.skip("LLM budget exceeded - endpoint signature correct")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "text" in data["data"]
        print(f"✓ Slide assist (simplify): '{data['data']['text'][:50]}...'")
    
    def test_slide_assist_rewrite_hook(self):
        """Test slide assist with rewrite-hook action"""
        response = requests.post(
            f"{BASE_URL}/api/slide-assist",
            json={
                "slideText": "Here are some tips for better content",
                "action": "rewrite-hook"
            },
            timeout=60
        )
        
        if response.status_code == 500 and "Budget" in response.text:
            pytest.skip("LLM budget exceeded - endpoint signature correct")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "text" in data["data"]
        print(f"✓ Slide assist (rewrite-hook): '{data['data']['text'][:50]}...'")


class TestGenerateImage:
    """
    /api/generate-image - GPT Image 1 image generation
    Uses LLM - may fail with budget exceeded (acceptable)
    Takes 15-45 seconds typically
    """
    
    def test_generate_image_basic(self):
        """Test image generation with prompt"""
        response = requests.post(
            f"{BASE_URL}/api/generate-image",
            json={
                "prompt": "Abstract purple gradient minimal",
                "userId": "demo-user-001"
            },
            timeout=120  # Long timeout for image generation
        )
        
        if response.status_code == 500 and "Budget" in response.text:
            pytest.skip("LLM budget exceeded - endpoint signature correct")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "image" in data["data"]
        assert data["data"]["image"].startswith("data:image/png;base64,")
        print(f"✓ Generate image: base64 image returned (length={len(data['data']['image'])})")
    
    def test_generate_image_validation_empty_prompt(self):
        """Test validation - empty prompt should fail"""
        response = requests.post(
            f"{BASE_URL}/api/generate-image",
            json={
                "prompt": "",
                "userId": "demo-user-001"
            },
            timeout=10
        )
        assert response.status_code == 400
        print("✓ Generate image validation: empty prompt rejected")


class TestRegressionCIC:
    """
    /api/cic - Content Intelligence Core (regression)
    Uses LLM - may fail with budget exceeded (acceptable)
    """
    
    def test_cic_generate_mode(self):
        """Test CIC with generate mode"""
        response = requests.post(
            f"{BASE_URL}/api/cic",
            json={
                "mode": "generate",
                "topic": "Building a personal brand on LinkedIn",
                "contentType": "viral-post",
                "userId": "demo-user-001",
                "plan": "starter"
            },
            timeout=60
        )
        
        if response.status_code == 500 and "Budget" in response.text:
            pytest.skip("LLM budget exceeded - endpoint signature correct")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "mainContent" in data["data"]
        assert "contentStrength" in data["data"]
        print(f"✓ CIC generate: strength={data['data']['contentStrength']}")


class TestRegressionGeneratePoll:
    """
    /api/generate-poll - Poll generation (regression)
    Uses LLM - may fail with budget exceeded (acceptable)
    """
    
    def test_generate_poll_basic(self):
        """Test poll generation"""
        response = requests.post(
            f"{BASE_URL}/api/generate-poll",
            json={
                "topic": "Remote work vs office work",
                "platform": "linkedin",
                "userId": "demo-user-001"
            },
            timeout=60
        )
        
        if response.status_code == 500 and "Budget" in response.text:
            pytest.skip("LLM budget exceeded - endpoint signature correct")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "question" in data["data"]
        assert "options" in data["data"]
        assert isinstance(data["data"]["options"], list)
        print(f"✓ Generate poll: question='{data['data']['question'][:50]}...'")


class TestRegressionAdaptPlatform:
    """
    /api/adapt-platform - Platform adaptation (regression)
    Uses LLM - may fail with budget exceeded (acceptable)
    """
    
    def test_adapt_platform_instagram(self):
        """Test platform adaptation to Instagram"""
        response = requests.post(
            f"{BASE_URL}/api/adapt-platform",
            json={
                "content": "Here are 5 tips for better LinkedIn posts:\n1. Start with a hook\n2. Use short sentences\n3. Add value\n4. Include a CTA\n5. Be consistent",
                "platform": "instagram",
                "userId": "demo-user-001"
            },
            timeout=60
        )
        
        if response.status_code == 500 and "Budget" in response.text:
            pytest.skip("LLM budget exceeded - endpoint signature correct")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "adaptedContent" in data["data"]
        assert "hook" in data["data"]
        assert "format" in data["data"]
        print(f"✓ Adapt platform (instagram): format={data['data']['format']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
