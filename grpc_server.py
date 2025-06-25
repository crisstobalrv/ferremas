import grpc
from concurrent import futures
import time

from sqlalchemy.orm import Session
from config.database import SessionLocal
from models.product import Product


import productos_pb2
import productos_pb2_grpc
from google.protobuf import empty_pb2


class ProductoService(productos_pb2_grpc.ProductoServiceServicer):
    def ObtenerProducto(self, request, context):
        db: Session = SessionLocal()
        producto = db.query(Product).filter_by(codigo=request.codigo).first()
        db.close()

        if not producto:
            context.set_code(grpc.StatusCode.NOT_FOUND)
            context.set_details("Producto no encontrado")
            return productos_pb2.ProductoResponse()

        producto_pb = productos_pb2.Producto(
            codigo=producto.codigo,
            nombre=producto.nombre,
            marca=producto.marca,
            precio=producto.precio,
            imagen=producto.imagen
        )

        return productos_pb2.ProductoResponse(producto=producto_pb)

    def ListarProductos(self, request, context):
        db: Session = SessionLocal()
        productos = db.query(Product).all()
        db.close()

        lista = []
        for p in productos:
            lista.append(productos_pb2.Producto(
                codigo=p.codigo,
                nombre=p.nombre,
                marca=p.marca,
                precio=p.precio,
                imagen=p.imagen
            ))

        return productos_pb2.ListaProductos(productos=lista)


def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    productos_pb2_grpc.add_ProductoServiceServicer_to_server(ProductoService(), server)
    server.add_insecure_port("[::]:50051")
    server.start()
    print("🟢 Servidor gRPC corriendo en puerto 50051...")
    try:
        while True:
            time.sleep(86400)
    except KeyboardInterrupt:
        print("🛑 Servidor detenido.")
        server.stop(0)


if __name__ == "__main__":
    serve()
