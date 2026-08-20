import io
import os

import pytesseract
from PIL import Image, ImageEnhance, ImageFilter

_TESSERACT_PATHS = [
    r"C:\Program Files\Tesseract-OCR\tesseract.exe",
    r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
    "/usr/bin/tesseract",
    "/usr/local/bin/tesseract",
    "/opt/homebrew/bin/tesseract",
]


def _configure_tesseract():
    try:
        pytesseract.get_tesseract_version()
        return True
    except pytesseract.TesseractNotFoundError:
        pass

    for path in _TESSERACT_PATHS:
        if os.path.isfile(path):
            pytesseract.pytesseract.tesseract_cmd = path
            try:
                pytesseract.get_tesseract_version()
                return True
            except pytesseract.TesseractError:
                continue

    return False


TESSERACT_AVAILABLE = _configure_tesseract()


def check_tesseract_available() -> dict:
    if not TESSERACT_AVAILABLE:
        return {
            "available": False,
            "message": "Tesseract OCR is not installed or not found. Please install Tesseract and try again.",
        }
    version = pytesseract.get_tesseract_version()
    return {
        "available": True,
        "message": f"Tesseract OCR v{version} is available.",
        "version": str(version),
    }


def _preprocess_image(img: Image.Image) -> Image.Image:
    if img.mode != "RGB":
        img = img.convert("RGB")

    width, height = img.size
    if width < 300 or height < 300:
        scale = max(300 / width, 300 / height)
        new_w = int(width * scale)
        new_h = int(height * scale)
        img = img.resize((new_w, new_h), Image.LANCZOS)

    img = img.convert("L")
    img = ImageEnhance.Contrast(img).enhance(1.5)
    img = img.filter(ImageFilter.SHARPEN)
    return img


def ocr_image(image_bytes: bytes) -> dict:
    if not TESSERACT_AVAILABLE:
        return {
            "success": False,
            "message": "Tesseract OCR is not available. Please install Tesseract and try again.",
            "extracted_text": "",
            "character_count": 0,
            "word_count": 0,
        }

    try:
        img = Image.open(io.BytesIO(image_bytes))
    except Exception:
        return {
            "success": False,
            "message": "Could not open the image. The file may be corrupted or invalid.",
            "extracted_text": "",
            "character_count": 0,
            "word_count": 0,
        }

    try:
        processed = _preprocess_image(img)
        raw_text = pytesseract.image_to_string(processed, lang="eng")
        text = raw_text.strip()
        while "\n\n\n" in text:
            text = text.replace("\n\n\n", "\n\n")

        if not text:
            return {
                "success": True,
                "message": "OCR completed but no readable text was found in the image.",
                "extracted_text": "",
                "character_count": 0,
                "word_count": 0,
            }

        word_count = len(text.split())
        return {
            "success": True,
            "message": "Text extracted from image using OCR.",
            "extracted_text": text,
            "character_count": len(text),
            "word_count": word_count,
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"OCR processing failed: {str(e)}",
            "extracted_text": "",
            "character_count": 0,
            "word_count": 0,
        }


def ocr_pdf_pages(page_images: list) -> dict:
    if not TESSERACT_AVAILABLE:
        return {
            "success": False,
            "message": "Tesseract OCR is not available. Please install Tesseract and try again.",
            "extracted_text": "",
            "page_count": 0,
            "character_count": 0,
            "word_count": 0,
        }

    if not page_images:
        return {
            "success": False,
            "message": "No pages available for OCR processing.",
            "extracted_text": "",
            "page_count": 0,
            "character_count": 0,
            "word_count": 0,
        }

    page_texts = []
    for i, img_bytes in enumerate(page_images):
        try:
            img = Image.open(io.BytesIO(img_bytes))
            processed = _preprocess_image(img)
            raw_text = pytesseract.image_to_string(processed, lang="eng")
            text = raw_text.strip()
            while "\n\n\n" in text:
                text = text.replace("\n\n\n", "\n\n")
            page_texts.append(text)
        except Exception:
            page_texts.append("")

    parts = []
    for i, text in enumerate(page_texts):
        if i > 0:
            parts.append(f"\n\n--- Page {i + 1} ---\n\n")
        parts.append(text)

    full_text = "".join(parts).strip()
    word_count = len(full_text.split()) if full_text else 0

    if not full_text:
        return {
            "success": True,
            "message": "OCR completed across all pages but no readable text was found.",
            "extracted_text": "",
            "page_count": len(page_images),
            "character_count": 0,
            "word_count": 0,
        }

    return {
        "success": True,
        "message": f"Text extracted from {len(page_images)} page(s) using OCR.",
        "extracted_text": full_text,
        "page_count": len(page_images),
        "character_count": len(full_text),
        "word_count": word_count,
    }
