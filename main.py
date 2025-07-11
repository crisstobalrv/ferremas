from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from config.database import Base, engine
from models import Product
from models.branch import Branch
from models.stock import Stock
from routes import products 
from routes import sales
from routes import exchange
from routes import sse
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from routes.grpc_bridge import router as grpc_router

app = FastAPI(title="FERREMAS API")

app.mount("/static", StaticFiles(directory="static"), name="static")

app.mount("/frontend", StaticFiles(directory="frontend"), name="frontend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # o ["http://localhost"] si lo deseas más seguro
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



# Crea las tablas en la base de datos
Base.metadata.create_all(bind=engine)

# Incluye las rutas del módulo de productos con el prefijo /api
app.include_router(products.router, prefix="/api")
app.include_router(sales.router, prefix="/api")
app.include_router(exchange.router, prefix="/api")
app.include_router(sse.router, prefix="/api")
app.include_router(grpc_router)



@app.get("/")
def serve_index():
    return FileResponse("frontend/index.html")
