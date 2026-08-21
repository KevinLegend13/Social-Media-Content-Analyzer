import json
import logging
import os
from google import genai

from models.schemas import AIAnalysis, GeminiStatusResponse

logger = logging.getLogger(__name__)


def get_gemini_status() -> dict:
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    model = os.environ.get("GEMINI_MODEL", "").strip()

    if not api_key:
        return GeminiStatusResponse(
            available=False,
            configured=False,
            model=None,
            message="GEMINI_API_KEY environment variable is missing.",
        ).model_dump()

    if not model:
        return GeminiStatusResponse(
            available=False,
            configured=False,
            model=None,
            message="GEMINI_MODEL environment variable is missing.",
        ).model_dump()

    return GeminiStatusResponse(
        available=True,
        configured=True,
        model=model,
        message="Gemini is available.",
    ).model_dump()


def generate_gemini_interpretation(analysis: dict, text: str = "") -> AIAnalysis | None:
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    model = os.environ.get("GEMINI_MODEL", "").strip()

    if not api_key or not model or not analysis:
        return None

    # Token optimization: Build compact structured context
    metrics = analysis.get("metrics", {})
    suitability = analysis.get("suitability", {})
    if isinstance(suitability, str):
        suitability_dict = {"suitability": suitability}
    else:
        suitability_dict = suitability or {}

    content_type = analysis.get("content_type") or suitability_dict.get("content_type", "unknown")
    score_applicability = analysis.get("score_applicability") or suitability_dict.get("score_applicability", "medium")

    compact_context = {
        "content_type": content_type,
        "suitability": suitability_dict.get("label") or suitability_dict.get("suitability", "unknown"),
        "suitability_confidence": analysis.get("suitability_confidence") or suitability_dict.get("suitability_confidence", 0),
        "score_applicability": score_applicability,
        "score_applicability_reason": analysis.get("score_applicability_reason") or suitability_dict.get("score_applicability_reason", ""),
        "engagement_score": analysis.get("engagement_score", 0),
        "metrics": {
            "word_count": metrics.get("word_count", 0),
            "sentence_count": metrics.get("sentence_count", 0),
            "average_sentence_length": metrics.get("average_sentence_length", 0),
            "hashtag_count": metrics.get("hashtag_count", 0),
            "question_count": metrics.get("question_count", 0),
            "exclamation_count": metrics.get("exclamation_count", 0),
            "emoji_count": metrics.get("emoji_count", 0),
            "line_break_count": metrics.get("line_break_count", 0),
            "has_cta": metrics.get("has_cta", False),
            "has_hook": metrics.get("has_hook", False),
            "has_bullet_points": metrics.get("has_bullet_points", False),
        },
        "score_breakdown": analysis.get("score_breakdown", {}),
        "strengths": analysis.get("strengths", []),
        "suggestions": analysis.get("suggestions", []),
        "classification_reasons": analysis.get("classification_reasons") or suitability_dict.get("classification_reasons", []),
    }

    # Selective text snippet for social media content only (max 500 chars)
    is_social = content_type == "social_media" or suitability_dict.get("label") == "likely_social_media"
    if is_social and text and text.strip():
        compact_context["sample_text_snippet"] = text.strip()[:500]

    system_instruction = (
        "You are an AI interpretation layer for a social-media content analyzer. "
        "The supplied deterministic analysis metrics, engagement scores, and suitability classifications are authoritative. "
        "Do NOT recalculate scores, modify metrics, or invent features (such as CTAs, hashtags, or hooks) that were not detected. "
        "If score_applicability is low or content is a document, explain clearly that the engagement score has limited applicability. "
        "Provide a concise, grounded, structured JSON interpretation."
    )

    prompt = (
        f"{system_instruction}\n\n"
        f"Deterministic Analysis Data:\n{json.dumps(compact_context, indent=2)}\n\n"
        "Generate a structured AI interpretation matching the JSON schema."
    )

    try:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model=model,
            contents=prompt,
            config={
                "response_mime_type": "application/json",
                "response_schema": AIAnalysis,
            },
        )

        raw_text = response.text if hasattr(response, "text") and response.text else ""
        if not raw_text:
            return None

        parsed_data = json.loads(raw_text)
        validated_ai_analysis = AIAnalysis.model_validate(parsed_data)
        return validated_ai_analysis
    except Exception as e:
        logger.warning("Gemini interpretation generation failed: %s", e)
        return None
