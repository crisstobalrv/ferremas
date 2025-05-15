from sqlalchemy import Column, Integer, String, ForeignKey, Float
from sqlalchemy.orm import relationship
from config.database import Base

class Stock(Base):
    __tablename__ = "stock"

    id = Column(Integer, primary_key=True, index=True)
    producto_codigo = Column(String, ForeignKey("products.codigo"))
    sucursal_id = Column(Integer, ForeignKey("branches.id"))
    cantidad = Column(Integer)
    precio = Column(Float)

    producto = relationship("Product", back_populates="stock_sucursal")
    sucursal = relationship("Branch", back_populates="stock")
