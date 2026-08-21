# Social Media Content Analyzer

A full-stack web application that accepts PDF and image uploads, extracts text (with OCR fallback for scanned documents), and produces a heuristic engagement analysis with scoring, suitability assessment, breakdown metrics, and actionable suggestions.

## Features

- Drag-and-drop and file picker upload
- Client-side and server-side file validation (extension, MIME type, magic bytes, size)
- PDF text extraction via PyMuPDF
- OCR fallback for scanned/image-only PDFs and PNG/JPG images via Tesseract
- Social-media suitability detection (likely/possibly/not social media)
- Rule-based content analysis: engagement score (0-100), 9-component breakdown with explanations, 13 content metrics
- Strengths and improvements sections
- Context-aware suggestions for improving social media engagement
- Download original file
- Responsive professional dashboard with score ring, expandable breakdown, metric cards, and collapsible extracted text
- Loading, success, error, and reset states throughout

## Architecture

```
Browser  ->  Vite dev server (port 5173, proxies /api to backend)
           |
           v
FastAPI (port 8000)
  POST /api/upload
    1. File validation (extension, MIME, size, magic bytes)
    2. Routing: PDF -> text_extractor | Image -> ocr_service
    3. PDF: extract text; if empty -> render pages to images -> OCR
    4. Image: preprocess -> OCR via Tesseract
    5. Content analysis: metrics, scoring, suitability, explanations, suggestions
    6. Store file bytes in memory, return download_id
    7. Return ExtractionResponse (extraction + analysis)
  GET /api/download/{id}  ->  serve original file bytes
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, Tailwind CSS 4 |
| Backend | Python 3.12, FastAPI, Uvicorn |
| PDF extraction | PyMuPDF |
| OCR | Tesseract (via pytesseract) + Pillow (image preprocessing) |
| Validation | Pydantic models |

## Supported File Types

| Type | Extensions | Max Size |
|---|---|---|
| PDF | `.pdf` | 10 MB |
| PNG | `.png` | 10 MB |
| JPEG | `.jpg`, `.jpeg` | 10 MB |

File validation includes extension check, MIME type check, magic byte detection, and zero-byte rejection.

## Setup

### Prerequisites

- Python 3.12+
- Node.js 18+
- [Tesseract OCR](https://github.com/tesseract-ocr/tesseract) (required for image and scanned PDF processing)

### Tesseract OCR

**Windows:** Download installer from https://github.com/UB-Mannheim/tesseract/wiki. Default install path `C:\Program Files\Tesseract-OCR` is auto-detected.

**macOS:**
```bash
brew install tesseract
```

**Linux (Debian/Ubuntu):**
```bash
sudo apt install tesseract-ocr
```

### Backend

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

API available at `http://localhost:8000`. Health check: `GET /api/health`. Tesseract status: `GET /api/tesseract`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Available at `http://localhost:5173`. Vite proxies `/api/*` requests to the backend at `http://localhost:8000`.

## How It Works

### Text Extraction

1. **PDF with extractable text** — PyMuPDF reads text directly from each page. Multi-page PDFs include page separators.
2. **Scanned/image-only PDF** — If extracted text averages fewer than 20 characters per page, the PDF is treated as scanned. Each page is rendered to a 300 DPI image and processed via OCR.
3. **PNG/JPG images** — Preprocessed (scaled up if small, converted to grayscale, contrast enhanced, sharpened) then OCR'd via Tesseract.

### Content Analysis

The analyzer computes 13 content metrics from the extracted text: word count, character count, sentence count, average sentence length, hashtag count, question count, exclamation count, emoji count, line break count, CTA presence, hook presence, bullet point presence, and matched CTA keywords.

### Social-Media Suitability

Before presenting the engagement score, the analyzer assesses whether the uploaded content is likely social-media-style text or a technical/document-style file. It checks:

- Hashtag, question, CTA, and hook presence (social signals)
- Word count and sentence length (short-form vs. formal writing)
- Document-style headers (Abstract, Introduction, Conclusion, etc.)
- Citations, references, and code patterns (technical indicators)

Results: **likely_social_media**, **possibly_social_media**, or **likely_document** with clear reasons.

### Engagement Scoring (0-100)

The score is a heuristic sum of 9 weighted components:

| Component | Max Points | Logic |
|---|---|---|
| Content Length | 15 | 40-100 words is optimal |
| Hashtags | 15 | 2-4 is ideal, 5+ penalized |
| Questions | 10 | At least one invites interaction |
| Call to Action | 15 | Any CTA keyword detected |
| Hook / Opener | 10 | Attention-grabbing first sentence |
| Readability | 10 | Avg 8-20 words per sentence |
| Formatting | 10 | Line breaks + bullet points |
| Energy | 10 | Exclamations and emojis |
| Sentence Variety | 5 | Multiple sentence lengths |

### Strengths, Improvements, and Suggestions

Each analysis returns two actionable lists:
- **Strengths** — what the content does well (detected hashtags, CTA, hook, etc.)
- **Improvements** — missing or suboptimal elements with specific recommendations

Additionally, context-aware **suggestions** cover hashtags, questions, CTA, hook, energy, length, readability, formatting, and content flow.

Every scoring component includes a detailed explanation with what was detected, earned/max points, status, and how to improve.

## Testing

All tests use FastAPI's `TestClient` (no running server required).

```bash
cd backend
pip install -r requirements.txt
python test_final.py
```

### Backend Tests (17/17 passed)

```
=== HEALTH ===
  PASS  Health
  PASS  Tesseract

=== EXTRACTION ===
  PASS  Text PDF + analysis + download_id
  PASS  Multi-page PDF

=== SUITABILITY ===
  PASS  Social media -> likely_social_media
  PASS  Technical document -> likely_document
  PASS  Mixed content -> possibly_social_media

=== SCORE EXPLANATIONS ===
  PASS  No hashtags -> explained
  PASS  No CTA -> explained
  PASS  All 9 explanations complete
  PASS  Score breakdown sum == score

=== DOWNLOAD ===
  PASS  Download original file
  PASS  Download missing -> 404

=== ERROR CASES ===
  PASS  Invalid ext -> 400
  PASS  Empty -> 400
  PASS  Oversized -> 413
  PASS  Corrupted PDF -> handled
```

### Frontend Build

```
vite v8.2.1 built in 145ms
  dist/index.html       0.47 kB
  dist/assets/*.css    26.29 kB (gzip: 5.74 kB)
  dist/assets/*.js    210.41 kB (gzip: 65.32 kB)
  0 errors, 0 warnings
```

**Result: 17/17 backend tests passed, frontend build clean.**

## Known Limitations

- **OCR accuracy** depends on image quality, font clarity, and text orientation. Handwritten text, low-contrast text, and skewed scans may produce incomplete or inaccurate results.
- **Scoring is heuristic**, not scientifically validated. It measures structural content characteristics commonly associated with social media engagement.
- **Suitability detection** is rule-based and may misclassify edge cases. Documents with hashtags or short technical summaries may be classified as social media.
- **Emoji detection** uses Unicode range matching and may miss some newer or compound emojis.
- **No authentication or persistent storage.** Uploaded files are held in memory for the session only.
- **PDF text extraction** cannot recover text from image-only content without OCR, and OCR requires Tesseract to be installed.
- **DPI and preprocessing** are fixed for OCR; performance may vary across different image types.

## Project Structure

```
Social-Media-Content-Analyzer/
├── backend/
│   ├── main.py                    # FastAPI app, upload/download endpoints, processing pipeline
│   ├── models/
│   │   └── schemas.py             # Pydantic models (ExtractionResponse, ContentMetrics, HealthResponse)
│   ├── services/
│   │   ├── file_validator.py      # Extension, MIME, magic byte, size validation
│   │   ├── text_extractor.py      # PyMuPDF text extraction, page rendering
│   │   ├── ocr_service.py         # Tesseract OCR, image preprocessing, PDF OCR
│   │   └── content_analyzer.py    # Metrics, scoring, suitability, explanations, suggestions
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx                # Root component, header, view state management
│   │   ├── main.jsx               # React entry point
│   │   ├── index.css              # Tailwind CSS import
│   │   └── components/
│   │       ├── FileUpload.jsx     # Drag-and-drop upload, validation, processing state
│   │       └── AnalysisResults.jsx # Dashboard (score ring, breakdown, strengths, metrics, download)
│   ├── index.html
│   ├── vite.config.js             # Vite config with /api proxy to backend
│   └── package.json
└── .gitignore
```
