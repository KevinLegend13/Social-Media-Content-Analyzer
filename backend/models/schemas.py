from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    message: str


class ContentMetrics(BaseModel):
    word_count: int
    character_count: int
    sentence_count: int
    average_sentence_length: float
    hashtag_count: int
    question_count: int
    exclamation_count: int
    emoji_count: int
    line_break_count: int
    has_cta: bool
    has_hook: bool
    has_bullet_points: bool
    cta_found: list[str]


class SuitabilityInfo(BaseModel):
    label: str
    suitability: str
    reasons: list[str]
    content_type: str
    suitability_confidence: int
    score_applicability: str
    score_applicability_reason: str
    classification_reasons: list[str]


class ContentAnalysis(BaseModel):
    metrics: ContentMetrics
    engagement_score: int
    score_breakdown: dict[str, int]
    score_explanations: dict[str, dict]
    suitability: SuitabilityInfo
    content_type: str
    suitability_confidence: int
    score_applicability: str
    score_applicability_reason: str
    classification_reasons: list[str]
    strengths: list[str]
    improvements: list[str]
    suggestions: list[str]


class ExtractionResponse(BaseModel):
    success: bool
    filename: str
    file_type: str
    file_size: int
    message: str
    extracted_text: str
    page_count: int
    extraction_method: str
    character_count: int
    word_count: int
    analysis: ContentAnalysis | dict | None = None
    download_id: str | None = None

