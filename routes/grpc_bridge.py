import grpc
from fastapi import APIRouter, HTTPException

import productos_pb2
import productos_pb2_grpc

from google.protobuf import empty_pb2

router = APIRouter()

# Conexión al servidor gRPC
channel = grpc.insecure_channel("localhost:50051")
stub = productos_pb2_grpc.ProductoServiceStub(channel)


@router.get("/grpc/productos")
def listar_productos_desde_grpc():
    try:
        response = stub.ListarProductos(empty_pb2.Empty())
        return [  # convertir objetos proto a dicts
            {
                "codigo": p.codigo,
                "nombre": p.nombre,
                "marca": p.marca,
                "precio": p.precio,
                "imagen": p.imagen
            } for p in response.productos
        ]
    except grpc.RpcError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/grpc/productos/{codigo}")
def obtener_producto_desde_grpc(codigo: str):
    try:
        request = productos_pb2.CodigoRequest(codigo=codigo)
        response = stub.ObtenerProducto(request)
        if not response.producto.codigo:
            raise HTTPException(status_code=404, detail="Producto no encontrado")
        p = response.producto
        return {
            "codigo": p.codigo,
            "nombre": p.nombre,
            "marca": p.marca,
            "precio": p.precio,
            "imagen": p.imagen
        }
    except grpc.RpcError as e:
        raise HTTPException(status_code=500, detail=str(e))
