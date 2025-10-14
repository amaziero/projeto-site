from typing import IO, List, Callable, Tuple
from fastapi import UploadFile
import io

from fastapi import UploadFile, HTTPException, status

import fitz  # PyMuPDF
from zipfile import ZipFile, ZIP_DEFLATED, ZIP_STORED
from tempfile import NamedTemporaryFile, TemporaryFile
import os
from typing import IO

CHUNK = 10 * 1024 * 1024

async def extract_images_zip(files: List[UploadFile]) -> Tuple[IO[bytes], Callable[[], None]]:
    """
    Percorre N PDFs, extrai as imagens e devolve:
      - outer_zip: file-like pronto para stream
      - cleanup: callable para fechar arquivos temporários depois do envio
    Lança HTTPException (400) em caso de erro de validação/extração.
    """
    if not files:
        raise HTTPException(status_code=400, detail="Envie pelo menos 1 PDF.")

    outer_zip = TemporaryFile()
    inner_handles: List[IO[bytes]] = []  # para fechar depois

    try:
        with ZipFile(outer_zip, "w", compression=ZIP_DEFLATED, compresslevel=1) as zip_out:
            for f in files:
                inner_zip_io, inner_name = await extract_images_from_pdf(f)  # <- sua função por-PDF
                inner_handles.append(inner_zip_io)

                with zip_out.open(inner_name, "w") as zf:
                    while True:
                        chunk = inner_zip_io.read(CHUNK)
                        if not chunk:
                            break
                        zf.write(chunk)

        outer_zip.seek(0)

        def cleanup():
            # fecha todos os temporários
            for fh in inner_handles:
                try:
                    fh.close()
                except Exception:
                    pass
            try:
                outer_zip.close()
            except Exception:
                pass

        return outer_zip, cleanup

    except Exception:
        # falhou antes de retornar -> fechar o que já estiver aberto
        for fh in inner_handles:
            try:
                fh.close()
            except Exception:
                pass
        try:
            outer_zip.close()
        except Exception:
            pass
        raise

async def extract_images_from_pdf(file: UploadFile) -> IO[bytes]:
    """Extrai as imagens de um único PDF e devolve pares (nome_sugerido, bytes)."""

    """
    Recebe 1 PDF (UploadFile) e retorna:
      - um file-like (TemporaryFile) contendo um ZIP com as imagens extraídas
      - o nome base sugerido para este zip (ex.: "meu_arquivo_imagens.zip")
    """
    
    # persiste PDF em disco (streaming, sem carregar tudo na RAM)
    tmp_pdf = NamedTemporaryFile(delete=False, suffix=".pdf")
    try:
        while True:
            chunk = await file.read(CHUNK)
            if not chunk:
                break
            tmp_pdf.write(chunk)
    finally:
        tmp_pdf.flush()
        tmp_pdf.close()
        await file.seek(0)

    # cria o ZIP interno (um por PDF)
    zip_internal = TemporaryFile()
    total_imgs = 0

    try:
        doc = fitz.open(tmp_pdf.name)
        # ZIP_STORED (sem compressão) é bem rápido; se preferir, use DEFLATED nivel 1
        with ZipFile(zip_internal, "w", compression=ZIP_STORED) as zipf:
            for page_idx in range(len(doc)):
                images = doc[page_idx].get_images(full=True)
                if not images:
                    continue

                for img_seq, (xref, *_) in enumerate(images, start=1):
                    # tentar normalizar para PNG (RGB)
                    try:
                        pix = fitz.Pixmap(doc, xref)
                        if pix.n >= 5:  # CMYK/RGBA -> converte
                            pix = fitz.Pixmap(fitz.csRGB, pix)
                        img_bytes = pix.tobytes("png")
                        ext = "png"
                        pix = None
                    except Exception:
                        # fallback: bytes originais
                        info = doc.extract_image(xref)
                        img_bytes = info["image"]
                        ext = info.get("ext", "png")

                    out_name = f"Pagina {page_idx + 1} - Imagem {img_seq}.{ext}"
                    total_imgs += 1

                    with zipf.open(out_name, "w") as zf:
                        mv = memoryview(img_bytes)
                        off = 0
                        while off < len(mv):
                            zf.write(mv[off: off + CHUNK])
                            off += CHUNK

        doc.close()

        if total_imgs == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{file.filename}: nenhuma imagem encontrada."
            )

        zip_internal.seek(0)
        base = (file.filename or "arquivo").rsplit(".", 1)[0]
        internal_zip_name = f"{base}_imagens.zip"
        return zip_internal, internal_zip_name

    except HTTPException:
        try:
            zip_internal.close()
        except Exception:
            pass
        raise
    except Exception as e:
        try:
            zip_internal.close()
        except Exception:
            pass
        raise HTTPException(status_code=400, detail=f"{file.filename}: falha ao processar PDF ({e}).")
    finally:
        # remove o PDF temporário
        try:
            os.unlink(tmp_pdf.name)
        except Exception:
            pass

def iter_file(fh, chunk_size=CHUNK):
    fh.seek(0)
    while True:
        data = fh.read(chunk_size)
        if not data:
            break
        yield data  # <-- sempre bytes