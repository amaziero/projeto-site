# app/services/pdf_service.py
from fastapi import UploadFile
from fastapi.responses import StreamingResponse
from app.core.exceptions import PageRangeError, InvalidPdfError, TooLargeError, EncryptedPdfError, PDFCorrupted, PDFJoinFaliure
from pypdf import PdfReader, PdfWriter
from io import BytesIO
from typing import Tuple
import re
from zipfile import ZipFile, ZIP_STORED

import pikepdf
from tempfile import TemporaryFile
from zipfile import ZipFile, ZIP_STORED


MAX_BYTES = 10 * 1024 * 1024  # 10 MB
_RANGE_RE = re.compile(r"^\d+-\d+$")

async def validate_pdf(file: UploadFile) -> None:
    if not file:
        raise InvalidPdfError("Necessário enviar ao menos 1 documento pdf.")
    
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
    """Mescla os PDFs (na ordem recebida) e devolve um buffer BytesIO pronto para leitura."""
    # criar writer
    writer = PdfWriter()

    for file in files:
        try:
            # ler bytes (em chunks) → data
            reader = PdfReader(file.file, strict=False)
            
            for page in reader.pages: writer.add_page(page)

        except Exception:
            raise PDFJoinFaliure("PDF join faliure.")
        finally:
            file.file.seek(0)
            await file.seek(0)

    # Escrever resultado em memória e devolver
    out_buf = BytesIO()
    writer.write(out_buf)
    return out_buf

def parse_page_range(range_str: str) -> Tuple[int, int]:
    r = (range_str or "").strip()
    r = r.replace(" ", "")
    
    if not _RANGE_RE.match(range_str): PageRangeError("Formato de range inválido. Use 'X-Y', ex.: '3-7'.")
    left, right = r.split("-", 1)
    start, end = int(left), int(right)

    if start <= 0 or end <= 0:
        raise PageRangeError("Páginas devem começar em 1.")
    if start > end:
        raise PageRangeError("Início do range não pode ser maior que o fim.")

    return start, end

async def split_range(file: UploadFile, start: int, end: int) -> BytesIO:
    # Lê o conteúdo do arquivo (bytes)
    file_bytes = await file.read()
    
    reader = PdfReader(BytesIO(file_bytes))

    total = len(reader.pages)

    if end > total:
        raise PageRangeError(
            f"A quantidade de paginas no arquivo é {total} e é menor que a quantidade de paginas fim informada para extração."
        )
    
    writer = PdfWriter()
    for i in range(start-1, end):
        writer.add_page(reader.pages[i])

    out = BytesIO()
    writer.write(out)
    out.seek(0)

    return out

# async def split_all(file: UploadFile) -> BytesIO:
#     # file_bytes = await file.read()
    
#     # Lê o conteúdo do arquivo (bytes)
#     reader = PdfReader(file.file)  # em vez de reader = PdfReader(BytesIO(file_bytes)) ganha performance

#     total = len(reader.pages)
    
#     zip_buffer = BytesIO()
    
#     with ZipFile(zip_buffer, 'w', compression=ZIP_STORED) as zip_file:
#         for i in range(total):
#             writer = PdfWriter()
#             writer.add_page(reader.pages[i])

#             # cria pdf dessa pagina em memoria
#             pdf_bytes = BytesIO()
#             writer.write(pdf_bytes)
#             pdf_bytes.seek(0)

#             filename = f'page_{str(i+1).zfill(4)}.pdf'

#             zip_file.writestr(filename, pdf_bytes.read())

#     # Posiciona o ponteiro no início do ZIP
#     zip_buffer.seek(0)

#     return zip_buffer

async def split_all(file):
    tmp_zip = TemporaryFile()  # NÃO use "with": precisamos devolver aberto
    with ZipFile(tmp_zip, 'w', compression=ZIP_STORED) as zipf:
        with pikepdf.open(file.file) as pdf:
            for i, page in enumerate(pdf.pages, start=1):
                new_pdf = pikepdf.Pdf.new()
                new_pdf.pages.append(page)
                with TemporaryFile() as tmp_pdf:
                    new_pdf.save(tmp_pdf)
                    tmp_pdf.seek(0)
                    with zipf.open(f'page_{i:04}.pdf', 'w') as z:
                        while True:
                            chunk = tmp_pdf.read(1024 * 512)
                            if not chunk:
                                break
                            z.write(chunk)
    tmp_zip.seek(0)
    return tmp_zip  # <- file-like pronto pro StreamingResponse