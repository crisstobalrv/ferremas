from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from config.database import get_db
from models.product import Product
from models.stock import Stock
from schemas.product import ProductoCrear
from models.branch import Branch
from fastapi import UploadFile, File, Form
import shutil
import os
from uuid import uuid4

router = APIRouter()

@router.get("/productos/{codigo}/stock")
def obtener_stock_por_producto(codigo: str, db: Session = Depends(get_db)):
    producto = db.query(Product).filter(func.lower(Product.codigo) == codigo.lower()).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    stock_por_sucursal = db.query(Stock).join(Branch).filter(Stock.producto_codigo == producto.codigo).all()

    resultado = []
    for item in stock_por_sucursal:
        resultado.append({
            "Sucursal": item.sucursal.nombre,
            "SucursalId": item.sucursal.id,
            "Cantidad": item.cantidad,
            "Precio": item.precio or producto.precio  # ✅ Fix aquí
        })

    return {
        "Producto": {
            "Codigo": producto.codigo,
            "Nombre": producto.nombre,
            "Marca": producto.marca,
            "Precio": producto.precio  # ✅ Incluye esto por si se requiere en el front
        },
        "StockPorSucursal": resultado
    }



@router.get("/stock-general")
def obtener_stock_general(db: Session = Depends(get_db)):
    from models.product import Product
    productos = db.query(Product).all()

    resultado = []

    for producto in productos:
        producto_info = {
            "Codigo": producto.codigo,
            "Nombre": producto.nombre,
            "Marca": producto.marca,
            "Imagen": producto.imagen,
            "StockPorSucursal": []
        }

        # Si no hay stock asociado, agregar mensaje vacío
        if not producto.stock_sucursal:
            producto_info["StockPorSucursal"].append({
                "Sucursal": "—",
                "Cantidad": 0,
                "Precio": producto.precio  # Usa precio base del producto
            })
        else:
            for stock in producto.stock_sucursal:
                producto_info["StockPorSucursal"].append({
                    "Sucursal": stock.sucursal.nombre,
                    "Cantidad": stock.cantidad,
                    "Precio": stock.precio or producto.precio
                })

        resultado.append(producto_info)

    return resultado


from models.branch import Branch

@router.get("/sucursales")
def obtener_sucursales(db: Session = Depends(get_db)):
    sucursales = db.query(Branch).all()

    return [{"id": s.id, "nombre": s.nombre} for s in sucursales]

@router.post("/productos")
def crear_producto(
    codigo: str = Form(...),
    nombre: str = Form(...),
    marca: str = Form(...),
    precio: float = Form(...),
    imagen: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    existe = db.query(Product).filter_by(codigo=codigo).first()
    if existe:
        raise HTTPException(status_code=400, detail="Ya existe un producto con ese código.")

    # Guardar imagen con nombre único
    extension = os.path.splitext(imagen.filename)[1]
    nombre_archivo = f"{uuid4().hex}{extension}"
    ruta_destino = f"static/images/{nombre_archivo}"
    with open(ruta_destino, "wb") as buffer:
        shutil.copyfileobj(imagen.file, buffer)

    ruta_final = f"/static/images/{nombre_archivo}"

    nuevo = Product(
        codigo=codigo,
        nombre=nombre,
        marca=marca,
        precio=precio,
        imagen=ruta_final
    )

    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)

    return {
        "mensaje": "Producto creado correctamente",
        "producto": {
            "codigo": nuevo.codigo,
            "nombre": nuevo.nombre,
            "marca": nuevo.marca,
            "imagen": nuevo.imagen
        }
    }

@router.get("/productos")
def listar_productos(db: Session = Depends(get_db)):
    return db.query(Product).all()
