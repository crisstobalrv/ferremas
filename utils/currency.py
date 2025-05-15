import requests

CMF_API_URL = "https://api.cmfchile.cl/api-sbifv3/recursos_api/dolar?apikey=6466de471282fab6ca599bf5b7d1c28c95cf476a&formato=json"

def obtener_valor_dolar():
    try:
        response = requests.get(CMF_API_URL)
        if response.status_code == 200:
            data = response.json()
            valor = data["Dolares"][0]["Valor"].replace(".", "").replace(",", ".")
            return float(valor)
    except Exception:
        return None
