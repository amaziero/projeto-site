# app/services/pdf_service.py
from fastapi import UploadFile
from app.core.exceptions import InvalidPdfError, TooLargeError, EncryptedPdfError, PDFCorrupted, PDFJoinFaliure
from pypdf import PdfReader, PdfWriter
from io import BytesIO

MAX_BYTES = 10 * 1024 * 1024  # 10 MB

async def validate_pdf(file: UploadFile) -> None:
    name = (file.filename or "").lower()

    if not name.endswith(".pdf"):
        raise InvalidPdfError("Extensão inválida: use .pdf")

    if (file.content_type or "").lower() != "application/pdf":
        raise InvalidPdfError("Content-Type inválido: deve ser application/pdf")

    head = await file.read(4)
    if not head.startswith(b"%PDF"):
        raise InvalidPdfError("Cabeçalho inválido: não parece um PDF")
    await file.seek(0)

    # (exemplo de limite de tamanho)
    size = 0
    while True:
        chunk = await file.read(1024 * 1024)
        if not chunk:
            break
        size += len(chunk)
        if size > MAX_BYTES:
            raise TooLargeError("Arquivo excede 10 MB")
    await file.seek(0)

    # Usa o file-like subjacente (síncrono) — ok dentro de rota async
    try:
        reader = PdfReader(file.file, strict=False)
    except:
        raise PDFCorrupted("Arquivo com erro ao tentar ler.")

    if reader.is_encrypted:
        raise EncryptedPdfError("PDF protegido por senha, não é possivel juntar com os demais.")
    
    await file.seek(0)

async def join_pdfs(files: list[UploadFile]) -> BytesIO:
    writer = PdfWriter()
    for file in files:
        try:
            reader = PdfReader(file.file, strict=False)
            
            for page in reader.pages:
                writer.add_page(page)

        except Exception:
            raise PDFJoinFaliure("PDF join faliure.")
        finally:
            file.file.seek(0)
            await file.seek(0)

    # Escrever resultado em memória e devolver
    out_buf = BytesIO()
    return writer.write(out_buf)
    