# http://127.0.0.1:8000/docs

from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from app.services.pdf_service import validate_pdf, parse_page_range, split_range, split_all

router = APIRouter(prefix="/split", tags=["Split"])

@router.post('/')
async def split_pdf(
    file: UploadFile = File(...),
    mode: str = File(...),          # "pages" ou "range"
    range: str | None = File(None)
):
    if not(file):
        raise HTTPException(status_code=400, detail="Envie 1 PDF.")
    
    if mode not in {'each', 'range'}:
        raise HTTPException(
            status_code=400, detail="mode deve ser 'each' ou 'range'.")
    
    await validate_pdf(file)

    if mode == "range":
        if not range:
            raise HTTPException(
                status_code=400, detail="range é obrigatório quando mode='range'.")
    
        start, end = parse_page_range(range)

        buf = await split_range(file, start, end)
        buf.seek(0)

        return StreamingResponse(
            content=buf,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="split_{start:03}-{end:03}.pdf"'}
        )
    
    zip_io = await split_all(file=file)
    zip_name = f"{file.filename.rsplit('.', 1)[0]}_pages.zip"

    return StreamingResponse(
        zip_io,
        media_type="application/zip",
        headers={
            "Content-Disposition": f'attachment; filename="{zip_name}"'
        }
    )