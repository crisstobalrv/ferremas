from sqlalchemy import Column, Integer, Float, ForeignKey
from sqlalchemy.orm import relationship
from config.database import Base

class Stock(Base):
    __tablename__ = "stock"

    id = Column(Integer, primary_key=True, index=True)
    producto_codigo = Column(ForeignKey("productos.codigo"))
    sucursal_id = Column(ForeignKey("sucursales.id"))
    cantidad = Column(Integer)
    precio = Column(Float)

    producto = relationship("Product", back_populates="stock_sucursal")
    sucursal = relationship("Branch", back_populates="stock_producto")
