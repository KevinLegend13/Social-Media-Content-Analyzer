import pymupdf


def _clean_page_text(raw_text: str) -> str:
    lines = raw_text.split("\n")
    cleaned = []
    for line in lines:
        stripped = line.rstrip()
        cleaned.append(stripped)
    text = "\n".join(cleaned)
    while "\n\n\n" in text:
        text = text.replace("\n\n\n", "\n\n")
    return text.strip()


def extract_text_from_pdf(pdf_bytes: bytes) -> dict:
    try:
        doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
    except Exception:
        return {
            "success": False,
            "message": "Could not open the PDF. The file may be corrupted.",
            "extracted_text": "",
            "page_count": 0,
            "extraction_method": "pdf_text",
            "character_count": 0,
            "word_count": 0,
        }

    page_count = len(doc)
    if page_count == 0:
        doc.close()
        return {
            "success": False,
            "message": "The PDF contains no pages.",
            "extracted_text": "",
            "page_count": 0,
            "extraction_method": "pdf_text",
            "character_count": 0,
            "word_count": 0,
        }

    pages_text = []
    total_chars = 0
    for page_num in range(page_count):
        page = doc[page_num]
        raw = page.get_text("text")
        cleaned = _clean_page_text(raw)
        pages_text.append(cleaned)
        total_chars += len(cleaned)
    doc.close()

    avg_chars_per_page = total_chars / page_count if page_count > 0 else 0
    has_meaningful_text = avg_chars_per_page > 20

    if not has_meaningful_text:
        return {
            "success": False,
            "message": "No extractable text found. This may be a scanned/image-only PDF.",
            "extracted_text": "",
            "page_count": page_count,
            "extraction_method": "pdf_text",
            "character_count": 0,
            "word_count": 0,
            "needs_ocr": True,
            "page_texts": pages_text,
        }

    separators = []
    for i, page_text in enumerate(pages_text):
        if i > 0 and page_text:
            separators.append(f"\n\n--- Page {i + 1} ---\n\n")
        elif i > 0:
            separators.append(f"\n\n--- Page {i + 1} ---\n\n")

    parts = []
    for i, page_text in enumerate(pages_text):
        if i > 0:
            parts.append(separators[i - 1])
        parts.append(page_text)

    full_text = "".join(parts).strip()
    word_count = len(full_text.split()) if full_text else 0

    return {
        "success": True,
        "message": f"Text extracted from {page_count} page(s).",
        "extracted_text": full_text,
        "page_count": page_count,
        "extraction_method": "pdf_text",
        "character_count": len(full_text),
        "word_count": word_count,
        "needs_ocr": False,
    }


def render_pdf_pages_to_images(pdf_bytes: bytes, dpi: int = 300) -> list:
    try:
        doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
    except Exception:
        return []

    images = []
    zoom = dpi / 72
    matrix = pymupdf.Matrix(zoom, zoom)
    for page_num in range(len(doc)):
        page = doc[page_num]
        pix = page.get_pixmap(matrix=matrix)
        img_bytes = pix.tobytes("png")
        images.append(img_bytes)
    doc.close()
    return images
