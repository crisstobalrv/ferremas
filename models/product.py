from sqlalchemy import Column, String, Float
from sqlalchemy.orm import relationship
from config.database import Base
from models import stock 


class Product(Base):
    __tablename__ = "productos"

    codigo = Column(String, primary_key=True, index=True)
    nombre = Column(String)
    marca = Column(String)
    precio = Column(Float)
    imagen = Column(String)

    stock_sucursal = relationship("Stock", back_populates="producto", lazy="selectin")
