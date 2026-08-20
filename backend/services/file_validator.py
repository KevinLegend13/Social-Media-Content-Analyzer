import os

ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg"}

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "image/png",
    "image/jpeg",
}

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

MAGIC_BYTES = {
    b"%PDF": "pdf",
    b"\x89PNG": "png",
    b"\xff\xd8\xff": "jpg",
}


def get_file_extension(filename: str) -> str:
    return os.path.splitext(filename)[1].lower()


def detect_file_type_from_bytes(header: bytes) -> str | None:
    for magic, file_type in MAGIC_BYTES.items():
        if header.startswith(magic):
            return file_type
    return None


def get_extension_to_type(ext: str) -> str | None:
    mapping = {
        ".pdf": "pdf",
        ".png": "png",
        ".jpg": "jpg",
        ".jpeg": "jpeg",
    }
    return mapping.get(ext)
