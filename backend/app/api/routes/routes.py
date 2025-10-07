# http://127.0.0.1:8000/docs

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from starlette.responses import StreamingResponse
from typing import List
from io import BytesIO
from pypdf import PdfReader, PdfWriter
from typing import Optional

from app.services.pdf_service import validate_pdf

router = APIRouter(prefix="/v1", tags=["v1"])

# @router.post('/merged-pdfs', tags=["Upload"])
# async def merged_pdfs(files: list[UploadFile] = File(...)):
#     if not(files) and len(files) < 2:
#         from fastapi import HTTPException
#         raise HTTPException(status_code=400, detail="Envie ao menos 2 PDFs.")
    
#     for file in files:
#         # chegar se a extensão do arquivo é .pdf
#         # if not file.filename.lower().endswith(".pdf"):
#         #     raise HTTPException(status_code=400, detail={
#         #         "erro": "tipo_invalido",
#         #         "arquivo": file.filename,
#         #         "mensagem": "Apenas PDF é permitido."
#         #     })
        
#         # if (file.content_type or "").lower() != "application/pdf":
#         #     raise HTTPException(
#         #         status_code=400,
#         #         detail="Tipo de arquivo invalido. Aqui so se processa pdf."
#         #     )
        
#         # content = await file.read(4)
#         # if content != b'%PDF':
#         #     raise HTTPException(status_code=400, detail={
#         #         "erro": "content_type_invalido",
#         #         "arquivo": file.filename,
#         #         "mensagem": "Content-Type inválido para PDF."
#         #     })
        
#         # # volta o cursor de leitura para o inicio do arquivo
#         # await file.seek(0)

#         await validate_pdf(file=file)

#         try:
#             # Usa o file-like subjacente (síncrono) — ok dentro de rota async
#             reader = PdfReader(file.file, strict=False)

#             if reader.is_encrypted:
#                 raise HTTPException(
#                     status_code=400,
#                     detail={
#                         "error": "pdf_com_senha",
#                         "arquivo": file.filename,
#                         "message": "PDF protegido por senha, não é possivel juntar com os demais.",
#                     }
#                 )
#         except HTTPException:
#             # Repassa a exceção com detalhe do arquivo
#             raise
#         except Exception as e:
#             raise HTTPException(status_code=400, detail=f"{file.filename}: PDF corrompido, protegido com senha ou ilegível. {e}")
#         except Exception:
#             # Pode ser corrompido / incompleto / incremental estranho
#             raise HTTPException(status_code=400, detail={
#                 "erro": "pdf_ilegivel",
#                 "arquivo": file.file,
#                 "mensagem": "PDF corrompido, ilegível ou com estrutura não suportada."
#             })
#         finally:
#             # Importantíssimo: volta o ponteiro para permitir reuso no merge
#             file.file.seek(0)
#             await file.seek(0)

#     writer = PdfWriter()
#     for file in files:
#         try:
#             reader = PdfReader(file.file, strict=False)
            
#             for page in reader.pages:
#                 writer.add_page(page)

#         except Exception:
#             raise HTTPException(status_code=400, detail={
#                 "erro": "falha_no_merge",
#                 "arquivo": file.filename or "arquivo.pdf",
#                 "mensagem": "Falha ao ler páginas do PDF durante a junção."
#             })
#         finally:
#             file.file.seek(0)
#             await file.seek(0)

#     # Escrever resultado em memória e devolver
#     out_buf = BytesIO()
#     writer.write(out_buf)
#     out_buf.seek(0)

#     return StreamingResponse(
#         out_buf,
#         media_type="application/pdf",
#         headers={"Content-Disposition": 'attachment; filename="merged.pdf"'}
#     )

@router.post('/split', tags=['Upload'])
async def split_pdf(
    file: UploadFile = File(...),
    mode: str = Form(...),          # "pages" ou "range"
    start: Optional[int] = Form(None),  # usado se mode == "range"
    end: Optional[int] = Form(None),    # usado se mode == "range"
    password: Optional[str] = Form(None) # opcional para PDFs protegidos
):
    # chegar se a extensão do arquivo é .pdf
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Aqui se processa apenas PDF.")
    
    if file.content_type != 'application/pdf':
        raise HTTPException(
            status_code=400,
            detail="Tipo de arquivo invalido. Aqui so se processa pdf."
        )
    
    content = await file.read(4)
    if content != b'%PDF':
        raise HTTPException(
            status_code=400,
            detail="Tipo de arquivo invalido. Aqui so se processa pdf."
        )
    
    # volta o cursor de leitura para o inicio do arquivo
    await file.seek(0)



    



