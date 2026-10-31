import io
from typing import Tuple, Dict, Any
import fitz  # PyMuPDF
from app.core.logging import logger


class PDFProcessingError(Exception):
    def __init__(self, message: str, is_ocr_needed: bool = False):
        super().__init__(message)
        self.message = message
        self.is_ocr_needed = is_ocr_needed


def extract_text_from_pdf(file_bytes: bytes, filename: str) -> Dict[str, Any]:
    """
    Extract text and metadata from PDF bytes using PyMuPDF.
    Detects scanned/image-only PDFs and flags that OCR is required.
    """
    if not file_bytes:
        raise PDFProcessingError(f"File '{filename}' is empty.")

    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
    except Exception as e:
        logger.error(f"Failed to open PDF '{filename}': {e}")
        raise PDFProcessingError(f"Invalid or corrupted PDF file: {str(e)}")

    if doc.is_encrypted:
        try:
            # Try empty password
            auth_success = doc.authenticate("")
            if not auth_success:
                raise PDFProcessingError(f"PDF '{filename}' is password-protected/encrypted.")
        except Exception:
            raise PDFProcessingError(f"PDF '{filename}' is encrypted and cannot be opened without credentials.")

    total_pages = len(doc)
    if total_pages == 0:
        raise PDFProcessingError(f"PDF '{filename}' contains 0 pages.")

    full_text = []
    has_images = False
    
    for page_idx in range(total_pages):
        page = doc[page_idx]
        page_text = page.get_text("text").strip()
        if page_text:
            full_text.append(f"--- Page {page_idx + 1} ---\n{page_text}")
        
        # Check if page has images
        if not page_text and len(page.get_images()) > 0:
            has_images = True

    combined_text = "\n\n".join(full_text).strip()

    # Scanned PDF detection
    # If document has pages but total extracted text is essentially empty (less than 30 characters across all pages)
    if len(combined_text) < 30:
        if has_images or total_pages > 0:
            logger.warning(f"PDF '{filename}' has no extractable digital text. Image/scanned document detected.")
            raise PDFProcessingError(
                f"The uploaded PDF '{filename}' contains scanned or rasterized page images without an embedded text layer. "
                "Optical Character Recognition (OCR) is required to process scanned paper records. "
                "Please upload a text-based digital PDF or paste the incident report text directly.",
                is_ocr_needed=True
            )
        else:
            raise PDFProcessingError(f"No readable text found in PDF '{filename}'.")

    return {
        "text": combined_text,
        "page_count": total_pages,
        "char_count": len(combined_text),
        "status": "extracted"
    }
