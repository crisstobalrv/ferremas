from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
import asyncio

router = APIRouter()

# Lista global simulada para enviar alertas (idealmente vendría de una cola o evento real)
sse_alertas = []

@router.get("/sse")
async def sse_endpoint(request: Request):
    async def event_generator():
        while True:
            if await request.is_disconnected():
                break

            if sse_alertas:
                mensaje = sse_alertas.pop(0)
                yield f"data: {mensaje}\n\n"
            await asyncio.sleep(1)

    return StreamingResponse(event_generator(), media_type="text/event-stream")
