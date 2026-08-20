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
    analysis: dict | None = None
