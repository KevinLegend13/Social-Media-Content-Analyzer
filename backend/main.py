import os
import uuid
from pathlib import Path
from dotenv import load_dotenv

_backend_dir = Path(__file__).resolve().parent
_root_dir = _backend_dir.parent
_env_path = _root_dir / ".env"
if _env_path.exists():
    load_dotenv(dotenv_path=_env_path)
else:
    load_dotenv(dotenv_path=_backend_dir / ".env")

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response


from models.schemas import HealthResponse, ExtractionResponse, GeminiStatusResponse
from services.file_validator import (
    ALLOWED_EXTENSIONS,
    ALLOWED_MIME_TYPES,
    MAX_FILE_SIZE,
    get_file_extension,
    detect_file_type_from_bytes,
    get_extension_to_type,
)
from services.text_extractor import extract_text_from_pdf, render_pdf_pages_to_images
from services.ocr_service import ocr_image, ocr_pdf_pages, check_tesseract_available
from services.content_analyzer import analyze_content
from services.gemini_service import get_gemini_status, generate_gemini_interpretation

app = FastAPI(
    title="Social Media Content Analyzer API",
    version="1.0.0",
)

cors_origins_env = os.environ.get("CORS_ORIGINS", "*").strip()
if cors_origins_env == "*" or not cors_origins_env:
    cors_origins = ["*"]
    allow_credentials = False
else:
    cors_origins = [o.strip() for o in cors_origins_env.split(",") if o.strip()]
    for dev_origin in ("http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"):
        if dev_origin not in cors_origins:
            cors_origins.append(dev_origin)
    allow_credentials = True

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"https://.*\.netlify\.app" if "*" not in cors_origins else None,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

_file_store: dict[str, tuple[bytes, str]] = {}


@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(status="ok", message="API is running")


@app.get("/api/tesseract")
async def tesseract_status():
    return check_tesseract_available()


@app.get("/api/gemini/status", response_model=GeminiStatusResponse)
async def gemini_status():
    return get_gemini_status()



@app.post("/api/upload", response_model=ExtractionResponse)
async def upload_and_extract(file: UploadFile = File(...)):
    filename = file.filename or ""
    ext = get_file_extension(filename)

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail={
                "success": False,
                "message": f"Unsupported file type '{ext}'. Allowed: PDF, PNG, JPG, JPEG.",
            },
        )

    content = await file.read()

    if len(content) == 0:
        raise HTTPException(
            status_code=400,
            detail={
                "success": False,
                "message": "File is empty. Please upload a valid file.",
            },
        )

    if len(content) > MAX_FILE_SIZE:
        size_mb = round(MAX_FILE_SIZE / (1024 * 1024))
        raise HTTPException(
            status_code=413,
            detail={
                "success": False,
                "message": f"File too large. Maximum size is {size_mb} MB.",
            },
        )

    if file.content_type and file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail={
                "success": False,
                "message": f"Invalid file type '{file.content_type}'. Allowed: application/pdf, image/png, image/jpeg.",
            },
        )

    header = content[:8]
    detected_type = detect_file_type_from_bytes(header)
    if detected_type is None:
        raise HTTPException(
            status_code=400,
            detail={
                "success": False,
                "message": "File content does not match a supported format.",
            },
        )

    ext_type = get_extension_to_type(ext)
    if detected_type == "jpg" and ext_type == "jpeg":
        detected_type = "jpeg"

    download_id = str(uuid.uuid4())
    _file_store[download_id] = (content, file.content_type or "application/octet-stream")

    try:
        if detected_type == "pdf":
            result = _process_pdf(content, filename, detected_type, len(content), download_id)
        else:
            result = _process_image(content, filename, detected_type, len(content), download_id)
        return result
    except HTTPException:
        _file_store.pop(download_id, None)
        raise
    except Exception:
        _file_store.pop(download_id, None)
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "message": "An unexpected error occurred while processing the file.",
            },
        )


@app.get("/api/download/{download_id}")
async def download_file(download_id: str):
    if download_id not in _file_store:
        raise HTTPException(status_code=404, detail="File not found or expired.")
    content, content_type = _file_store[download_id]
    return Response(content=content, media_type=content_type)


def _build_analysis(text: str, word_count: int, character_count: int) -> dict | None:
    if not text:
        return None
    return analyze_content(text, word_count=word_count, character_count=character_count)


def _build_ai_analysis(analysis: dict | None, extracted_text: str):
    if not analysis:
        return None
    try:
        return generate_gemini_interpretation(analysis, extracted_text)
    except Exception:
        return None


def _process_pdf(content: bytes, filename: str, file_type: str, file_size: int, download_id: str) -> ExtractionResponse:
    result = extract_text_from_pdf(content)

    if result["success"]:
        analysis = _build_analysis(result["extracted_text"], result["word_count"], result["character_count"])
        ai_analysis = _build_ai_analysis(analysis, result["extracted_text"])
        return ExtractionResponse(
            success=True,
            filename=filename,
            file_type=file_type,
            file_size=file_size,
            message=result["message"],
            extracted_text=result["extracted_text"],
            page_count=result["page_count"],
            extraction_method=result["extraction_method"],
            character_count=result["character_count"],
            word_count=result["word_count"],
            analysis=analysis,
            ai_analysis=ai_analysis,
            download_id=download_id,
        )

    if result.get("needs_ocr"):
        tesseract_status = check_tesseract_available()
        if not tesseract_status["available"]:
            return ExtractionResponse(
                success=False,
                filename=filename,
                file_type=file_type,
                file_size=file_size,
                message="This PDF appears to be scanned/image-only. OCR is required but Tesseract is not available.",
                extracted_text="",
                page_count=result["page_count"],
                extraction_method="pdf_ocr",
                character_count=0,
                word_count=0,
                ai_analysis=None,
                download_id=download_id,
            )

        page_images = render_pdf_pages_to_images(content)
        if not page_images:
            return ExtractionResponse(
                success=False,
                filename=filename,
                file_type=file_type,
                file_size=file_size,
                message="Could not render PDF pages for OCR processing.",
                extracted_text="",
                page_count=result["page_count"],
                extraction_method="pdf_ocr",
                character_count=0,
                word_count=0,
                ai_analysis=None,
                download_id=download_id,
            )

        ocr_result = ocr_pdf_pages(page_images)
        analysis = None
        ai_analysis = None
        if ocr_result["success"] and ocr_result["extracted_text"]:
            analysis = _build_analysis(ocr_result["extracted_text"], ocr_result["word_count"], ocr_result["character_count"])
            ai_analysis = _build_ai_analysis(analysis, ocr_result["extracted_text"])
        return ExtractionResponse(
            success=ocr_result["success"],
            filename=filename,
            file_type=file_type,
            file_size=file_size,
            message=ocr_result["message"],
            extracted_text=ocr_result["extracted_text"],
            page_count=ocr_result.get("page_count", result["page_count"]),
            extraction_method="pdf_ocr",
            character_count=ocr_result["character_count"],
            word_count=ocr_result["word_count"],
            analysis=analysis,
            ai_analysis=ai_analysis,
            download_id=download_id,
        )

    return ExtractionResponse(
        success=False,
        filename=filename,
        file_type=file_type,
        file_size=file_size,
        message=result["message"],
        extracted_text="",
        page_count=result["page_count"],
        extraction_method="pdf_text",
        character_count=0,
        word_count=0,
        ai_analysis=None,
        download_id=download_id,
    )


def _process_image(content: bytes, filename: str, file_type: str, file_size: int, download_id: str) -> ExtractionResponse:
    result = ocr_image(content)
    analysis = None
    ai_analysis = None
    if result["success"] and result["extracted_text"]:
        analysis = _build_analysis(result["extracted_text"], result["word_count"], result["character_count"])
        ai_analysis = _build_ai_analysis(analysis, result["extracted_text"])
    return ExtractionResponse(
        success=result["success"],
        filename=filename,
        file_type=file_type,
        file_size=file_size,
        message=result["message"],
        extracted_text=result["extracted_text"],
        page_count=1,
        extraction_method="image_ocr",
        character_count=result["character_count"],
        word_count=result["word_count"],
        analysis=analysis,
        ai_analysis=ai_analysis,
        download_id=download_id,
    )


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    uvicorn.run("main:app", host=host, port=port, reload=False)


