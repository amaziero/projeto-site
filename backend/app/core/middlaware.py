from fastapi import Request
from starlette.responses import JSONResponse

MAX_UPLOAD_SIZE_MB = 500
MAX_UPLOAD_SIZE_MB = MAX_UPLOAD_SIZE_MB * 1024 * 1024

async def limit_upload_size(request: Request, call_next):
    content_length = request.headers.get('content-lenght')

    if content_length and int(content_length) > MAX_UPLOAD_SIZE_MB:
        return JSONResponse(
            status_code=403,
            content={
                "erro": 'too-large',
                "message": f"Tamanho máximo permitido para o total de arquivos unidos é {MAX_UPLOAD_SIZE_MB} MB"
            }
        )
    
    response = await call_next(request)

    return response
