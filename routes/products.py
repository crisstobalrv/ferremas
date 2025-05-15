from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from config.database import get_db
from models.product import Product
from models.stock import Stock
from models.branch import Branch

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
            "Cantidad": item.cantidad,
            "Precio": item.precio
        })

    return {
        "Producto": {
            "Codigo": producto.codigo,
            "Nombre": producto.nombre,
            "Marca": producto.marca
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
            "StockPorSucursal": []
        }

        for stock in producto.stock_sucursal:
            producto_info["StockPorSucursal"].append({
                "Sucursal": stock.sucursal.nombre,
                "Cantidad": stock.cantidad,
                "Precio": stock.precio
            })

        resultado.append(producto_info)

    return resultado

from models.branch import Branch

@router.get("/sucursales")
def obtener_sucursales(db: Session = Depends(get_db)):
    sucursales = db.query(Branch).all()

    return [{"id": s.id, "nombre": s.nombre} for s in sucursales]

