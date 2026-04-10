import urllib.request
import json
import urllib.error

url_register = 'https://bai-api.vercel.app/api/v1/auth/register'
data = json.dumps({'email': 'test2@example.com', 'password': 'Password123!', 'name': 'Teste', 'role': 'user'}).encode()
req = urllib.request.Request(url_register, data=data, headers={'Content-Type': 'application/json'})

try:
    response = urllib.request.urlopen(req)
    print("SUCCESS:", response.read().decode())
except urllib.error.HTTPError as e:
    print("ERROR:", e.code)
    print("BODY:", e.read().decode())
