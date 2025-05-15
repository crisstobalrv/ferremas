from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from config.database import Base

class Branch(Base):
    __tablename__ = "branches"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, unique=True)

    stock = relationship("Stock", back_populates="sucursal")
