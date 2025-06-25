from config.database import SessionLocal, engine, Base
from models.product import Product
from models.branch import Branch
from models.stock import Stock
import os
import shutil

# 1. Borrar y recrear las tablas
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

# 2. Crear sesión
db = SessionLocal()

# 3. Sucursales
sucursales = [
    Branch(nombre="Sucursal Centro"),
    Branch(nombre="Sucursal Norte"),
    Branch(nombre="Sucursal Sur"),
    Branch(nombre="Casa Matriz")
]

# 4. Asegurar que existan imágenes locales
static_dir = "static/images"
os.makedirs(static_dir, exist_ok=True)

# Copia algunas imágenes demo (puedes reemplazar estos archivos por los reales si quieres)
placeholder_path = "static/demo.jpg"
if not os.path.exists(placeholder_path):
    # Crea un archivo demo si no existe
    with open(placeholder_path, "wb") as f:
        f.write(b"\x89PNG\r\n\x1a\n" + b"\x00" * 100)  # contenido dummy

# 5. Productos con imagen local (mismo archivo para todos como ejemplo)
productos = [
    Product(codigo="123", nombre="Taladro Percutor Bosch", marca="Bosch", precio=89990,
            imagen="/static/images/taladro.jpg"),
    Product(codigo="456", nombre="Martillo Stanley", marca="Stanley", precio=19990,
            imagen="/static/images/martillo.jpg"),
    Product(codigo="789", nombre="Sierra Circular Makita", marca="Makita", precio=95000,
            imagen="/static/images/sierra.jpg"),
    Product(codigo="321", nombre="Guantes de Seguridad Sika", marca="Sika", precio=8500,
            imagen="/static/images/guantes.jpg"),
    Product(codigo="654", nombre="Destornillador Philips Stanley", marca="Stanley", precio=12000,
            imagen="/static/images/destornillador.jpg"),
    Product(codigo="753", nombre="Pintura Látex Blanco 20L", marca="Sipa", precio=42000,
            imagen="/static/images/pintura.jpg")
]

# Copia el placeholder a cada nombre de imagen si no existen aún
for producto in productos:
    destino = producto.imagen.replace("/static/", "static/")
    if not os.path.exists(destino):
        shutil.copyfile(placeholder_path, destino)

# 6. Stock por producto y sucursal
stock = [
    Stock(producto=productos[0], sucursal=sucursales[0], cantidad=6, precio=89990),
    Stock(producto=productos[0], sucursal=sucursales[3], cantidad=2, precio=92500),

    Stock(producto=productos[1], sucursal=sucursales[1], cantidad=15, precio=19990),

    Stock(producto=productos[2], sucursal=sucursales[2], cantidad=7, precio=95000),
    Stock(producto=productos[2], sucursal=sucursales[3], cantidad=4, precio=98000),

    Stock(producto=productos[3], sucursal=sucursales[0], cantidad=20, precio=8500),
    Stock(producto=productos[3], sucursal=sucursales[1], cantidad=0, precio=8700),

    Stock(producto=productos[4], sucursal=sucursales[2], cantidad=5, precio=12000),
    Stock(producto=productos[4], sucursal=sucursales[0], cantidad=2, precio=11800),

    Stock(producto=productos[5], sucursal=sucursales[1], cantidad=9, precio=42000),
    Stock(producto=productos[5], sucursal=sucursales[3], cantidad=0, precio=42500)
]

# 7. Guardar en la base de datos
db.add_all(sucursales + productos + stock)
db.commit()
db.close()
