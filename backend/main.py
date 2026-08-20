from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from models.schemas import HealthResponse, ExtractionResponse
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

app = FastAPI(
    title="Social Media Content Analyzer API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(status="ok", message="API is running")


@app.get("/api/tesseract")
async def tesseract_status():
    return check_tesseract_available()


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

    try:
        if detected_type == "pdf":
            result = _process_pdf(content, filename, detected_type, len(content))
        else:
            result = _process_image(content, filename, detected_type, len(content))
        return result
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "message": "An unexpected error occurred while processing the file.",
            },
        )


def _process_pdf(content: bytes, filename: str, file_type: str, file_size: int) -> ExtractionResponse:
    result = extract_text_from_pdf(content)

    if result["success"]:
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
            )

        ocr_result = ocr_pdf_pages(page_images)
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
    )


def _process_image(content: bytes, filename: str, file_type: str, file_size: int) -> ExtractionResponse:
    result = ocr_image(content)
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
    )
