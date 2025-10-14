# http://127.0.0.1:8000/docs

from fastapi import APIRouter, UploadFile, File
from fastapi.responses import StreamingResponse
from app.services.pdf_service import validate_pdf
from app.services.pdf_images_service import extract_images_zip

from starlette.background import BackgroundTask

router = APIRouter(prefix="/images", tags=["Images"])

@router.post('/extract')
async def split_pdf(
    files: list[UploadFile] = File(...)
):
    for file in files:
        await validate_pdf(file=file)

    outer_zip, cleanup = await extract_images_zip(files=files)

    return StreamingResponse(
        outer_zip,
        media_type="application/zip",
        headers={"Content-Disposition": 'attachment; filename="imagens_por_pdf.zip"'},
        background=BackgroundTask(cleanup),  # <- agora o cleanup é executado ao final
    )