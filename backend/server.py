from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import os
import json
import uuid
import time
import re
import asyncio
from collections import defaultdict
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
from supabase import create_client, Client as SupabaseClient

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL") or os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY") or os.environ.get("SUPABASE_KEY", "")

_supabase: SupabaseClient | None = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        _supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception:
        _supabase = None


class _SupabaseQuery:
    def __init__(self, client: SupabaseClient, table: str, filters: dict):
        self._client = client
        self._table = table
        self._filters = filters
        self._sort_field: str | None = None
        self._sort_desc = False
        self._limit_n: int | None = None

    def sort(self, field: str, direction: int):
        self._sort_field = field
        self._sort_desc = direction == -1
        return self

    def limit(self, n: int):
        self._limit_n = n
        return self

    async def to_list(self, _n: int):
        def _run():
            q = self._client.table(self._table).select("*")
            for k, v in self._filters.items():
                q = q.eq(k, v)
            if self._sort_field:
                q = q.order(self._sort_field, desc=self._sort_desc)
            if self._limit_n:
                q = q.limit(self._limit_n)
            return q.execute()
        res = await asyncio.to_thread(_run)
        return res.data or []


class _SupabaseCollection:
    def __init__(self, client: SupabaseClient, table: str):
        self._client = client
        self._table = table

    async def find_one(self, filters: dict, _projection=None):
        def _run():
            q = self._client.table(self._table).select("*")
            for k, v in filters.items():
                q = q.eq(k, v)
            return q.limit(1).execute()
        try:
            res = await asyncio.to_thread(_run)
            return res.data[0] if res.data else None
        except Exception:
            return None

    async def insert_one(self, doc: dict):
        doc.pop("_id", None)
        def _run():
            return self._client.table(self._table).insert(doc).execute()
        try:
            await asyncio.to_thread(_run)
        except Exception:
            pass

    async def update_one(self, filters: dict, update: dict):
        patch = update.get("$set", update)
        patch.pop("_id", None)
        def _run():
            q = self._client.table(self._table).update(patch)
            for k, v in filters.items():
                q = q.eq(k, v)
            return q.execute()
        try:
            await asyncio.to_thread(_run)
        except Exception:
            pass

    async def update_many(self, filters: dict, update: dict):
        patch = update.get("$set", update)
        patch.pop("_id", None)
        def _run():
            q = self._client.table(self._table).update(patch)
            for k, v in filters.items():
                q = q.eq(k, v)
            return q.execute()
        try:
            await asyncio.to_thread(_run)
        except Exception:
            pass

    async def delete_many(self, filters: dict):
        def _run():
            q = self._client.table(self._table).delete()
            for k, v in filters.items():
                q = q.eq(k, v)
            return q.execute()
        try:
            await asyncio.to_thread(_run)
        except Exception:
            pass

    def find(self, filters: dict, _projection=None):
        return _SupabaseQuery(self._client, self._table, filters)


class _DB:
    def __getattr__(self, table: str):
        if _supabase is None:
            return _SupabaseCollection(None, table)
        return _SupabaseCollection(_supabase, table)

db = _DB()

# ============ HELPERS ============
PLAN_LIMITS = {
    "starter": {"content_per_month": 50},
    "pro": {"content_per_month": -1},
    "growth": {"content_per_month": -1},
}
usage_tracker: dict = defaultdict(lambda: {"content_count": 0, "month": 0})


def check_content_limit(user_id: str, plan: str) -> tuple:
    limits = PLAN_LIMITS.get(plan, PLAN_LIMITS["starter"])
    if limits["content_per_month"] == -1:
        return True, ""
    current_month = time.gmtime().tm_mon
    tracker = usage_tracker[user_id]
    if tracker["month"] != current_month:
        tracker["content_count"] = 0
        tracker["month"] = current_month
    if tracker["content_count"] >= limits["content_per_month"]:
        return False, f"Limit reached ({limits['content_per_month']}/month). Upgrade to Pro."
    return True, ""


def increment_content_usage(user_id: str):
    current_month = time.gmtime().tm_mon
    tracker = usage_tracker[user_id]
    if tracker["month"] != current_month:
        tracker["content_count"] = 0
        tracker["month"] = current_month
    tracker["content_count"] += 1


def parse_ai_json(response_text: str) -> dict:
    text = response_text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()
    if text.endswith("```"):
        text = text[:-3].strip()
    # Try to fix single quotes to double quotes for JSON
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        text = text.replace("'", '"')
        return json.loads(text)


async def call_ai(system_message: str, user_message: str) -> str:
    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=OPENAI_API_KEY)
    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": system_message},
            {"role": "user", "content": user_message},
        ],
        temperature=0.7,
    )
    return response.choices[0].message.content or ""


# ============ HEALTH ============
@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "carouselex-backend"}


# ============ SLIDE AI ASSIST ============
class SlideAssistRequest(BaseModel):
    slideText: str
    action: str  # improve | engaging | curiosity | controversial
    context: str = ""
    userId: str = "demo-user-001"


@app.post("/api/slide-assist")
async def slide_assist(req: SlideAssistRequest):
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="LLM key not configured")
    actions = {
        "improve": "Rewrite this slide to be stronger, clearer, and more impactful. Keep the same core message but make every word earn its place.",
        "engaging": "Rewrite this slide to be significantly more engaging. Add emotional hooks, vivid language, and make the reader feel something.",
        "curiosity": "Rewrite this slide to create a strong curiosity gap or open loop. Make the reader NEED to see the next slide.",
        "controversial": "Rewrite this slide to take a much stronger, more provocative stance. Be bold and opinionated while staying professional.",
        "viral": "Rewrite this slide to maximize viral potential. Add pattern interrupts, bold claims, curiosity gaps, and shareability. Make it scroll-stopping.",
        "simplify": "Simplify this slide dramatically. Reduce text, remove jargon, use simpler words, and make the core idea land in a single read.",
        "rewrite-hook": "Rewrite this as a stronger opening hook. Must stop the scroll in 1-2 lines. Use numbers, contrast, or a bold claim.",
    }
    instruction = actions.get(req.action, actions["improve"])
    try:
        response = await call_ai(
            "You are a viral content editor. Rewrite the given slide text following the instruction. Return ONLY the new text, no JSON, no quotes, no explanation.",
            f"INSTRUCTION: {instruction}\n\nCONTEXT (surrounding content): {req.context[:500]}\n\nSLIDE TEXT TO REWRITE:\n{req.slideText}"
        )
        return {"success": True, "data": {"text": response.strip().strip('"').strip("'")}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Assist failed: {str(e)}")


# ============ GENERATE POLL ============
class GeneratePollRequest(BaseModel):
    topic: str = ""
    sourceContent: str = ""
    platform: str = "linkedin"
    userId: str = "demo-user-001"


@app.post("/api/generate-poll")
async def generate_poll(req: GeneratePollRequest):
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="LLM key not configured")
    source = req.sourceContent or req.topic
    if not source.strip():
        raise HTTPException(status_code=400, detail="Provide a topic or source content")
    try:
        response = await call_ai(
            f"""You are a social media poll expert for {req.platform}. Generate a poll that creates engagement and debate.
Return ONLY valid JSON: {{"question":"<poll question>","options":["<option1>","<option2>","<option3>","<option4>"]}}""",
            f"Generate a poll {'from this content' if req.sourceContent else 'about this topic'}:\n\n{source[:2000]}"
        )
        data = parse_ai_json(response)
        return {"success": True, "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Poll generation failed: {str(e)}")



# ============ CIC (Content Intelligence Core) ============
class CICRequest(BaseModel):
    mode: str
    topic: str = ""
    contentType: str = "viral-post"
    pastedContent: str = ""
    rewriteStyle: str = "more-viral"
    brandStyle: Optional[dict] = None
    userId: str = "demo-user-001"
    plan: str = "starter"
    voiceProfileId: Optional[str] = None
    personaId: Optional[str] = None


@app.post("/api/cic")
async def content_intelligence_core(req: CICRequest):
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="LLM key not configured")

    allowed, msg = check_content_limit(req.userId, req.plan)
    if not allowed:
        raise HTTPException(status_code=429, detail=msg)

    brand_str = ""
    if req.brandStyle:
        brand_str = f"Tone: {req.brandStyle.get('tone', 'Bold & Direct')}, Style: {req.brandStyle.get('writingStyle', 'Short punchy sentences')}, Niche: {req.brandStyle.get('niche', 'general')}"
    else:
        brand_str = "No specific brand style — use bold, engaging default voice"

    # Inject voice profile if provided
    voice_str = ""
    if req.voiceProfileId:
        vp = await db.voice_profiles.find_one({"id": req.voiceProfileId}, {"_id": 0})
        if vp and vp.get("sampleCount", 0) >= 5:
            voice_str = f"""
VOICE PROFILE — Write in this person's specific style:
Voice Summary: {vp.get('voiceSummary', '')}
Tone: {', '.join(vp.get('toneDescriptors', []))}
Vocabulary: {', '.join(vp.get('vocabularyPatterns', []))}
Sentence style: {json.dumps(vp.get('sentenceStyle', {}))}
Hook patterns: {'; '.join(vp.get('hookPatterns', []))}
Avoid: {', '.join(vp.get('avoidPatterns', []))}
Do not use generic AI phrases. Write exactly as described above."""

    # Inject persona if provided
    persona_str = ""
    if req.personaId:
        p = await db.audience_personas.find_one({"id": req.personaId}, {"_id": 0})
        if p:
            persona_str = f"""
TARGET AUDIENCE PERSONA:
Role: {p.get('role', '')}
Experience: {p.get('experienceLevel', 'INTERMEDIATE')}
Pain points: {', '.join(p.get('mainPainPoints', []))}
Goals: {', '.join(p.get('mainGoals', []))}
Industry: {p.get('industryContext', '')}
Vocabulary level: {p.get('vocabularyLevel', 'SIMPLE')}
Avoid topics: {', '.join(p.get('avoidTopics', []))}
Write hooks, examples, and CTAs specifically for this person."""

    # Inject content DNA if available
    dna_str = ""
    dna = await db.content_dna.find_one({"userId": req.userId}, {"_id": 0})
    if dna and dna.get("winningFormulas"):
        dna_str = f"""
CONTENT DNA — Proven winning patterns for this creator:
Winning formulas: {'; '.join(dna.get('winningFormulas', []))}
Best hook types: {', '.join(dna.get('topHookTypes', []))}
Best structures: {', '.join(dna.get('topStructures', []))}
Optimal slide count: {dna.get('avgSlideCount', 7)}
Avoid: {', '.join(dna.get('avoidFormulas', []))}"""

    mode_instructions = {
        "generate": f"""Generate a complete, ready-to-post piece of content about: {req.topic}
Content Type: {req.contentType}
Create compelling, viral-worthy content with a strong hook, value-packed body, and clear close.
Return mainContent, contentStrength, hook, and 2-3 variations.""",
        "rewrite": f"""Rewrite and improve this content to make it {req.rewriteStyle.replace('-', ' ')}:

{req.pastedContent[:3000]}

Make it significantly stronger while preserving the core message.""",
        "expand": f"""Generate 10 unique, viral-worthy content ideas about: {req.topic}
Each idea should be specific, actionable, and have high viral potential.
Return them in the 'ideas' array.""",
        "hooks": f"""Generate 10 powerful hook lines about: {req.topic}
Each hook should use a different technique.
Return them in the 'hooks' array.""",
        "angle": f"""Take this topic and create 3 angle versions:
Topic: {req.topic}
Content: {req.pastedContent[:2000] if req.pastedContent else req.topic}
Create Controversial, Storytelling, and Educational angles.
Return them in the 'angles' object.""",
        "clone": f"""Analyze the structure of this viral content:
{req.pastedContent[:3000]}
Create new content about "{req.topic or 'the same topic'}" using the EXACT same structural pattern.
Return in 'structureClone' and 'mainContent'.""",
        "viral": f"""Make this content SIGNIFICANTLY more viral:
{req.pastedContent[:3000]}
Apply pattern interrupts, curiosity gaps, emotional triggers, bold claims.
Return improved mainContent, contentStrength, hook, and variations.""",
    }
    mode = req.mode if req.mode in mode_instructions else "generate"

    system_prompt = f"""You are the Content Intelligence Core for CarouselEx, an AI content studio for viral growth.
Generate or improve social media content for maximum engagement and shares.
Principles: pattern interrupts, curiosity gaps, short punchy sentences, emotional triggers, strong open/value middle/clear close.
Brand voice: {brand_str}
{voice_str}
{persona_str}
{dna_str}
CONTENT TYPE: {req.contentType} | MODE: {mode}

Respond ONLY with valid JSON — no markdown, no explanation:
{{"mainContent":"...","contentStrength":"Strong|Medium|Weak","hook":"...","variations":[{{"label":"...","content":"..."}}],"ideas":["..."],"hooks":["..."],"angles":{{"controversial":"...","storytelling":"...","educational":"..."}},"structureClone":"..."}}
Use empty arrays/null/empty strings for irrelevant fields."""

    try:
        response = await call_ai(system_prompt, mode_instructions[mode])
        data = parse_ai_json(response)
        increment_content_usage(req.userId)

        # Save to content history for voice training
        if mode in ["generate", "rewrite", "viral"] and data.get("mainContent"):
            await db.content_history.insert_one({
                "id": str(uuid.uuid4()),
                "userId": req.userId,
                "content": data["mainContent"],
                "hook": data.get("hook", ""),
                "contentType": req.contentType,
                "mode": mode,
                "voiceProfileId": req.voiceProfileId,
                "personaId": req.personaId,
                "createdAt": datetime.now(timezone.utc).isoformat(),
                "wasUsedForTraining": False,
                "performanceScore": None,
                "likes": None, "comments": None, "shares": None, "saves": None, "impressions": None,
                "isTopPerformer": False,
            })

        result = {
            "mainContent": str(data.get("mainContent", "")),
            "contentStrength": data.get("contentStrength", "Medium") if data.get("contentStrength") in ["Strong", "Medium", "Weak"] else "Medium",
            "hook": str(data.get("hook", "")),
            "variations": data.get("variations", []),
            "ideas": data.get("ideas", []),
            "hooks": data.get("hooks", []),
            "angles": data.get("angles", None),
            "structureClone": data.get("structureClone", None),
        }
        return {"success": True, "data": result}

    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="AI returned invalid format. Please retry.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")


# ============ FEATURE 1: VIRAL SCORE ============
class ViralScoreRequest(BaseModel):
    content: str
    hook: str = ""
    userId: str = "demo-user-001"


@app.post("/api/viral-score")
async def viral_score(req: ViralScoreRequest):
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="LLM key not configured")
    try:
        response = await call_ai(
            """You are a viral content analyst specializing in LinkedIn and Instagram carousels.
Analyze the provided content and score it on four dimensions.
Return ONLY valid JSON with no explanation, no markdown, no code fences.

Scoring rubric (max 25 each):
HOOK_STRENGTH: Number/stat (+5), bold claim (+5), under 10 words (+5), curiosity/FOMO (+5), pain point (+5)
EMOTIONAL_PULL: Story structure (+5), transformation arc (+5), credibility (+5), urgency (+5), you-language (+5)
SHAREABILITY: Clear takeaway (+5), opinionated (+5), surprising fact (+5), relatable (+5), actionable (+5)
STRUCTURE_SCORE: Self-contained hook (+5), logical progression (+5), mid-point reveal (+5), specific CTA (+5), optimal length 5-10 slides (+5)

Return this exact JSON:
{"total":<0-100>,"hook_strength":<0-25>,"emotional_pull":<0-25>,"shareability":<0-25>,"structure_score":<0-25>,"top_issue":"<one sentence>","top_strength":"<one sentence>","hook_feedback":"<one sentence>","cta_feedback":"<one sentence>","suggestions":["<s1>","<s2>","<s3>"]}""",
            f"Score this content:\n\nHook: {req.hook}\n\nFull content:\n{req.content[:3000]}"
        )
        data = parse_ai_json(response)
        for key in ["total", "hook_strength", "emotional_pull", "shareability", "structure_score"]:
            data[key] = max(0, min(100 if key == "total" else 25, int(data.get(key, 0))))
        return {"success": True, "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scoring failed: {str(e)}")


# ============ FEATURE 3: PLATFORM INTELLIGENCE ============
PLATFORM_RULES = {
    "instagram": "Visual-first, emotional/aspirational hooks, 5-7 slides max, 1-2 lines per slide, casual tone, CTA: Save/Share/Drop emoji",
    "x": "Convert to thread, each point under 280 chars, bold/provocative, punchy/direct, numbered, 3-5 hashtags at end, CTA: RT/Follow",
    "threads": "Conversational/warm, relatable story opener, 5-8 posts, informal like talking to friend, CTA: Thoughts?/Save if useful",
}


class PlatformAdaptRequest(BaseModel):
    content: str
    platform: str  # instagram | x | threads
    userId: str = "demo-user-001"


@app.post("/api/adapt-platform")
async def adapt_platform(req: PlatformAdaptRequest):
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="LLM key not configured")
    if req.platform not in PLATFORM_RULES:
        raise HTTPException(status_code=400, detail="Invalid platform")
    try:
        response = await call_ai(
            f"""You are a social media content strategist. Adapt content for {req.platform.upper()}.
Platform rules: {PLATFORM_RULES[req.platform]}
Return ONLY valid JSON: {{"adaptedContent":"<fully rewritten content for {req.platform}>","hook":"<platform-optimized hook>","format":"{req.platform}"}}
Completely rewrite the content — don't just change words. Restructure for platform best practices.""",
            f"Adapt this content for {req.platform}:\n\n{req.content[:3000]}"
        )
        data = parse_ai_json(response)
        return {"success": True, "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Adaptation failed: {str(e)}")


# ============ FEATURE 6: REPURPOSING ENGINE ============
class RepurposeExtractRequest(BaseModel):
    sourceText: str
    sourceType: str = "article"
    userId: str = "demo-user-001"


@app.post("/api/repurpose/extract")
async def repurpose_extract(req: RepurposeExtractRequest):
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="LLM key not configured")
    if len(req.sourceText.strip()) < 200:
        raise HTTPException(status_code=400, detail="Content too short. Minimum 200 characters.")
    try:
        response = await call_ai(
            f"""You are a content strategist extracting insights from long-form content.
Read the {req.sourceType} and extract 8-10 most valuable standalone insights.
Each insight should work as a carousel or viral post.
Return ONLY valid JSON:
{{"insights":[{{"id":"<unique>","insight":"<core idea one sentence>","angle":"<viral framing>","contentType":"carousel|viral_post|thread|poll","estimatedViralScore":<0-100>,"hookSuggestion":"<specific hook>"}}]}}""",
            f"Extract insights from this {req.sourceType}:\n\n{req.sourceText[:5000]}"
        )
        data = parse_ai_json(response)
        return {"success": True, "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")


class RepurposeBatchRequest(BaseModel):
    insights: List[dict]
    userId: str = "demo-user-001"
    plan: str = "starter"


@app.post("/api/repurpose/generate-batch")
async def repurpose_batch(req: RepurposeBatchRequest):
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="LLM key not configured")
    results = []
    for insight in req.insights[:10]:
        try:
            response = await call_ai(
                """You are CarouselEx's Content Intelligence Core. Generate viral content.
Return ONLY valid JSON: {"mainContent":"...","contentStrength":"Strong|Medium|Weak","hook":"..."}""",
                f"Generate a {insight.get('contentType', 'viral_post')} about: {insight.get('insight', '')}\nAngle: {insight.get('angle', '')}\nHook suggestion: {insight.get('hookSuggestion', '')}"
            )
            data = parse_ai_json(response)
            results.append({
                "insightId": insight.get("id", ""),
                "contentType": insight.get("contentType", "viral_post"),
                "mainContent": data.get("mainContent", ""),
                "hook": data.get("hook", insight.get("hookSuggestion", "")),
                "contentStrength": data.get("contentStrength", "Medium"),
                "status": "success",
            })
        except Exception:
            results.append({
                "insightId": insight.get("id", ""),
                "contentType": insight.get("contentType", "viral_post"),
                "mainContent": "",
                "hook": "",
                "contentStrength": "Weak",
                "status": "error",
            })
    return {"success": True, "data": results}


# ============ FEATURE 2: BRAND VOICE PROFILES ============
class VoiceProfileCreate(BaseModel):
    userId: str = "demo-user-001"
    name: str = "My Professional Voice"


class VoiceProfileUpdate(BaseModel):
    name: Optional[str] = None
    isActive: Optional[bool] = None


@app.get("/api/voice-profiles")
async def voice_profiles_list(userId: str = "demo-user-001"):
    try:
        items = await db.voice_profiles.find({"userId": userId}, {"_id": 0}).to_list(50)
        return {"success": True, "data": items}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/voice-profiles")
async def voice_profile_create(req: VoiceProfileCreate):
    try:
        doc = {
            "id": str(uuid.uuid4()),
            "userId": req.userId,
            "name": req.name,
            "isActive": False,
            "sampleCount": 0,
            "toneDescriptors": [],
            "vocabularyPatterns": [],
            "sentenceStyle": {},
            "hookPatterns": [],
            "avoidPatterns": [],
            "voiceSummary": "",
            "rawSamples": [],
            "createdAt": datetime.now(timezone.utc).isoformat(),
            "updatedAt": datetime.now(timezone.utc).isoformat(),
        }
        await db.voice_profiles.insert_one(doc)
        doc.pop("_id", None)
        return {"success": True, "data": doc}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/voice-profiles/{profile_id}")
async def voice_profile_update(profile_id: str, req: VoiceProfileUpdate):
    try:
        update = {"updatedAt": datetime.now(timezone.utc).isoformat()}
        if req.name is not None:
            update["name"] = req.name
        if req.isActive is not None:
            if req.isActive:
                profile = await db.voice_profiles.find_one({"id": profile_id}, {"_id": 0})
                if profile:
                    await db.voice_profiles.update_many(
                        {"userId": profile["userId"]}, {"$set": {"isActive": False}}
                    )
            update["isActive"] = req.isActive
        await db.voice_profiles.update_one({"id": profile_id}, {"$set": update})
        return {"success": True, "data": {"id": profile_id, **update}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/voice-profiles/{profile_id}/train")
async def voice_profile_train(profile_id: str):
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="LLM key not configured")
    try:
        profile = await db.voice_profiles.find_one({"id": profile_id}, {"_id": 0})
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")

        samples = await db.content_history.find(
            {"userId": profile["userId"]}, {"_id": 0}
        ).sort("createdAt", -1).limit(20).to_list(20)

        if len(samples) < 5:
            return {"success": False, "error": f"Need at least 5 posts. You have {len(samples)}."}

        sample_texts = [s.get("content", "")[:500] for s in samples]
        response = await call_ai(
            """Analyze these content samples written by one person. Extract their unique writing voice patterns.
Return ONLY valid JSON:
{"toneDescriptors":["<3-6 adjectives>"],"vocabularyPatterns":["<10-15 frequent words/phrases>"],"sentenceStyle":{"avgLength":"short|medium|long","usesQuestions":true,"usesBullets":false,"usesNumbers":true,"usesBoldClaims":true,"punctuationStyle":"minimal|normal|heavy"},"hookPatterns":["<hook types they use>"],"avoidPatterns":["<things never in their writing>"],"voiceSummary":"<2-3 sentence voice description for use as system prompt>"}""",
            f"Analyze these {len(sample_texts)} content samples:\n\n" + "\n---\n".join(sample_texts)
        )
        data = parse_ai_json(response)

        await db.voice_profiles.update_one({"id": profile_id}, {"$set": {
            "sampleCount": len(samples),
            "toneDescriptors": data.get("toneDescriptors", []),
            "vocabularyPatterns": data.get("vocabularyPatterns", []),
            "sentenceStyle": data.get("sentenceStyle", {}),
            "hookPatterns": data.get("hookPatterns", []),
            "avoidPatterns": data.get("avoidPatterns", []),
            "voiceSummary": data.get("voiceSummary", ""),
            "rawSamples": sample_texts[:20],
            "isActive": True,
            "updatedAt": datetime.now(timezone.utc).isoformat(),
        }})
        # Deactivate other profiles
        await db.voice_profiles.update_many(
            {"userId": profile["userId"], "id": {"$ne": profile_id}},
            {"$set": {"isActive": False}}
        )
        return {"success": True, "data": {**data, "sampleCount": len(samples)}}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")


# ============ FEATURE 4: CONTENT DNA ============
@app.get("/api/content-dna")
async def content_dna_get(userId: str = "demo-user-001"):
    try:
        dna = await db.content_dna.find_one({"userId": userId}, {"_id": 0})
        if not dna:
            count = await db.content_history.count_documents({"userId": userId, "performanceScore": {"$ne": None}})
            return {"success": True, "data": None, "postsWithData": count, "needsMore": max(0, 10 - count)}
        return {"success": True, "data": dna}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/content-dna/analyze")
async def content_dna_analyze(userId: str = "demo-user-001"):
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="LLM key not configured")
    try:
        scored = await db.content_history.find(
            {"userId": userId, "performanceScore": {"$ne": None}}, {"_id": 0}
        ).sort("performanceScore", -1).to_list(100)

        if len(scored) < 5:
            return {"success": False, "error": f"Need at least 5 posts with data. You have {len(scored)}."}

        top5 = scored[:5]
        bottom5 = scored[-5:] if len(scored) >= 10 else scored[5:]

        top_str = "\n".join([f"Hook: {p.get('hook','')} | Score: {p.get('performanceScore',0)} | Type: {p.get('contentType','')}" for p in top5])
        bottom_str = "\n".join([f"Hook: {p.get('hook','')} | Score: {p.get('performanceScore',0)} | Type: {p.get('contentType','')}" for p in bottom5])

        response = await call_ai(
            """Analyze content performance patterns. Return ONLY valid JSON:
{"topHookTypes":["<best hook types>"],"topStructures":["<best structures>"],"avgSlideCount":<number>,"winningFormulas":["<formula1>","<formula2>","<formula3>"],"avoidFormulas":["<avoid1>","<avoid2>"],"dnaReport":"<2-3 paragraph analysis>"}""",
            f"TOP PERFORMING:\n{top_str}\n\nUNDERPERFORMING:\n{bottom_str}"
        )
        data = parse_ai_json(response)

        dna_doc = {
            "userId": userId,
            "lastAnalyzedAt": datetime.now(timezone.utc).isoformat(),
            "topHookTypes": data.get("topHookTypes", []),
            "topStructures": data.get("topStructures", []),
            "avgSlideCount": data.get("avgSlideCount", 7),
            "winningFormulas": data.get("winningFormulas", []),
            "avoidFormulas": data.get("avoidFormulas", []),
            "dnaReport": data.get("dnaReport", ""),
            "bestPostingTopics": [],
            "postsAnalyzed": len(scored),
        }
        await db.content_dna.update_one({"userId": userId}, {"$set": dna_doc}, upsert=True)
        return {"success": True, "data": dna_doc}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DNA analysis failed: {str(e)}")


# ============ FEATURE 5: AUDIENCE PERSONAS ============
class PersonaCreate(BaseModel):
    userId: str = "demo-user-001"
    name: str
    role: str = ""
    experienceLevel: str = "INTERMEDIATE"
    mainPainPoints: List[str] = []
    mainGoals: List[str] = []
    industryContext: str = ""
    vocabularyLevel: str = "SIMPLE"
    avoidTopics: List[str] = []


@app.get("/api/personas")
async def personas_list(userId: str = "demo-user-001"):
    try:
        items = await db.audience_personas.find({"userId": userId}, {"_id": 0}).to_list(50)
        return {"success": True, "data": items}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/personas")
async def persona_create(req: PersonaCreate):
    try:
        doc = {
            "id": str(uuid.uuid4()),
            "userId": req.userId,
            "name": req.name,
            "role": req.role,
            "experienceLevel": req.experienceLevel,
            "mainPainPoints": req.mainPainPoints,
            "mainGoals": req.mainGoals,
            "industryContext": req.industryContext,
            "vocabularyLevel": req.vocabularyLevel,
            "avoidTopics": req.avoidTopics,
            "isActive": False,
            "createdAt": datetime.now(timezone.utc).isoformat(),
        }
        await db.audience_personas.insert_one(doc)
        doc.pop("_id", None)
        return {"success": True, "data": doc}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/personas/{persona_id}")
async def persona_update(persona_id: str, req: PersonaCreate):
    try:
        update = {
            "name": req.name, "role": req.role, "experienceLevel": req.experienceLevel,
            "mainPainPoints": req.mainPainPoints, "mainGoals": req.mainGoals,
            "industryContext": req.industryContext, "vocabularyLevel": req.vocabularyLevel,
            "avoidTopics": req.avoidTopics,
        }
        await db.audience_personas.update_one({"id": persona_id}, {"$set": update})
        return {"success": True, "data": {"id": persona_id, **update}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/personas/{persona_id}/activate")
async def persona_activate(persona_id: str, userId: str = "demo-user-001"):
    try:
        await db.audience_personas.update_many({"userId": userId}, {"$set": {"isActive": False}})
        await db.audience_personas.update_one({"id": persona_id}, {"$set": {"isActive": True}})
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/personas/{persona_id}")
async def persona_delete(persona_id: str):
    try:
        await db.audience_personas.delete_one({"id": persona_id})
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============ FEATURE 7: TREND RADAR ============
@app.get("/api/trends")
async def trends_get(userId: str = "demo-user-001"):
    try:
        brand = await db.brand_style.find_one({"userId": userId}, {"_id": 0})
        niche = brand.get("niche", "") if brand else ""

        now = datetime.now(timezone.utc)
        existing = await db.trend_alerts.find(
            {"userId": userId, "expiresAt": {"$gt": now.isoformat()}}, {"_id": 0}
        ).sort("detectedAt", -1).to_list(10)

        if existing:
            return {"success": True, "data": existing, "niche": niche}

        if not niche:
            return {"success": True, "data": [], "niche": "", "needsNiche": True}

        return {"success": True, "data": [], "niche": niche, "canRefresh": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/trends/refresh")
async def trends_refresh(userId: str = "demo-user-001"):
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="LLM key not configured")
    try:
        brand = await db.brand_style.find_one({"userId": userId}, {"_id": 0})
        niche = brand.get("niche", "marketing") if brand else "marketing"

        response = await call_ai(
            f"""You are a social media trends analyst for {niche} content on LinkedIn and Instagram.
Generate 3 specific trend opportunities for today. They should feel timely, specific, and actionable.
Return ONLY valid JSON:
{{"trends":[{{"topic":"<specific topic>","why_trending":"<one sentence>","angles":["<angle 1>","<angle 2>","<angle 3>"],"urgency":"hot|warm|rising","contentType":"carousel|viral_post|thread"}}]}}""",
            f"Generate 3 trending topics for the {niche} niche. Make them feel current and timely."
        )
        data = parse_ai_json(response)
        now = datetime.now(timezone.utc)
        expires = (now + timedelta(hours=48)).isoformat()

        # Clear old trends
        await db.trend_alerts.delete_many({"userId": userId})

        alerts = []
        for t in data.get("trends", [])[:3]:
            doc = {
                "id": str(uuid.uuid4()),
                "userId": userId,
                "trendTopic": t.get("topic", ""),
                "trendSummary": t.get("why_trending", ""),
                "contentAngles": t.get("angles", []),
                "niche": niche,
                "urgency": t.get("urgency", "warm"),
                "contentType": t.get("contentType", "viral_post"),
                "detectedAt": now.isoformat(),
                "expiresAt": expires,
                "isRead": False,
                "wasUsed": False,
            }
            await db.trend_alerts.insert_one(doc)
            doc.pop("_id", None)
            alerts.append(doc)

        return {"success": True, "data": alerts}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Trend refresh failed: {str(e)}")


@app.put("/api/trends/{trend_id}/dismiss")
async def trends_dismiss(trend_id: str):
    try:
        await db.trend_alerts.update_one({"id": trend_id}, {"$set": {"isRead": True}})
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============ FEATURE 8: PERFORMANCE FEEDBACK LOOP ============
@app.get("/api/performance")
async def performance_list(userId: str = "demo-user-001", page: int = 1, limit: int = 20):
    try:
        query = {"userId": userId}
        total = await db.content_history.count_documents(query)
        items = await db.content_history.find(query, {"_id": 0}).sort("createdAt", -1).skip((page - 1) * limit).limit(limit).to_list(limit)

        with_data = await db.content_history.count_documents({**query, "performanceScore": {"$ne": None}})
        top = await db.content_history.find({**query, "performanceScore": {"$ne": None}}, {"_id": 0}).sort("performanceScore", -1).limit(1).to_list(1)

        # Calc avg engagement
        pipeline = [
            {"$match": {**query, "performanceScore": {"$ne": None}}},
            {"$group": {"_id": None, "avg": {"$avg": "$performanceScore"}}}
        ]
        agg = await db.content_history.aggregate(pipeline).to_list(1)
        avg_score = round(agg[0]["avg"], 1) if agg else 0

        return {
            "success": True,
            "data": items,
            "total": total,
            "postsWithData": with_data,
            "avgEngagement": avg_score,
            "topPerformer": top[0] if top else None,
            "page": page, "limit": limit,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class PerformanceDataRequest(BaseModel):
    likes: Optional[int] = None
    comments: Optional[int] = None
    shares: Optional[int] = None
    saves: Optional[int] = None
    impressions: Optional[int] = None


@app.put("/api/performance/{post_id}")
async def performance_update(post_id: str, req: PerformanceDataRequest):
    try:
        total = (req.likes or 0) + (req.comments or 0) * 3 + (req.shares or 0) * 5 + (req.saves or 0) * 2
        impressions = req.impressions or 1
        score = round(min(100, (total / max(impressions, 1)) * 1000), 1)

        update = {
            "likes": req.likes, "comments": req.comments, "shares": req.shares,
            "saves": req.saves, "impressions": req.impressions,
            "performanceScore": score,
        }
        result = await db.content_history.update_one({"id": post_id}, {"$set": update})
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Post not found")

        # Update top performer flags
        post = await db.content_history.find_one({"id": post_id}, {"_id": 0})
        if post:
            all_scores = await db.content_history.find(
                {"userId": post["userId"], "performanceScore": {"$ne": None}}, {"_id": 0, "id": 1, "performanceScore": 1}
            ).sort("performanceScore", -1).to_list(100)

            top_20_count = max(1, len(all_scores) // 5)
            top_ids = [s["id"] for s in all_scores[:top_20_count]]

            await db.content_history.update_many({"userId": post["userId"]}, {"$set": {"isTopPerformer": False}})
            if top_ids:
                await db.content_history.update_many({"id": {"$in": top_ids}}, {"$set": {"isTopPerformer": True}})

        return {"success": True, "data": {"id": post_id, "performanceScore": score, **update}}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============ CONTENT LIBRARY (existing) ============
class LibrarySaveRequest(BaseModel):
    userId: str = "demo-user-001"
    content: str
    hook: str = ""
    contentType: str = "viral-post"
    contentStrength: str = "Medium"


class LibraryEditRequest(BaseModel):
    content: str
    hook: str = ""
    contentType: str = ""
    contentStrength: str = ""


@app.post("/api/library/save")
async def library_save(req: LibrarySaveRequest):
    try:
        title = req.content[:60].strip() + ("..." if len(req.content) > 60 else "")
        doc = {
            "id": str(uuid.uuid4()), "userId": req.userId, "content": req.content,
            "hook": req.hook, "contentType": req.contentType, "contentStrength": req.contentStrength,
            "title": title, "createdAt": datetime.now(timezone.utc).isoformat(),
        }
        await db.content_library.insert_one(doc)
        doc.pop("_id", None)
        return {"success": True, "data": doc}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/library")
async def library_list(userId: str = "demo-user-001", search: str = "", contentType: str = "", page: int = 1, limit: int = 20):
    try:
        query: dict = {"userId": userId}
        if search:
            query["content"] = {"$regex": re.escape(search), "$options": "i"}
        if contentType and contentType != "all":
            query["contentType"] = contentType
        total = await db.content_library.count_documents(query)
        items = await db.content_library.find(query, {"_id": 0}).sort("createdAt", -1).skip((page - 1) * limit).limit(limit).to_list(limit)
        return {"success": True, "data": items, "total": total, "page": page, "limit": limit}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/library/{item_id}")
async def library_edit(item_id: str, req: LibraryEditRequest):
    try:
        uf = {}
        if req.content:
            uf["content"] = req.content
            uf["title"] = req.content[:60].strip() + ("..." if len(req.content) > 60 else "")
        if req.hook: uf["hook"] = req.hook
        if req.contentType: uf["contentType"] = req.contentType
        if req.contentStrength: uf["contentStrength"] = req.contentStrength
        result = await db.content_library.update_one({"id": item_id}, {"$set": uf})
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Not found")
        return {"success": True, "data": {"id": item_id, **uf}}
    except HTTPException: raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/library/{item_id}/duplicate")
async def library_duplicate(item_id: str):
    try:
        item = await db.content_library.find_one({"id": item_id}, {"_id": 0})
        if not item:
            raise HTTPException(status_code=404, detail="Not found")
        new_item = {**item, "id": str(uuid.uuid4()), "createdAt": datetime.now(timezone.utc).isoformat()}
        new_item["title"] = (item.get("title", "")[:55] + " (Copy)") if not item.get("title", "").endswith("(Copy)") else item["title"]
        await db.content_library.insert_one(new_item)
        new_item.pop("_id", None)
        return {"success": True, "data": new_item}
    except HTTPException: raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/library/{item_id}")
async def library_delete(item_id: str):
    try:
        result = await db.content_library.delete_one({"id": item_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Not found")
        return {"success": True, "data": {"id": item_id}}
    except HTTPException: raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============ BRAND STYLE (existing) ============
class BrandStyleRequest(BaseModel):
    userId: str = "demo-user-001"
    tone: str = "Bold & Direct"
    writingStyle: str = "Short punchy sentences"
    niche: str = ""


@app.get("/api/brand")
async def brand_get(userId: str = "demo-user-001"):
    try:
        doc = await db.brand_style.find_one({"userId": userId}, {"_id": 0})
        return {"success": True, "data": doc}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/brand")
async def brand_save(req: BrandStyleRequest):
    try:
        doc = {"userId": req.userId, "tone": req.tone, "writingStyle": req.writingStyle, "niche": req.niche, "updatedAt": datetime.now(timezone.utc).isoformat()}
        await db.brand_style.update_one({"userId": req.userId}, {"$set": doc}, upsert=True)
        return {"success": True, "data": doc}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============ SEED DEMO DATA ============
@app.post("/api/seed-demo-data")
async def seed_demo_data():
    uid = "demo-user-001"
    now = datetime.now(timezone.utc)

    # Seed brand style
    await db.brand_style.update_one({"userId": uid}, {"$set": {
        "userId": uid, "tone": "Bold & Direct", "writingStyle": "Short punchy sentences",
        "niche": "marketing", "updatedAt": now.isoformat(),
    }}, upsert=True)

    # Seed content history with performance data (for DNA)
    sample_posts = [
        {"hook": "Stop posting content nobody reads", "content": "Stop posting content nobody reads.\n\nHere's the truth: 95% of LinkedIn posts get zero engagement.\n\nNot because the content is bad. But because the hook is invisible.\n\nI tested 200 hooks over 6 months. Here's what I found:\n\n1. Numbers in the first 3 words = 3x more clicks\n2. Questions outperform statements by 40%\n3. Controversial takes get 5x more comments\n\nThe pattern is clear: Your first line is your entire strategy.\n\nSave this. Apply it. Watch your reach explode.", "contentType": "carousel", "performanceScore": 92, "likes": 450, "comments": 89, "shares": 67, "saves": 234, "impressions": 12000},
        {"hook": "I went from 0 to 10K followers in 90 days", "content": "I went from 0 to 10K followers in 90 days.\n\nNo paid ads. No viral luck. Just a system.\n\nHere's exactly what I did:\n\nWeek 1-4: Posted daily. Got 50 views per post.\nWeek 5-8: Studied top creators. Rewrote my hooks.\nWeek 9-12: Engagement tripled. Algorithm kicked in.\n\nThe secret? Consistency + pattern recognition.\n\nMost people quit at week 3. Don't be most people.", "contentType": "viral-post", "performanceScore": 88, "likes": 380, "comments": 56, "shares": 43, "saves": 189, "impressions": 9500},
        {"hook": "The $0 marketing strategy nobody talks about", "content": "The $0 marketing strategy nobody talks about:\n\nComment on 20 posts from your target audience every day.\n\nNot 'Great post!' garbage. Real, thoughtful comments.\n\nAfter 30 days, you'll have more warm leads than any ad campaign.\n\nHere's why it works:\n- You become visible to their network\n- You demonstrate expertise for free\n- You build genuine relationships\n\nCost: $0. ROI: Unlimited.", "contentType": "carousel", "performanceScore": 85, "likes": 320, "comments": 78, "shares": 55, "saves": 167, "impressions": 8500},
        {"hook": "Your funnel is broken and here's proof", "content": "Your funnel is broken and here's proof.\n\nYou're getting traffic but zero conversions.\n\nThe problem isn't your product. It's your landing page.\n\n3 fixes that doubled my conversion rate:\n\n1. Remove navigation links (keep them focused)\n2. Add social proof above the fold\n3. One CTA button, not three\n\nSimple changes. Massive impact.", "contentType": "viral-post", "performanceScore": 78, "likes": 210, "comments": 34, "shares": 28, "saves": 98, "impressions": 6000},
        {"hook": "5 AI tools that replaced my entire marketing team", "content": "5 AI tools that replaced my entire marketing team:\n\n1. ChatGPT for copy\n2. Midjourney for visuals\n3. Jasper for emails\n4. Buffer for scheduling\n5. CarouselEx for carousels\n\nTotal cost: $97/month\nPrevious team cost: $8,000/month\n\nThe future of marketing is one person with the right tools.", "contentType": "thread", "performanceScore": 71, "likes": 180, "comments": 45, "shares": 22, "saves": 156, "impressions": 7200},
        {"hook": "Why your content strategy will fail in 2026", "content": "Why your content strategy will fail in 2026:\n\nYou're still creating content like it's 2023.\n\nShort-form video isn't enough anymore.\nText-based thought leadership is making a comeback.\n\nBut here's the catch: Nobody wants generic advice.\n\nThe winners in 2026 will be creators who:\n- Share real data from their own experiments\n- Take controversial stances\n- Build in public\n\nGeneric content dies. Specific content thrives.", "contentType": "carousel", "performanceScore": 65, "likes": 145, "comments": 23, "shares": 15, "saves": 78, "impressions": 5000},
        {"hook": "How to write a hook that stops the scroll", "content": "How to write a hook that stops the scroll:\n\nStep 1: Start with a number\nStep 2: Add a bold claim\nStep 3: Create urgency\n\nExample: '3 copywriting tricks that made me $50K in 30 days'\n\nNotice: number + bold claim + timeframe.\n\nPractice this formula daily. Your hooks will improve 10x.", "contentType": "viral-post", "performanceScore": 55, "likes": 95, "comments": 12, "shares": 8, "saves": 45, "impressions": 3500},
        {"hook": "The truth about passive income", "content": "The truth about passive income:\n\nIt doesn't exist. Not really.\n\nEvery 'passive' income stream requires:\n- Massive upfront work\n- Ongoing maintenance\n- Constant optimization\n\nBut here's what IS real:\nLeveraged income.\n\nCreate once, distribute many times.\n\nThat's the real game.", "contentType": "viral-post", "performanceScore": 48, "likes": 78, "comments": 15, "shares": 6, "saves": 34, "impressions": 2800},
        {"hook": "Marketing tips for beginners", "content": "Marketing tips for beginners:\n\n1. Know your audience\n2. Create valuable content\n3. Be consistent\n4. Engage with your community\n5. Track your metrics\n\nFollow these steps and you'll see results.", "contentType": "thread", "performanceScore": 25, "likes": 23, "comments": 3, "shares": 1, "saves": 8, "impressions": 1200},
        {"hook": "Here are some thoughts on branding", "content": "Here are some thoughts on branding:\n\nBranding is important. You should have a good brand. Make sure your colors are consistent and your message is clear.\n\nThat's basically it. Good luck with your branding journey!", "contentType": "viral-post", "performanceScore": 12, "likes": 8, "comments": 1, "shares": 0, "saves": 2, "impressions": 800},
    ]

    # Clear existing demo data
    await db.content_history.delete_many({"userId": uid})

    for i, post in enumerate(sample_posts):
        await db.content_history.insert_one({
            "id": str(uuid.uuid4()),
            "userId": uid,
            "content": post["content"],
            "hook": post["hook"],
            "contentType": post["contentType"],
            "mode": "generate",
            "voiceProfileId": None,
            "personaId": None,
            "createdAt": (now - timedelta(days=len(sample_posts) - i)).isoformat(),
            "wasUsedForTraining": False,
            "performanceScore": post["performanceScore"],
            "likes": post["likes"],
            "comments": post["comments"],
            "shares": post["shares"],
            "saves": post["saves"],
            "impressions": post["impressions"],
            "isTopPerformer": post["performanceScore"] >= 78,
        })

    # Seed a voice profile
    await db.voice_profiles.delete_many({"userId": uid})
    await db.voice_profiles.insert_one({
        "id": str(uuid.uuid4()),
        "userId": uid,
        "name": "My Bold Voice",
        "isActive": True,
        "sampleCount": 10,
        "toneDescriptors": ["direct", "data-driven", "provocative", "confident", "action-oriented"],
        "vocabularyPatterns": ["Here's the truth", "The real game", "Stop doing X", "I tested", "The data shows", "Most people", "Simple but powerful"],
        "sentenceStyle": {"avgLength": "short", "usesQuestions": False, "usesBullets": True, "usesNumbers": True, "usesBoldClaims": True, "punctuationStyle": "minimal"},
        "hookPatterns": ["Number-based hooks", "Contrarian statements", "Bold claims with proof", "Pattern interrupts"],
        "avoidPatterns": ["In today's world", "Let's dive in", "Game-changer", "Buckle up", "Without further ado"],
        "voiceSummary": "Writes with sharp, direct authority. Heavy use of numbers and data. Short punchy sentences. Opens with bold claims backed by personal experience. Never uses filler phrases.",
        "rawSamples": [],
        "createdAt": now.isoformat(),
        "updatedAt": now.isoformat(),
    })

    # Seed a persona
    await db.audience_personas.delete_many({"userId": uid})
    await db.audience_personas.insert_one({
        "id": str(uuid.uuid4()),
        "userId": uid,
        "name": "SaaS Founders",
        "role": "Startup Founder / CEO",
        "experienceLevel": "INTERMEDIATE",
        "mainPainPoints": ["Getting first 100 customers", "Content marketing ROI", "Standing out in crowded market", "Limited marketing budget"],
        "mainGoals": ["Build personal brand", "Generate inbound leads", "Establish thought leadership", "Scale content production"],
        "industryContext": "B2B SaaS / Tech startups",
        "vocabularyLevel": "TECHNICAL",
        "avoidTopics": ["Enterprise sales", "Venture capital details", "Corporate jargon"],
        "isActive": True,
        "createdAt": now.isoformat(),
    })

    # Seed content DNA
    await db.content_dna.delete_many({"userId": uid})
    await db.content_dna.insert_one({
        "userId": uid,
        "lastAnalyzedAt": now.isoformat(),
        "topHookTypes": ["Number-based hooks with bold claims", "Contrarian statements challenging common wisdom", "Story-driven openers with personal experience"],
        "topStructures": ["Hook → Problem → Data-backed solution → CTA", "Contrarian claim → Evidence → Framework → Action steps"],
        "avgSlideCount": 7,
        "winningFormulas": ["Start with a specific number or stat in the hook", "Include personal experiment data or results", "End with a clear, actionable single CTA"],
        "avoidFormulas": ["Generic advice without specific examples", "Overly long introductions before value", "Multiple CTAs that dilute the message"],
        "dnaReport": "Your top-performing content consistently features data-driven hooks with specific numbers. Posts that share personal experiment results outperform generic advice by 3x. Your audience responds best to contrarian takes that challenge conventional marketing wisdom. Short, punchy sentences with heavy use of line breaks drive the highest engagement. Your weakest posts tend to be generic listicles without personal experience or data backing them up.",
        "bestPostingTopics": ["content strategy", "marketing automation", "growth hacking"],
        "postsAnalyzed": 10,
    })

    return {"success": True, "message": "Demo data seeded successfully"}



# ============ CAROUSEL BUILDER ENDPOINTS ============
PLATFORM_TONE = {
    "linkedin": "Professional, insight-driven, slightly longer text (15-25 words per slide). Authority + value.",
    "x": "Punchy, short (under 10 words per slide), high contrast, bold claims allowed.",
    "instagram": "Visual-first, minimal text (5-12 words per slide), aesthetic and aspirational.",
    "threads": "Conversational, casual, community-friendly, 10-18 words per slide, like talking to a friend.",
}

SLIDE_TYPES = {"hook", "value", "story", "data", "cta"}


class CarouselGenerateRequest(BaseModel):
    topic: str = ""
    pastedContent: str = ""
    platform: str = "linkedin"
    slideCount: int = 6
    userId: str = "demo-user-001"


@app.post("/api/carousel/generate")
async def carousel_generate(req: CarouselGenerateRequest):
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="LLM key not configured")
    source = req.pastedContent or req.topic
    if not source.strip():
        raise HTTPException(status_code=400, detail="Provide topic or content")
    count = max(4, min(10, req.slideCount))
    tone = PLATFORM_TONE.get(req.platform, PLATFORM_TONE["linkedin"])
    try:
        response = await call_ai(
            f"""You are a viral carousel architect. Generate a structured {count}-slide carousel for {req.platform.upper()}.
Platform tone: {tone}

Structure:
- Slide 1: HOOK (scroll-stopping opener, 1-2 short lines, use number/contrast/curiosity)
- Slides 2 to {count-1}: VALUE slides (mix of value, story, data types)
- Slide {count}: CTA (creator call-to-action, short and direct)

Each slide must have: type, title (short, under 60 chars), body (1-3 sentences), optional tagline.
Return ONLY valid JSON (no markdown):
{{"slides":[{{"type":"hook|value|story|data|cta","title":"...","body":"...","tagline":""}}]}}""",
            f"Topic/content:\n\n{source[:3000]}\n\nGenerate exactly {count} slides."
        )
        data = parse_ai_json(response)
        slides = data.get("slides", [])[:count]
        # Ensure correct types
        for i, s in enumerate(slides):
            if i == 0:
                s["type"] = "hook"
            elif i == len(slides) - 1:
                s["type"] = "cta"
            elif s.get("type") not in SLIDE_TYPES:
                s["type"] = "value"
        return {"success": True, "data": {"slides": slides}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Carousel generation failed: {str(e)}")


class SlideRegenerateRequest(BaseModel):
    slideType: str = "value"
    slideTitle: str = ""
    slideBody: str = ""
    context: str = ""  # Full carousel context
    platform: str = "linkedin"
    topic: str = ""
    userId: str = "demo-user-001"


@app.post("/api/carousel/regenerate-slide")
async def carousel_regenerate_slide(req: SlideRegenerateRequest):
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="LLM key not configured")
    tone = PLATFORM_TONE.get(req.platform, PLATFORM_TONE["linkedin"])
    try:
        response = await call_ai(
            f"""You are a carousel slide expert. Regenerate ONE slide while keeping the same slide TYPE and role in the carousel flow.
Platform: {req.platform.upper()} | Tone: {tone}
Return ONLY valid JSON: {{"title":"...","body":"...","tagline":""}}""",
            f"Slide type: {req.slideType}\nOverall topic: {req.topic}\nSurrounding carousel context: {req.context[:1500]}\n\nCurrent slide (rewrite this completely with a fresh angle):\nTitle: {req.slideTitle}\nBody: {req.slideBody}"
        )
        data = parse_ai_json(response)
        return {"success": True, "data": {
            "title": str(data.get("title", ""))[:120],
            "body": str(data.get("body", ""))[:500],
            "tagline": str(data.get("tagline", ""))[:80],
        }}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Slide regeneration failed: {str(e)}")


class HookSwitchRequest(BaseModel):
    currentHook: str
    style: str = "bold"  # bold | story | controversial
    topic: str = ""
    platform: str = "linkedin"


@app.post("/api/carousel/hook-switch")
async def hook_switch(req: HookSwitchRequest):
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="LLM key not configured")
    style_map = {
        "bold": "a BOLD STATEMENT hook — strong, confident, declarative claim that challenges assumptions",
        "story": "a STORY-BASED hook — personal anecdote opener, 'I did X...' or 'Last week...'",
        "controversial": "a CONTROVERSIAL/PROVOCATIVE hook — contrarian take that sparks debate",
    }
    instruction = style_map.get(req.style, style_map["bold"])
    try:
        response = await call_ai(
            f"Rewrite the opening hook in this style: {instruction}. Platform: {req.platform}. Return ONLY JSON: {{\"title\":\"...\",\"body\":\"...\"}}",
            f"Topic: {req.topic}\nCurrent hook: {req.currentHook}\n\nNew hook ({req.style}):"
        )
        data = parse_ai_json(response)
        return {"success": True, "data": {"title": str(data.get("title", ""))[:120], "body": str(data.get("body", ""))[:300]}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Hook switch failed: {str(e)}")


class FlowOptimizeRequest(BaseModel):
    slides: List[dict]
    topic: str = ""
    platform: str = "linkedin"


@app.post("/api/carousel/flow-optimize")
async def flow_optimize(req: FlowOptimizeRequest):
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="LLM key not configured")
    if len(req.slides) < 3:
        raise HTTPException(status_code=400, detail="Need at least 3 slides to optimize flow")
    slides_str = "\n".join([f"{i+1}. [{s.get('type','value')}] {s.get('title','')} — {s.get('body','')[:100]}" for i, s in enumerate(req.slides)])
    try:
        response = await call_ai(
            f"""You are a narrative flow expert. Reorder and subtly refine these carousel slides for maximum storytelling arc: hook -> tension -> reveal -> value escalation -> payoff -> CTA.
Keep slide 1 as hook, last as CTA. You may reorder middle slides and refine text for better pacing and transitions.
Platform: {req.platform}. Return ONLY JSON:
{{"slides":[{{"type":"...","title":"...","body":"...","tagline":""}}]}}""",
            f"Topic: {req.topic}\nCurrent slides:\n{slides_str}"
        )
        data = parse_ai_json(response)
        return {"success": True, "data": {"slides": data.get("slides", req.slides)}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Flow optimization failed: {str(e)}")


class BalanceTextRequest(BaseModel):
    slides: List[dict]
    platform: str = "linkedin"


@app.post("/api/carousel/balance-text")
async def balance_text(req: BalanceTextRequest):
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="LLM key not configured")
    tone = PLATFORM_TONE.get(req.platform, PLATFORM_TONE["linkedin"])
    slides_str = "\n".join([f"{i+1}. Title: {s.get('title','')} | Body: {s.get('body','')}" for i, s in enumerate(req.slides)])
    try:
        response = await call_ai(
            f"""You are a content density balancer. Rewrite each slide so text length is consistent and NO slide is overloaded.
Platform: {req.platform} | Tone: {tone}
Rules: Titles under 60 chars. Bodies 1-2 concise sentences. Consistent visual weight across all slides.
Return ONLY JSON: {{"slides":[{{"type":"...","title":"...","body":"...","tagline":""}}]}}""",
            f"Current slides:\n{slides_str}"
        )
        data = parse_ai_json(response)
        return {"success": True, "data": {"slides": data.get("slides", req.slides)}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Balance failed: {str(e)}")


class SlideStrengthRequest(BaseModel):
    title: str = ""
    body: str = ""
    slideType: str = "value"


@app.post("/api/slide-strength")
async def slide_strength(req: SlideStrengthRequest):
    """Heuristic-based slide strength (no LLM call for speed)."""
    text = f"{req.title} {req.body}".strip()
    word_count = len(text.split())
    score = 50  # base

    # Length scoring
    if req.slideType == "hook":
        if 4 <= word_count <= 15: score += 15
        elif word_count > 30: score -= 15
    else:
        if 10 <= word_count <= 40: score += 15
        elif word_count > 60: score -= 20
        elif word_count < 5: score -= 15

    # Engagement language
    engagement_words = ["you", "your", "stop", "never", "always", "truth", "secret", "why", "how", "what", "proof"]
    if any(w in text.lower() for w in engagement_words): score += 10

    # Numbers / stats
    if any(c.isdigit() for c in text): score += 10

    # Punctuation variety
    if "?" in text or "!" in text: score += 5

    # Title presence
    if req.title.strip(): score += 5

    score = max(0, min(100, score))
    strength = "Strong" if score >= 70 else "Weak" if score < 45 else "Medium"
    hint = ""
    if strength == "Weak":
        if word_count > 50: hint = "Too much text — simplify"
        elif word_count < 5: hint = "Needs more substance"
        elif req.slideType == "hook": hint = "Hook could be stronger"
        else: hint = "Add specificity or a number"
    elif strength == "Medium":
        hint = "Good — could be sharper"

    return {"success": True, "data": {"score": score, "strength": strength, "hint": hint}}


# ============ IMAGE GENERATION ============
class ImageGenerateRequest(BaseModel):
    prompt: str
    userId: str = "demo-user-001"


@app.post("/api/generate-image")
async def generate_image(req: ImageGenerateRequest):
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="LLM key not configured")
    if not req.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt required")
    try:
        import base64
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=OPENAI_API_KEY)
        response = await client.images.generate(
            model="dall-e-3",
            prompt=req.prompt[:1000],
            n=1,
            size="1024x1024",
            response_format="b64_json",
        )
        if not response.data:
            raise HTTPException(status_code=500, detail="No image returned")
        image_base64 = response.data[0].b64_json
        return {"success": True, "data": {"image": f"data:image/png;base64,{image_base64}"}}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image generation failed: {str(e)}")



# ============ FEATURE: AI CONTENT GENERATOR (multipart: topic + optional image/video) ============
_ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
_ALLOWED_VIDEO_TYPES = {"video/mp4", "video/quicktime", "video/mov"}
_MAX_IMAGE_BYTES = 10 * 1024 * 1024  # 10MB
_MAX_VIDEO_BYTES = 50 * 1024 * 1024  # 50MB


async def _extract_video_first_frame(video_bytes: bytes, ext: str) -> Optional[bytes]:
    """Extract first frame from video using ffmpeg (if available). Returns JPEG bytes or None."""
    import tempfile
    import subprocess
    import shutil as _shutil
    if not _shutil.which("ffmpeg"):
        return None
    try:
        with tempfile.NamedTemporaryFile(suffix=f".{ext}", delete=False) as vf:
            vf.write(video_bytes)
            video_path = vf.name
        out_path = video_path + "_frame.jpg"
        proc = await asyncio.create_subprocess_exec(
            "ffmpeg", "-y", "-i", video_path, "-vframes", "1", "-q:v", "3", out_path,
            stdout=asyncio.subprocess.DEVNULL, stderr=asyncio.subprocess.DEVNULL,
        )
        await proc.communicate()
        try:
            with open(out_path, "rb") as f:
                frame = f.read()
            return frame
        finally:
            try: os.unlink(video_path)
            except Exception: pass
            try: os.unlink(out_path)
            except Exception: pass
    except Exception as e:
        print(f"[ai-content] ffmpeg extraction failed: {e}")
        return None


@app.post("/api/ai-content/generate")
async def ai_content_generate(
    topic: str = Form(""),
    image: Optional[UploadFile] = File(None),
    video: Optional[UploadFile] = File(None),
):
    """Generate AI-optimized content (title, description, hashtags, keywords) from topic and/or media."""
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="LLM key not configured")

    if not topic.strip() and not image and not video:
        raise HTTPException(status_code=400, detail="Provide a topic or upload media")

    try:
        import base64
        image_b64: Optional[str] = None
        image_mime: str = "image/jpeg"

        if image is not None:
            if image.content_type not in _ALLOWED_IMAGE_TYPES:
                raise HTTPException(status_code=400, detail="Unsupported image type (use JPG, PNG, WEBP)")
            img_bytes = await image.read()
            if len(img_bytes) > _MAX_IMAGE_BYTES:
                raise HTTPException(status_code=400, detail="Image too large (max 10MB)")
            image_b64 = base64.b64encode(img_bytes).decode("ascii")
            image_mime = image.content_type or "image/jpeg"

        elif video is not None:
            if video.content_type not in _ALLOWED_VIDEO_TYPES:
                raise HTTPException(status_code=400, detail="Unsupported video type (use MP4, MOV)")
            vid_bytes = await video.read()
            if len(vid_bytes) > _MAX_VIDEO_BYTES:
                raise HTTPException(status_code=400, detail="Video too large (max 50MB)")
            ext = "mp4" if "mp4" in (video.content_type or "") else "mov"
            frame = await _extract_video_first_frame(vid_bytes, ext)
            if frame:
                image_b64 = base64.b64encode(frame).decode("ascii")
                image_mime = "image/jpeg"

        system_prompt = (
            "You are an expert social media content strategist. Analyze the provided topic and/or media "
            "and return ONLY a valid JSON object with this exact shape: "
            '{"title": string (compelling, max 80 chars), '
            '"description": string (engaging post caption, 150-200 words), '
            '"hashtags": string[] (15 relevant hashtags, no # prefix), '
            '"keywords": string[] (10 SEO keywords), '
            '"contentType": string (e.g. "Educational", "Inspirational", "Promotional"), '
            '"estimatedReach": string ("High", "Medium", or "Low")}. '
            "Return ONLY the JSON. No markdown. No explanation."
        )

        user_content: List[dict] = []
        user_text = topic.strip() or "Analyze the attached media and generate optimized content."
        user_content.append({"type": "text", "text": user_text})
        if image_b64:
            user_content.append({
                "type": "image_url",
                "image_url": {"url": f"data:{image_mime};base64,{image_b64}"},
            })

        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=OPENAI_API_KEY)
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content},
            ],
            temperature=0.7,
            response_format={"type": "json_object"},
        )
        raw = response.choices[0].message.content or "{}"
        data = parse_ai_json(raw)

        # Normalize fields
        data["title"] = str(data.get("title", ""))[:120]
        data["description"] = str(data.get("description", ""))
        data["hashtags"] = [str(h).lstrip("#").strip() for h in (data.get("hashtags") or [])][:15]
        data["keywords"] = [str(k).strip() for k in (data.get("keywords") or [])][:10]
        data["contentType"] = str(data.get("contentType", "Educational"))
        reach = str(data.get("estimatedReach", "Medium"))
        data["estimatedReach"] = reach if reach in ("High", "Medium", "Low") else "Medium"

        return data
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ai-content/generate] {e}")
        raise HTTPException(status_code=500, detail={"error": "Generation failed", "detail": str(e)})


# ============ FEATURE: VIRAL CAROUSEL IDEAS (with DataForSEO + OpenAI) ============
_carousel_cache: dict = {}  # {key: (timestamp, data)}
_CAROUSEL_CACHE_TTL = 30 * 60  # 30 minutes


async def _fetch_dataforseo_trends(niche: str) -> List[str]:
    """Fetch trending search terms from DataForSEO. Returns [] on failure."""
    import base64 as _b64
    login = os.environ.get("DATAFORSEO_LOGIN")
    password = os.environ.get("DATAFORSEO_PASSWORD")
    if not login or not password:
        return []
    try:
        import httpx
        auth = _b64.b64encode(f"{login}:{password}".encode()).decode()
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.post(
                "https://api.dataforseo.com/v3/keywords_data/google_trends/explore/live",
                headers={"Authorization": f"Basic {auth}", "Content-Type": "application/json"},
                json=[{"keywords": [niche], "type": "web", "date_from": "2024-01-01"}],
            )
            if resp.status_code != 200:
                return []
            data = resp.json()
            topics: List[str] = []
            for task in data.get("tasks", []) or []:
                for result in task.get("result", []) or []:
                    for item in result.get("items", []) or []:
                        for keyword in item.get("keywords", []) or []:
                            if isinstance(keyword, str):
                                topics.append(keyword)
            return topics[:10]
    except Exception as e:
        print(f"[dataforseo] error: {e}")
        return []


@app.get("/api/carousel-ideas")
async def carousel_ideas_get(platform: str = "Instagram", niche: str = "marketing"):
    """Generate 7 viral carousel ideas personalized to platform + niche."""
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="LLM key not configured")

    platform = platform.strip() or "Instagram"
    niche = niche.strip() or "marketing"
    cache_key = f"{platform.lower()}::{niche.lower()}"

    # Cache check
    now_ts = time.time()
    cached = _carousel_cache.get(cache_key)
    if cached and (now_ts - cached[0] < _CAROUSEL_CACHE_TTL):
        return cached[1]

    try:
        trending = await _fetch_dataforseo_trends(niche)
        trending_str = ", ".join(trending) if trending else "(no external trends available — rely on your knowledge)"

        system_prompt = (
            f"You are a viral content strategist specializing in {platform} carousels. "
            f"Based on these trending topics: {trending_str}. And this niche: {niche}. "
            "Generate exactly 7 viral carousel ideas. Return ONLY a valid JSON object with key 'ideas' that is an array: "
            '{"ideas":[{'
            '"id": string (uuid), '
            '"title": string (carousel title, max 60 chars), '
            '"hook": string (first slide hook text, max 100 chars), '
            '"slides": number (recommended slide count, 5-10), '
            '"engagementScore": number (1-10, can be decimal), '
            '"trendingTag": string (one trending topic it leverages), '
            '"format": string ("Educational" | "Story" | "Tips" | "Listicle" | "Comparison")'
            "}]}. Return ONLY the JSON. No markdown. No explanation."
        )

        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=OPENAI_API_KEY)
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Platform: {platform}\nNiche: {niche}\nGenerate 7 viral carousel ideas now."},
            ],
            temperature=0.8,
            response_format={"type": "json_object"},
        )
        raw = response.choices[0].message.content or "{}"
        parsed = parse_ai_json(raw)
        ideas = parsed.get("ideas") if isinstance(parsed, dict) else parsed
        if not isinstance(ideas, list):
            ideas = []

        # Normalize
        normalized: List[dict] = []
        allowed_formats = {"Educational", "Story", "Tips", "Listicle", "Comparison"}
        for idea in ideas[:7]:
            if not isinstance(idea, dict):
                continue
            fmt = str(idea.get("format", "Educational"))
            if fmt not in allowed_formats:
                fmt = "Educational"
            try:
                slides = int(idea.get("slides", 7))
            except Exception:
                slides = 7
            slides = max(5, min(10, slides))
            try:
                score = float(idea.get("engagementScore", 7))
            except Exception:
                score = 7.0
            score = max(1.0, min(10.0, round(score, 1)))
            normalized.append({
                "id": str(idea.get("id") or uuid.uuid4()),
                "title": str(idea.get("title", ""))[:80],
                "hook": str(idea.get("hook", ""))[:140],
                "slides": slides,
                "engagementScore": score,
                "trendingTag": str(idea.get("trendingTag", ""))[:60],
                "format": fmt,
            })

        result = {"ideas": normalized, "platform": platform, "niche": niche, "usedTrends": bool(trending)}
        _carousel_cache[cache_key] = (now_ts, result)
        return result
    except Exception as e:
        print(f"[carousel-ideas] {e}")
        raise HTTPException(status_code=500, detail={"error": "Carousel idea generation failed", "detail": str(e)})


# ============ FEATURE: USER PREFERENCES (Supabase-backed) ============
class UserPrefUpsert(BaseModel):
    user_id: str
    platform: str
    niche: str
    is_setup_complete: bool = True


@app.get("/api/user-preferences")
async def user_preferences_get(userId: str):
    """Get user preferences from Supabase. Returns null if not found."""
    if not _supabase:
        return {"data": None}
    try:
        def _run():
            return _supabase.table("user_preferences").select("*").eq("user_id", userId).limit(1).execute()
        res = await asyncio.to_thread(_run)
        rows = getattr(res, "data", None) or []
        if not rows:
            return {"data": None}
        row = rows[0]
        return {"data": {
            "platform": row.get("platform"),
            "niche": row.get("niche"),
            "isSetupComplete": bool(row.get("is_setup_complete")),
        }}
    except Exception as e:
        print(f"[user-preferences GET] {e}")
        return {"data": None}


@app.post("/api/user-preferences")
async def user_preferences_upsert(req: UserPrefUpsert):
    """Upsert user preferences to Supabase."""
    if not _supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    try:
        payload = {
            "user_id": req.user_id,
            "platform": req.platform,
            "niche": req.niche,
            "is_setup_complete": req.is_setup_complete,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        def _run():
            return _supabase.table("user_preferences").upsert(payload, on_conflict="user_id").execute()
        res = await asyncio.to_thread(_run)
        rows = getattr(res, "data", None) or []
        return {"success": True, "data": rows[0] if rows else payload}
    except Exception as e:
        print(f"[user-preferences POST] {e}")
        raise HTTPException(status_code=500, detail={"error": "Save failed", "detail": str(e)})
