from config.database import SessionLocal
from models.product import Product
from models.branch import Branch
from models.stock import Stock

db = SessionLocal()

# 🧼 Limpiar datos anteriores (opcional en pruebas)
db.query(Stock).delete()
db.query(Branch).delete()
db.query(Product).delete()

# 📦 Productos variados
productos = [
    Product(codigo="FER-123", nombre="Taladro Percutor Bosch", marca="Bosch"),
    Product(codigo="FER-456", nombre="Martillo Stanley", marca="Stanley"),
    Product(codigo="FER-789", nombre="Sierra Circular Makita", marca="Makita"),
    Product(codigo="FER-321", nombre="Guantes de Seguridad Sika", marca="Sika"),
    Product(codigo="FER-654", nombre="Destornillador Philips Stanley", marca="Stanley"),
    Product(codigo="FER-987", nombre="Lijadora Orbital Dewalt", marca="Dewalt"),
    Product(codigo="FER-159", nombre="Llave Ajustable Truper", marca="Truper"),
    Product(codigo="FER-753", nombre="Pintura Látex Blanco 20L", marca="Sipa"),
]

# 🏬 Sucursales
sucursales = [
    Branch(nombre="Sucursal 1"),
    Branch(nombre="Sucursal 2"),
    Branch(nombre="Casa Matriz")
]

# Asociaciones producto-sucursal (stock y precios)
stock = [
    Stock(producto=productos[0], sucursal=sucursales[0], cantidad=100, precio=89990),
    Stock(producto=productos[0], sucursal=sucursales[2], cantidad=80, precio=92000),
    Stock(producto=productos[1], sucursal=sucursales[1], cantidad=80, precio=19990),
    Stock(producto=productos[2], sucursal=sucursales[0], cantidad=0, precio=95000),
    Stock(producto=productos[2], sucursal=sucursales[2], cantidad=50, precio=98000),
    Stock(producto=productos[3], sucursal=sucursales[1], cantidad=152, precio=8500),
    Stock(producto=productos[4], sucursal=sucursales[0], cantidad=121, precio=12000),
    Stock(producto=productos[4], sucursal=sucursales[1], cantidad=62, precio=12500),
    Stock(producto=productos[5], sucursal=sucursales[2], cantidad=123, precio=67500),
    Stock(producto=productos[6], sucursal=sucursales[0], cantidad=102, precio=15500),
    Stock(producto=productos[6], sucursal=sucursales[1], cantidad=0, precio=15200),
    Stock(producto=productos[7], sucursal=sucursales[1], cantidad=111, precio=42000),
]

# Insertar en la base de datos
db.add_all(productos + sucursales + stock)
db.commit()
db.close()
