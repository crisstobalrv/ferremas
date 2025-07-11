from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from config.database import get_db
from models.stock import Stock
from models.product import Product
from models.branch import Branch

from utils.currency import obtener_valor_dolar
from fastapi import Body
from routes.sse import sse_alertas


router = APIRouter()

class VentaRequest(BaseModel):
    codigo_producto: str
    id_sucursal: int
    cantidad: int

@router.post("/venta")
def registrar_venta(venta: VentaRequest, db: Session = Depends(get_db)):
    stock = db.query(Stock).filter(
        Stock.producto_codigo == venta.codigo_producto,
        Stock.sucursal_id == venta.id_sucursal
    ).first()

    if not stock:
        raise HTTPException(status_code=404, detail="Stock no encontrado para ese producto y sucursal")

    if stock.cantidad < venta.cantidad:
        raise HTTPException(status_code=400, detail="Stock insuficiente")

    # Obtener producto (se necesita para el precio y nombre)
    producto = db.query(Product).filter_by(codigo=venta.codigo_producto).first()

    # Asegurar precio correcto
    precio_unitario = stock.precio or producto.precio
    total_clp = venta.cantidad * precio_unitario

    # Obtener el tipo de cambio
    dolar = obtener_valor_dolar()
    if dolar is None:
        raise HTTPException(status_code=503, detail="No se pudo obtener el tipo de cambio actual")

    total_usd = round(total_clp / dolar, 2)

    # Actualizar stock
    stock.cantidad -= venta.cantidad
    db.commit()

    # Verificar stock crítico
    stock_agotado = stock.cantidad == 0
    if stock.cantidad <= 10:
        sucursal = db.query(Branch).filter_by(id=venta.id_sucursal).first()
        alerta = f"⚠️ Stock crítico: {producto.nombre} tiene solo {stock.cantidad} unidad(es) en la sucursal {sucursal.nombre}"
        sse_alertas.append(alerta)

    return {
        "mensaje": "Venta realizada correctamente",
        "producto": venta.codigo_producto,
        "sucursal": venta.id_sucursal,
        "cantidad_vendida": venta.cantidad,
        "stock_restante": stock.cantidad,
        "total_clp": total_clp,
        "total_usd": total_usd,
        "stock_agotado": stock_agotado
    }


@router.post("/reponer")
def reponer_stock(
    codigo_producto: str = Body(...),
    id_sucursal: int = Body(...),
    cantidad: int = Body(...)
    , db: Session = Depends(get_db)
):
    stock = db.query(Stock).filter(
        Stock.producto_codigo == codigo_producto,
        Stock.sucursal_id == id_sucursal
    ).first()

    if not stock:
    # Crear nuevo registro de stock si no existe
        stock = Stock(
            producto_codigo=codigo_producto,
            sucursal_id=id_sucursal,
            cantidad=cantidad,
            precio=0  # o algún valor por defecto
        )
        db.add(stock)
    else:
        # Aumentar cantidad si ya existe
        stock.cantidad += cantidad

    db.commit()


    return {
        "mensaje": f"Stock actualizado. Nueva cantidad: {stock.cantidad}",
        "producto": codigo_producto,
        "sucursal": id_sucursal,
        "cantidad_agregada": cantidad
    }


