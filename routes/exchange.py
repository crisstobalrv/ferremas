from fastapi import APIRouter
import requests

router = APIRouter()

@router.get("/exchange-rate")
def exchange_rate():
    CMF_API_URL = "https://api.cmfchile.cl/api-sbifv3/recursos_api/dolar?apikey=6466de471282fab6ca599bf5b7d1c28c95cf476a&formato=json"
    response = requests.get(CMF_API_URL)
    if response.status_code == 200:
        data = response.json()
        return {"Precio del Dolar Actual": data["Dolares"][0]["Valor"]}
    else:
        return {"message": "Error al obtener el tipo de cambio del dólar"}
