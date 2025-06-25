from pydantic import BaseModel # type: ignore

class ProductoCrear(BaseModel):
    codigo: str
    nombre: str
    marca: str
    precio: float
    imagen: str | None = None

