from sqlalchemy import Column, String
from sqlalchemy.orm import relationship
from config.database import Base

class Product(Base):
    __tablename__ = "products"

    codigo = Column(String, primary_key=True, index=True)
    nombre = Column(String)
    marca = Column(String)

    stock_sucursal = relationship("Stock", back_populates="producto")