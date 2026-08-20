from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    message: str


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
