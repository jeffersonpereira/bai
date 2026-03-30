import requests
import json
from datetime import datetime, timedelta

API_URL = "http://localhost:40001/api/v1/appointments/"

def test_schedule():
    payload = {
        "property_id": 1,
        "visitor_name": "Test User",
        "visitor_phone": "11999999999",
        "visit_date": (datetime.now() + timedelta(days=1)).isoformat(),
        "notes": "Testing from script"
    }
    
    print(f"Enviando payload: {json.dumps(payload, indent=2)}")
    
    try:
        response = requests.post(API_URL, json=payload)
        print(f"Status Code: {response.status_code}")
        if response.status_code != 200:
            print(f"Erro: {response.text}")
        else:
            print("Sucesso!")
            print(json.dumps(response.json(), indent=2))
    except Exception as e:
        print(f"Falha na requisição: {e}")

if __name__ == "__main__":
    test_schedule()
