from fastapi import APIRouter, UploadFile, File, HTTPException, Response

from starlette.responses import StreamingResponse
from app.services.pdf_service import validate_pdf, join_pdfs

from io import BytesIO

router = APIRouter(prefix="/merge", tags=["Merge"])

@router.post('/merged-pdfs', tags=["Upload"])
async def merged_pdfs(files: list[UploadFile] = File(...)):
    if not(files) or len(files) < 2:
        raise HTTPException(status_code=400, detail="Envie ao menos 2 PDFs.")
    
    for file in files:
        await validate_pdf(file=file)

    out_buf: BytesIO = await join_pdfs(files)   # idealmente async (ver nota abaixo)
    out_buf.seek(0)

    return Response(
        content=out_buf.read(),
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="merged.pdf"'}
    )