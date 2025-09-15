# http://127.0.0.1:8000/docs

from fastapi import APIRouter, UploadFile, File, HTTPException

router = APIRouter(prefix="/v1", tags=["v1"])

@router.get("/")
def ping():
    return {"message": "Hello Word!"}

@router.get("/health", tags=["Health"]) 
def health():
    return {"status": "aplication is running"}


@router.post("/upload", tags=["Upload"])
async def upload_file(file: UploadFile = File(...)):
    
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
    
    await file.seek(0)

    return {
        "message": f"Arquivo {file.filename} recebido com sucesso."
    }
