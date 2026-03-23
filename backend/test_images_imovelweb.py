import asyncio
import httpx
from bs4 import BeautifulSoup
import re

async def test_scraper():
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    }
    url = "https://www.imovelweb.com.br/imoveis-aluguel-sao-paulo-sp.html"
    
    async with httpx.AsyncClient(headers=headers, follow_redirects=True) as client:
        try:
            print(f"Buscando {url}...")
            resp = await client.get(url, timeout=15)
            html = resp.text
            soup = BeautifulSoup(html, "html.parser")
            
            items = soup.find_all("div", attrs={"data-qa": "posting-card"})
            print(f"Encontrados {len(items)} itens.")
            
            for i, item in enumerate(items[:5]):
                img_el = item.find("img")
                if img_el:
                    src = img_el.get("src")
                    data_src = img_el.get("data-src")
                    other_attrs = {k: v for k, v in img_el.attrs.items() if k not in ['src', 'data-src']}
                    print(f"Item {i}: src={src} | data-src={data_src} | others={other_attrs}")
                else:
                    print(f"Item {i}: Nenhuma tag <img> encontrada.")
                    
        except Exception as e:
            print(f"Erro: {e}")

if __name__ == "__main__":
    asyncio.run(test_scraper())
