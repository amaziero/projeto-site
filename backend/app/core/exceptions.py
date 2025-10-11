# app/core/exceptions.py
from fastapi.responses import JSONResponse

# Classe base de todos os erros
class DomainError(Exception):
    status_code: int = 400
    code: str = "domain_error"

    def __init__(self, detail: str):
        super().__init__(detail)
        self.detail = detail

class InvalidPdfError(DomainError):
    status_code = 400
    code = "invalid_pdf"


class TooLargeError(DomainError):
    status_code = 413
    code = "payload_too_large"


class EncryptedPdfError(DomainError):
    status_code = 415
    code = "pdf_encrypted"


class PageRangeError(DomainError):
    status_code = 422
    code = "page_range_invalid"

class PDFCorrupted(DomainError):
    status_code = 400
    code = "connot_read"

class PDFJoinFaliure(DomainError):
    status_code = 400
    code = "join_faliure"

class PageRangeError(DomainError):
    status_code = 422
    code = "page_range_invalid"

# Handler global (um só para todos os DomainError)
async def handle_domain_error(request, exc: DomainError):
    return JSONResponse(
        status_code=exc.status_code,
        content={"code": exc.code, "detail": exc.detail},
    )
