from fastapi import APIRouter

router = APIRouter(prefix="/v1", tags=["v1"])

@router.get("/")
def ping():
    return {"message": "Hello Word!"}

@router.get("/health", tags=["Health"]) 
def health():
    return {"status": "aplication is running"}


@router.post("/upload", tags=["Upload"])
async def upload_file(nome: str, idade: int):
    return {"message": f"Nome {nome} e idade {idade} recebidos com sucesso!"}