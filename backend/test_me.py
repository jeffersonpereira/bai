import urllib.request
import json
import urllib.error

url_me = 'https://bai-api.vercel.app/api/v1/auth/me'
# The token generated from our previous manual registration logic via test_api.py against LIVE API
token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiZDI3N2NlNS1iMWVmLTRjNmEtYWQ3MC01MmZmNGI5YTgyOGIiLCJleHAiOjE3NzU4MzYxMTR9.U5-DvsIodEMDEePSo9lADBfBx9cQnO5Att33utv5Ays"
req = urllib.request.Request(url_me, headers={'Authorization': f'Bearer {token}'})

try:
    response = urllib.request.urlopen(req)
    print("SUCCESS:", response.read().decode())
except urllib.error.HTTPError as e:
    print("ERROR:", e.code)
    print("BODY:", e.read().decode())
