import asyncio
import httpx
from bs4 import BeautifulSoup
import json
import re

async def test_olx():
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    }
    url = "https://www.olx.com.br/imoveis/estado-sp/sao-paulo-e-regiao"
    
    async with httpx.AsyncClient(headers=headers, follow_redirects=True) as client:
        try:
            print(f"Buscando OLX: {url}...")
            resp = await client.get(url, timeout=15)
            html = resp.text
            soup = BeautifulSoup(html, "html.parser")
            script = soup.find("script", id="__NEXT_DATA__")
            if script:
                data = json.loads(script.string)
                ads = data.get("props", {}).get("pageProps", {}).get("ads", [])
                print(f"Encontrados {len(ads)} anúncios no JSON.")
                for i, ad in enumerate(ads[:3]):
                    images = ad.get("images", [])
                    image_url = images[0].get("original", "") if images else "None"
                    print(f"Ad {i}: {ad.get('subject')} | Image: {image_url}")
            else:
                print("Script __NEXT_DATA__ não encontrado na OLX.")
        except Exception as e:
            print(f"Erro OLX: {e}")

if __name__ == "__main__":
    asyncio.run(test_olx())
